import storage from "./storage"
import parser from "./parser"
import {
  CachedGroup,
  CachedInstitute,
  CachedTimetable,
  ExamsTimetableItem,
  HalfTerm,
  TimetableItem,
  TimetableType
} from "./types";
import Util from "./TimetableUtil";

// storage keys
const LAST_OPENED_INSTITUTE = "last_opened_institute";
const INSTITUTES = "institutes";
const GROUPS = "groups";
const LECTURERS = "lecturers";
const DEPARTMENTS = "departments";
const SELECTIVE_GROUPS = "selective_groups";
const TIMETABLES = "cached_timetables";
const EXAMS_TIMETABLES = "cached_exams_timetables";
const TIMETABLE = "timetable_";
const PARTIAL_GROUPS_1 = "partial_groups_1";
const PARTIAL_GROUPS_2 = "partial_groups_2";
const PARTIAL_TIMETABLE = "partial_timetable_";
const EXAMS_TIMETABLE = "exams_timetable_";
const UPDATED = "_updated";

class TimetableManager {
  private institutes: CachedInstitute[] = [];
  private groups: CachedGroup[] = [];
  private selectiveGroups: CachedGroup[] = [];

  private timetables: CachedTimetable[] = [];
  private examsTimetables: CachedTimetable[] = [];
  
  private lastOpenedInstitute: string | null = null;

  private firstHalfTermGroups: string[] = [];
  private secondHalfTermGroups: string[] = [];

  private departments: string[] = [];
  private lecturers: string[] = [];

  async init() {
    const type = window.location.pathname.split("/").at(-1);

    // request data from server if needed
    this.groups = await this.getData(GROUPS, parser.getGroups);
    this.selectiveGroups = await this.getData(SELECTIVE_GROUPS, parser.getSelectiveGroups);
    this.lecturers = await this.getData(LECTURERS, parser.getLecturers);

    // not essential data for first paint
    this.getData(INSTITUTES, parser.getInstitutes).then(data => this.institutes = data);
    if (type === "lecturer") 
      this.getData(DEPARTMENTS, parser.getLecturerDepartments)
        .then(data => this.departments = data);

    // cache only data
    this.timetables = (await storage.getItem(TIMETABLES)) || [];
    storage.getItem(EXAMS_TIMETABLES).then(data => this.examsTimetables = data || []);
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

  firstLayerItemExists(type: TimetableType, query: string) {
    const isInstitute = this.institutes.includes(query);
    switch (type) {
      case "selective":
        return !isInstitute &&
          this.selectiveGroups.some((group) => Util.startsWithLetters(group, query));
      case "lecturer":
        return !isInstitute &&
          this.departments.some((department) => Util.startsWithLetters(department, query));
      case "timetable":
        return isInstitute;
      default:
        return false;
    }
  }

  async getSecondLayerByType(type: TimetableType, query: string) {
    switch (type) {
      case "selective":
        const data = await this.getSelectiveGroups();
        const tempGroups = new Set<string>(data.map((group) => Util.getGroupName(group, type)));
        return [...tempGroups].filter((group) => Util.startsWithLetters(group, query));
      case "lecturer":
        return (await this.getLecturerDepartments()).filter((group) => Util.startsWithLetters(group, query));
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

  async getLastOpenedInstitute() {
    if (this.lastOpenedInstitute) return this.lastOpenedInstitute;
    return storage.getItem(LAST_OPENED_INSTITUTE) as Promise<string | undefined>;
  }

  async updateLastOpenedInstitute(institute: string) {
    this.lastOpenedInstitute = institute;
    return storage.setItem(LAST_OPENED_INSTITUTE, institute);
  }

  async getPartialTimetable(group: string, halfTerm: 1 | 2, checkCache = true) {
    if (!(await this.ifPartialTimetableExists(group, halfTerm)))
      throw new Error(`Group ${group} does not exist or does't have ${halfTerm} term partial timetable`);

    const key = PARTIAL_TIMETABLE + group + "_" + halfTerm;

    if (checkCache) 
      return await this.getData(key, parser.getPartialTimetable, group, halfTerm);
    
    const data = await parser.getPartialTimetable(group, halfTerm);
    if (!data) throw new Error(`Failed to get partial timetable! Group: ${group}, halfTerm: ${halfTerm}`);
    this.updateCache(key, data);
    return data;
  }

  async getPartials(group: string): Promise<HalfTerm[]> {
    const result: HalfTerm[] = [];
    const addPartial = async (halfTerm: HalfTerm) => {
      if (await this.ifPartialTimetableExists(group, halfTerm)) result.push(halfTerm);
    };
    await addPartial(HalfTerm.First);
    await addPartial(HalfTerm.Second);
    return result;
  }

  async getTimetable(group: string, type?: TimetableType, checkCache = true) {
    group = group.trim();
    const data = this.timetables.find(el => el.group.toUpperCase() === group.toUpperCase());
    if (checkCache && data && !Util.needsUpdate(data.time)) {
      return storage.getItem(TIMETABLE + group) as Promise<TimetableItem[]>;
    }

    const timetableType = type ?? this.tryToGetType(group);
    if (!timetableType) throw Error(`Couldn't define a type! Group: ${group}`);

    const timetable = await parser.getTimetable(timetableType, group);
    if (!timetable) throw Error(`Failed to get timetable! Group: ${group}`);

    this.timetables = this.timetables.filter(
      el => el.group.toUpperCase() !== group.toUpperCase()
    );
    this.timetables.push({
      group: group,
      time: Date.now(),
      subgroup: data?.subgroup
    });
    storage.setItem(TIMETABLES, this.timetables);
    storage.setItem(TIMETABLE + group, timetable);
    return timetable;
  }

  async getExamsTimetable(group: string, type?: TimetableType, checkCache = true) {
    group = group.trim();
    const data = this.examsTimetables.find(el => el.group.toUpperCase() === group.toUpperCase());
    if (checkCache && data && !Util.needsUpdate(data.time)) {
      return storage.getItem(EXAMS_TIMETABLE + group) as Promise<ExamsTimetableItem[]>;
    }
    const timetableType = type ?? this.tryToGetType(group);
    if (!timetableType) throw Error(`Couldn't define a type! Group: ${group}`);

    const examsTimetable = await parser.getExamsTimetable(timetableType, group);
    if (!examsTimetable) throw Error(`Failed to get exams timetable! Group: ${group}`);

    this.examsTimetables = this.examsTimetables.filter(
      el => el.group.toUpperCase() !== group.toUpperCase()
    ); 
    this.examsTimetables.push({ group: group, time: Date.now() });

    storage.setItem(EXAMS_TIMETABLES, this.examsTimetables);
    storage.setItem(EXAMS_TIMETABLE + group, examsTimetable);
    return examsTimetable;
  }

  updateSubgroup(group?: string, subgroup: 1 | 2 = 1) {
    if (!group) return;
    group = group.trim();

    const data = this.timetables.find(el => el.group === group);
    if (!data) throw Error(`Failed to update subgroup! Group: ${group}`);
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

  tryToGetType(timetable: string): TimetableType | undefined {
    timetable = timetable.trim();
    const compare = (el: string) => el.toUpperCase() === timetable.toUpperCase();
    if (this.groups.some(compare)) return 'timetable';
    if (this.selectiveGroups.some(compare)) return 'selective';
    if (this.lecturers.some(compare)) return 'lecturer';
  }

  getCachedTimetables() {
    return this.timetables;
  }

  getCachedTime(group: string, isExams = false) {
    if (isExams)
      return this.examsTimetables.find(el => el.group === group)?.time;
    return this.timetables.find(el => el.group === group)?.time;
  }

  get cachedInstitutes() {
    return this.institutes;
  }

  get cachedGroups() {
    return this.groups;
  }

  get cachedSelectiveGroups() {
    return this.selectiveGroups;
  }

  get cachedLecturers() {
    return this.lecturers;
  }

  private async getInstitutes(): Promise<CachedInstitute[]> {
    if (this.institutes.length > 0) return this.institutes;
    return this.institutes = await this.getData(INSTITUTES, parser.getInstitutes);
  }

  private async ifPartialTimetableExists(group: string, halfTerm: 1 | 2) {
    if (!this.groups.includes(group)) return false;
    const partialGroups = await this.getPartialGroups(halfTerm);
    return partialGroups.includes(group);
  }

  private async getPartialGroups(halfTerm: 1 | 2) {
    if (halfTerm === 1) {
      if (this.firstHalfTermGroups.length !== 0) return this.firstHalfTermGroups;
      const data = await this.getData(PARTIAL_GROUPS_1, parser.getPartialGroups, halfTerm);
      this.firstHalfTermGroups = data;
      return data;
    } else {
      if (this.secondHalfTermGroups.length !== 0) return this.secondHalfTermGroups;
      const data = await this.getData(PARTIAL_GROUPS_2, parser.getPartialGroups, halfTerm);
      this.secondHalfTermGroups = data;
      return data;
    }
  }

  private async getTimetableGroups(institute?: string): Promise<string[]> {
    const key = GROUPS + (institute ? ("_" + institute) : "");
    if (!institute && this.groups.length > 0) return this.groups;

    const data = await this.getData(key, parser.getGroups, institute);
    if (!institute) this.groups = data;
    return data;
  }

  private async getSelectiveGroups(): Promise<string[]> {
    if (this.selectiveGroups.length > 0) return this.selectiveGroups;
    return this.selectiveGroups = await this.getData(SELECTIVE_GROUPS, parser.getSelectiveGroups);
  }

  private async getLecturers(department?: string): Promise<string[]> {
    if (this.lecturers.length > 0 && !department) return this.lecturers;
    const lecturers = await parser.getLecturers(department);
    if (!department) {
      this.updateCache(LECTURERS, lecturers);
      this.lecturers = lecturers;
    }
    return lecturers;
  }

  private async getLecturerDepartments(): Promise<string[]> {
    if (this.departments.length > 0) return this.departments;
    return this.departments = await this.getData(DEPARTMENTS, parser.getLecturerDepartments);
  }

  
  private async getData<T>(cacheKey: string, parserFn: (...params: any[]) => Promise<T>, ...parserArgs: any[]) {
    const cached = await this.getFromCache<T>(cacheKey);
    if (cached) return cached;

    console.log("Getting data from server", cacheKey);
    const data = await parserFn.call(parser, ...parserArgs);
    this.updateCache(cacheKey, data);
    return data as T;
  }

  private async getFromCache<T>(key: string) {
    const cached = await storage.getItem(key);
    const updated = await storage.getItem(key + UPDATED);
    if (cached && !Util.needsUpdate(updated)) return cached as T;
  }

  private updateCache(key: string, data: any) {
    storage.setItem(key, data);
    storage.setItem(key + UPDATED, Date.now());
  }
}

export default new TimetableManager();