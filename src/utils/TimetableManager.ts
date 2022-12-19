import storage from "./storage"
import parser from "./parser"
import { CachedGroup, CachedInstitute, CachedTimetable } from "./types";

const UPDATE_PERIOD = 3 * 24 * 60 * 60 * 1000; // 3 days

class TimetableManager {
	private institutes: CachedInstitute[] = [];
	private groups: CachedGroup[] = [];
	private timetables: CachedTimetable[] = [];
	private institutesRequest: Promise<CachedInstitute[]> | null  = null;
	private groupsRequest: Promise<CachedGroup[]> | null  = null;

	async init() {
		this.institutes = (await storage.getItem("institutes")) || [];
		this.groups = (await storage.getItem("groups")) || [];
		this.timetables = (await storage.getItem("cached_timetables")) || [];

		const institutesUpdated = await storage.getItem("institutes_updated");
		if (this.institutes.length === 0 || needsUpdate(institutesUpdated)) {
			console.log("Downloading institute list...");
			this.requestInstitutes(true);
		}

		const groupsUpdated = await storage.getItem("groups_updated");
		if (this.groups.length === 0 || needsUpdate(groupsUpdated)) {
			console.log("Downloading group list...");
			this.requestGroups(true);
		}
	}

	async requestInstitutes(force: boolean = false) {
		if (this.institutesRequest) return this.institutesRequest;
		return this.institutesRequest = this.getInstitutes(force);
	}

	async getInstitutes(force: boolean = false) {
		if (this.institutes.length > 0 && !force) return this.institutes;
		const institutes = await parser.getInstitutes();
		storage.setItem("institutes", institutes);
		storage.setItem('institutes_updated', Date.now());
		this.institutes = institutes;
		return institutes;
	}

	async requestGroups(force: boolean = false) { // only for all
		if (this.groupsRequest) return this.groupsRequest;
		return this.groupsRequest = this.getGroups(undefined, force);
	}

	async getGroups(institute: string | undefined = undefined, force: boolean = false): Promise<string[]> {
		let suffix = institute ? ("_" + institute) : "";
		if (!institute && this.groups.length > 0 && !force) return this.groups;
		if (institute) {
			const cached = await storage.getItem("groups" + suffix);
			if (cached && !force) {
				const updated = await storage.getItem("groups" + suffix + "_updated");
				if (!needsUpdate(updated)) return cached;
			}
		}

		const groups = await parser.getGroups(institute);

		if (!institute) {
			this.groups = groups;
		}

		storage.setItem("groups" + suffix, groups);
		storage.setItem("groups" + suffix + "_updated", Date.now());
		return groups;
	}

	// TODO: remove
	getSyncGroups(): CachedGroup[] {
		return this.groups;
	}

	async getTimetable(group: string, checkCache = true) {
		const data = this.timetables.find(el => el.group === group.toUpperCase());
		if (checkCache && data && !needsUpdate(data.time)) {
			return storage.getItem("timetable_" + group.toUpperCase());
		}

		const timetable = await parser.getTimetable(group);
		if (!timetable) {
			throw Error(`Failed to get timetable! Group: ${group}, checkCache: ${checkCache}`);
		}
		this.timetables = this.timetables.filter(el => el.group !== group.toUpperCase()) // remove previous timetable
		this.timetables.push({
			group: group.toUpperCase(),
			time: Date.now(),
			subgroup: 1
		})
		storage.setItem("cached_timetables", this.timetables);
		storage.setItem("timetable_" + group.toUpperCase(), timetable);
		return timetable;
	}

	updateSubgroup(group: string | undefined, subgroup: 1 | 2) {
		if (!group) return;

		const data = this.timetables.find(el => el.group === group.toUpperCase());
		if (!data) {
			console.error(`Failed to update timetable subgroup! Group: ${group}`);
			return;
		}
		if (data.subgroup === subgroup) return;

		this.timetables = this.timetables.filter(el => el.group !== group.toUpperCase()) // remove previous timetable
		this.timetables.push({
			group: group.toUpperCase(),
			time: Date.now(),
			subgroup: subgroup
		})
		storage.setItem("cached_timetables", this.timetables);
	}

	getSubgroup(group: string | undefined) {
		if (!group) return;
		const data = this.timetables.find(el => el.group === group.toUpperCase());
		if (!data) return;
		return data.subgroup;
	}


	async deleteTimetable(group: string) {
		this.timetables = this.timetables.filter(el => el.group !== group.toUpperCase());
		storage.deleteItem("timetable_" + group.toUpperCase());
		return storage.setItem("cached_timetables", this.timetables);
	}

	ifGroupExists(group: string) {
		return this.groups.find(el => el === group.toUpperCase().trim()) ? true : false;
	}

	getCachedTimetables() {
		return this.timetables;
	}

	getCachedTime(group: string) {
		const timetable = this.timetables.find(el => el.group === group);
		return timetable?.time;
	}

	clearCache() {
		storage.clear();
		this.timetables = [];
		this.groups = [];
		this.institutes = [];
	}

	getCachedInstitutes() {
		return this.institutes;
	}

	getCachedGroups() {
		return this.groups;
	}

	async updateTimetable(group: string) {
		return this.getTimetable(group, false);
	}

	searchGroups(query: string) {
		query = query.toLowerCase().replace("-", "");
		if (!this.groups) return [];
		return this.groups.filter(group => {
			return group.toLowerCase().replace("-", "").startsWith(query);
		})
	}
}

function needsUpdate(timestamp: number) {
	if (!timestamp) return true;
	return navigator.onLine && (Date.now() - UPDATE_PERIOD > timestamp);
}

export default new TimetableManager();