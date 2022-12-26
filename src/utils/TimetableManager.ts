import storage from "./storage"
import parser from "./parser"
import { CachedGroup, CachedInstitute, CachedTimetable, ExamsTimetableItem, TimetableItem, TimetableType } from "./types";

const UPDATE_PERIOD = 3 * 24 * 60 * 60 * 1000; // 3 days

// storage keys
const LAST_OPENED_INSTITUTE = "last_opened_institute";
const INSTITUTES = "institutes";
const GROUPS = "groups";
const SELECTIVE_GROUPS = "selective_groups";
const TIMETABLES = "cached_timetables";
const EXAMS_TIMETABLES = "cached_exams_timetables";
const TIMETABLE = "timetable_";
const EXAMS_TIMETABLE = "exams_timetable_";
const UPDATED = "_updated";

class TimetableManager {
	private institutes: CachedInstitute[] = [];
	private groups: CachedGroup[] = [];
	private selectiveGroups: CachedGroup[] = [];
	private timetables: CachedTimetable[] = [];
	private examsTimetables: CachedTimetable[] = [];
	private institutesRequest: Promise<CachedInstitute[]> | null  = null;
	private groupsRequest: Promise<CachedGroup[]> | null  = null;
	private lastOpenedInstitute: string | null = null;

	async init() {
		try {
			this.institutes = (await storage.getItem(INSTITUTES)) || [];
			this.groups = (await storage.getItem(GROUPS)) || [];
			this.timetables = (await storage.getItem(TIMETABLES)) || [];
			this.selectiveGroups = (await storage.getItem(SELECTIVE_GROUPS)) || [];
		} catch (e) { 
			// sometimes chrome throws an error while trying to access idb
			throw new Error("[TimetableManager.init] Error while loading cached data: " + e);
		}
		
		const institutesUpdated = await storage.getItem(INSTITUTES + UPDATED);
		if (this.institutes.length === 0 || needsUpdate(institutesUpdated)) {
			console.log("Downloading institute list...");
			this.requestInstitutes(true);
		}

		const groupsUpdated = await storage.getItem(GROUPS + UPDATED);
		if (this.groups.length === 0 || needsUpdate(groupsUpdated)) {
			console.log("Downloading group list...");
			this.requestGroups(true);
		}

		const selectiveGroupsUpdated = await storage.getItem(SELECTIVE_GROUPS + UPDATED);
		if (this.selectiveGroups.length === 0 || needsUpdate(selectiveGroupsUpdated)) {
			console.log("Downloading selective group list...");
			this.getSelectiveGroups(true);
		}
	}

	isInited() {
		return this.institutes.length > 0 && this.groups.length > 0 && this.selectiveGroups.length > 0;
	}

	changeTimetableType(type: TimetableType) {
		parser.setTimetableType(type);
	}

	async requestInstitutes(force: boolean = false) {
		if (this.institutesRequest) return this.institutesRequest;
		return this.institutesRequest = this.getInstitutes(force);
	}

	async getLastOpenedInstitute() {
		if (this.lastOpenedInstitute) return this.lastOpenedInstitute;
		return storage.getItem(LAST_OPENED_INSTITUTE);
	}

	async updateLastOpenedInstitute(institute: string) {
		this.lastOpenedInstitute = institute;
		return storage.setItem(LAST_OPENED_INSTITUTE, institute);
	}

	async getInstitutes(force: boolean = false) {
		if (this.institutes.length > 0 && !force) return this.institutes;
		const institutes = await parser.getInstitutes();
		storage.setItem(INSTITUTES, institutes);
		storage.setItem(INSTITUTES + UPDATED, Date.now());
		this.institutes = institutes;
		return institutes;
	}

	async requestGroups(force: boolean = false) { // only for all
		if (this.groupsRequest) return this.groupsRequest;
		return this.groupsRequest = this.getGroups(undefined, force);
	}

	async getGroups(institute?: string, force: boolean = false): Promise<string[]> {
		console.log(parser.getTimetableType());
		
		if (parser.getTimetableType() === "selective") return this.getSelectiveGroups(force);
		return this.getTimetableGroups(institute, force);
	}

	private async getTimetableGroups(institute?: string, force: boolean = false): Promise<string[]> {
		let suffix = institute ? ("_" + institute) : "";
		if (!institute && this.groups.length > 0 && !force) return this.groups;
		if (institute) {
			const cached = await storage.getItem(GROUPS + suffix);
			if (cached && !force) {
				const updated = await storage.getItem(GROUPS + suffix + UPDATED);
				if (!needsUpdate(updated)) return cached;
			}
		}
		const	groups = await parser.getGroups(institute);

		if (!institute) {
			this.groups = groups;
		}

		storage.setItem(GROUPS + suffix, groups);
		storage.setItem(GROUPS + suffix + UPDATED, Date.now());
		return groups;
	}

	private async getSelectiveGroups(force: boolean = false): Promise<string[]> {
		console.log("getSelectiveGroups", this.selectiveGroups);
		
		if (this.selectiveGroups.length > 0 && !force) return this.selectiveGroups;
		const cached = await storage.getItem(SELECTIVE_GROUPS);
		if (cached && !force) {
			const updated = await storage.getItem(SELECTIVE_GROUPS + UPDATED);
			if (!needsUpdate(updated)) return cached;
		}
		const	groups = await parser.getSelectiveGroups();
		console.log("getSelectiveGroups 2", groups);
		
		this.selectiveGroups = groups;

		storage.setItem(SELECTIVE_GROUPS, groups);
		storage.setItem(SELECTIVE_GROUPS + UPDATED, Date.now());
		return groups;
	}

	async getTimetable(group: string, checkCache = true) : Promise<TimetableItem[]> {
		group = group.trim();
		const data = this.timetables.find(el => el.group.toUpperCase() === group.toUpperCase());
		if (checkCache && data && !needsUpdate(data.time)) {
			return storage.getItem(TIMETABLE + group);
		}			
		
		const timetable = await parser.getTimetable(group);

		if (!timetable) {
			throw Error(`Failed to get timetable! Group: ${group}, checkCache: ${checkCache}`);
		}
		this.timetables = this.timetables.filter(el => el.group.toUpperCase() !== group.toUpperCase()); // remove previous timetable
		this.timetables.push({
			group: group,
			time: Date.now(),
			subgroup: 1
		});
		storage.setItem(TIMETABLES, this.timetables);
		storage.setItem(TIMETABLE + group, timetable);
		return timetable;
	}

	async getExamsTimetable(group: string, checkCache = true) : Promise<ExamsTimetableItem[]> {
		group = group.trim();
		const data = this.examsTimetables.find(el => el.group.toUpperCase() === group.toUpperCase());
		if (checkCache && data && !needsUpdate(data.time)) {
			return storage.getItem(EXAMS_TIMETABLE + group);
		}

		const examsTimetable = await parser.getExamsTimetable(group);
		if (!examsTimetable) {
			throw Error(`Failed to get exams timetable! Group: ${group}, checkCache: ${checkCache}`);
		}
		this.examsTimetables = this.examsTimetables.filter(el => el.group.toUpperCase() !== group.toUpperCase()); // remove previous timetable
		this.examsTimetables.push({
			group: group,
			time: Date.now()
		});
		storage.setItem(EXAMS_TIMETABLES, this.examsTimetables);
		storage.setItem(EXAMS_TIMETABLES + "_" + group, examsTimetable);
		return examsTimetable;
	}


	updateSubgroup(group?: string, subgroup: 1 | 2 = 1) {
		if (!group) return;
		group = group.trim();
		const data = this.timetables.find(el => el.group === group);
		if (!data) {
			console.error(`Failed to update timetable subgroup! Group: ${group}`);
			return;
		}
		if (data.subgroup === subgroup) return;

		this.timetables = this.timetables.filter(el => el.group !== group) // remove previous timetable
		this.timetables.push({
			group: group,
			time: data.time,
			subgroup: subgroup
		})
		return storage.setItem(TIMETABLES, this.timetables);
	}

	getSubgroup(group?: string) {
		if (!group) return;
		group = group.trim();
		const data = this.timetables.find(el => el.group === group);
		if (!data) return;
		return data.subgroup;
	}


	async deleteTimetable(group: string) {
		group = group.trim();
		this.timetables = this.timetables.filter(el => el.group !== group);
		storage.deleteItem(TIMETABLE + group);
		return storage.setItem(TIMETABLES, this.timetables);
	}

	ifGroupExists(group: string) {
		group = group.trim();
		const compare = (el: string) => el.toUpperCase() === group.toUpperCase();
		return (this.groups.find(compare) || this.selectiveGroups.find(compare));
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