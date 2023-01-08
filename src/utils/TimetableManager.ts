import storage from "./storage"
import parser from "./parser"
import { 
	CachedGroup, 
	CachedInstitute, 
	CachedTimetable, 
	ExamsTimetableItem, 
	TimetableItem, 
	TimetableType 
} from "./types";
import Util from "./TimetableUtil";

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

	private departments: string[] = [];
	private lecturers: string[] = [];

	async init() {
		try {
			this.institutes = (await storage.getItem(INSTITUTES)) || [];
			this.groups = (await storage.getItem(GROUPS)) || [];
			this.timetables = (await storage.getItem(TIMETABLES)) || [];
			this.examsTimetables = (await storage.getItem(EXAMS_TIMETABLES)) || [];
			this.selectiveGroups = (await storage.getItem(SELECTIVE_GROUPS)) || [];
			this.lecturers = (await storage.getItem("lecturers")) || [];
		} catch (e) { 
			// sometimes chrome throws an error while trying to access idb
			throw new Error("[TimetableManager.init] Error while loading cached data: " + e);
		}
		
		const institutesUpdated = await storage.getItem(INSTITUTES + UPDATED);
		if (this.institutes.length === 0 || Util.needsUpdate(institutesUpdated)) {
			console.log("Downloading institute list...");
			await this.requestInstitutes(true);
		}

		const groupsUpdated = await storage.getItem(GROUPS + UPDATED);
		if (this.groups.length === 0 || Util.needsUpdate(groupsUpdated)) {
			console.log("Downloading group list...");
			await this.requestGroups(true);
		}

		const selectiveGroupsUpdated = await storage.getItem(SELECTIVE_GROUPS + UPDATED);
		if (this.selectiveGroups.length === 0 || Util.needsUpdate(selectiveGroupsUpdated)) {
			console.log("Downloading selective group list...");
			await this.getSelectiveGroups(true);
		}

		const lecturersUpdated = await storage.getItem("lecturers" + UPDATED);
		if (this.lecturers.length === 0 || Util.needsUpdate(lecturersUpdated)) {
			console.log("Downloading lecturers list...");
			await this.getLecturers(undefined, true);
		}
		
	}

	isInited() {
		return this.institutes.length > 0 && this.groups.length > 0 && this.selectiveGroups.length > 0;
	}

	async getFirstLayerSelectionByType(type: TimetableType) {
		switch (type) {
			case "selective":
				const data = await this.getSelectiveGroups();
				const tempGroups = new Set<string>(data.map((group) => Util.getGroupName(group, type))); 
				return Util.getFirstLetters([...tempGroups]);
			case "lecturer":
				return Util.getFirstLetters(await this.getLecturerDepartments());
			default: 
				return this.getInstitutes();
		}
	}

	async getSecondLayerByType(type: TimetableType, query: string) {
		switch (type) {
			case "selective":
				const data = await this.getSelectiveGroups();
				const tempGroups = new Set<string>(data.map((group) => Util.getGroupName(group, type)));
				return [...tempGroups].filter((group) => 
					group.startsWith(query?.at(0) ?? "") || group.startsWith(query.at(-1) ?? ""));
			case "lecturer":
				return (await this.getLecturerDepartments()).filter((group) => 
					group.startsWith(query?.at(0) ?? "") || group.startsWith(query.at(-1) ?? ""));
			default:
				const groups = await this.getTimetableGroups(query);
				return [...new Set<string>(groups.map((group) => Util.getGroupName(group, type)))];
		}
	}

	async getThirdLayerByType(type: TimetableType, query: string) {
		switch (type) {
			case "selective":
				const data = await this.getSelectiveGroups();
				return data.filter(group => Util.getGroupName(group, type) === query);
			case "lecturer":
				return await this.getLecturers(query);
			default:
				const groups = await this.getTimetableGroups();
				return groups.filter(group => Util.getGroupName(group, type) === query);
		}
	}

	async getLecturers(department?: string, force = false): Promise<string[]> {
		if (this.lecturers.length > 0 && !force && !department) return this.lecturers;
		const lecturers = await parser.getLecturers(department);
		if (!department) {
			storage.setItem("lecturers", lecturers);
			storage.setItem("lecturers" + UPDATED, Date.now());
			this.lecturers = lecturers;
		}
		return lecturers;
	}

	async getLecturerDepartments(force = false): Promise<string[]> {
		if (this.departments.length > 0 && !force) return this.departments;
		const departments = await parser.getLecturerDepartments();
		storage.setItem("departments_", departments);
		storage.setItem("departments" + UPDATED, Date.now());
		this.departments = departments;
		return departments;
	}

	async getTimetable(group: string, type?: TimetableType, checkCache = true) : Promise<TimetableItem[]> {
		group = group.trim();
		const data = this.timetables.find(el => el.group.toUpperCase() === group.toUpperCase());
		if (checkCache && data && !Util.needsUpdate(data.time)) {
			return storage.getItem(TIMETABLE + group);
		}			
		const timetableType = type ?? this.tryToGetType(group);
		if (!timetableType) {
			throw Error(`Couldn't define a type! Group: ${group}, checkCache: ${checkCache}`);
		}
		const timetable = await parser.getTimetable(timetableType, group);

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

	async getExamsTimetable(group: string, type?: TimetableType, checkCache = true) : Promise<ExamsTimetableItem[]> {
		group = group.trim();
		const data = this.examsTimetables.find(el => el.group.toUpperCase() === group.toUpperCase());
		if (checkCache && data && !Util.needsUpdate(data.time)) {
			return storage.getItem(EXAMS_TIMETABLE + group);
		}
		const timetableType = type ?? this.tryToGetType(group);
		if (!timetableType) {
			throw Error(`Couldn't define a type! Group: ${group}, checkCache: ${checkCache}`);
		}
		const examsTimetable = await parser.getExamsTimetable(timetableType, group);
		if (!examsTimetable) {
			throw Error(`Failed to get exams timetable! Group: ${group}, checkCache: ${checkCache}`);
		}
		this.examsTimetables = this.examsTimetables.filter(el => el.group.toUpperCase() !== group.toUpperCase()); // remove previous timetable
		this.examsTimetables.push({
			group: group,
			time: Date.now()
		});
		storage.setItem(EXAMS_TIMETABLES, this.examsTimetables);
		storage.setItem(EXAMS_TIMETABLE + group, examsTimetable);
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

	deleteTimetable(group: string) {
		group = group.trim();
		this.timetables = this.timetables.filter(el => el.group !== group);
		storage.deleteItem(TIMETABLE + group);
		return storage.setItem(TIMETABLES, this.timetables);
	}

	ifTimetableExists(timetable: string) {
		return this.tryToGetType(timetable);
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

	getCachedSelectiveGroups() {
		return this.selectiveGroups;
	}

	getCachedLecturers() {
		return this.lecturers;
	}

	updateTimetable(type: TimetableType, group: string) {
		return this.getTimetable(group, type, false);
	}

	async requestInstitutes(force: boolean = false) {
		if (this.institutesRequest) return this.institutesRequest;
		return this.institutesRequest = this.getInstitutes(force);
	}

	async getLastOpenedInstitute() {
		if (this.lastOpenedInstitute) return this.lastOpenedInstitute;
		return storage.getItem(LAST_OPENED_INSTITUTE) as Promise<string>;
	}

	async updateLastOpenedInstitute(institute: string) {
		this.lastOpenedInstitute = institute;
		return storage.setItem(LAST_OPENED_INSTITUTE, institute);
	}

	async getInstitutes(force: boolean = false): Promise<CachedInstitute[]> {
		if (this.institutes.length > 0 && !force) return this.institutes;
		const institutes = await parser.getInstitutes();
		storage.setItem(INSTITUTES, institutes);
		storage.setItem(INSTITUTES + UPDATED, Date.now());
		this.institutes = institutes;
		return institutes;
	}

	async requestGroups(force: boolean = false) { // only for all groups
		if (this.groupsRequest) return this.groupsRequest;
		return this.groupsRequest = this.getTimetableGroups(undefined, force);
	}

	private async getTimetableGroups(institute?: string, force: boolean = false): Promise<string[]> {
		let suffix = institute ? ("_" + institute) : "";
		if (!institute && this.groups.length > 0 && !force) return this.groups;
		if (institute) {
			const cached = await storage.getItem(GROUPS + suffix);
			if (cached && !force) {
				const updated = await storage.getItem(GROUPS + suffix + UPDATED);
				if (!Util.needsUpdate(updated)) return cached;
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
		if (this.selectiveGroups.length > 0 && !force) return this.selectiveGroups;
		const cached = await storage.getItem(SELECTIVE_GROUPS);
		if (cached && !force) {
			const updated = await storage.getItem(SELECTIVE_GROUPS + UPDATED);
			if (!Util.needsUpdate(updated)) return cached;
		}
		const	groups = await parser.getSelectiveGroups();
		
		this.selectiveGroups = groups;

		storage.setItem(SELECTIVE_GROUPS, groups);
		storage.setItem(SELECTIVE_GROUPS + UPDATED, Date.now());
		return groups;
	}

	tryToGetType(timetable: string): TimetableType | undefined {
		timetable = timetable.trim();
		const compare = (el: string) => el.toUpperCase() === timetable.toUpperCase();
		if (this.groups.find(compare)) return 'timetable';
		if (this.selectiveGroups.find(compare)) return 'selective';
		if (this.lecturers.find(compare)) return 'lecturer';
	}

	searchGroups(query: string) {
		query = query.toLowerCase().replace("-", "");
		if (!this.groups) return [];
		return this.groups.filter(group => {
			return group.toLowerCase().replace("-", "").startsWith(query);
		})
	}
}

export default new TimetableManager();