import storage from "./storage"
import {
  CachedGroup,
  CachedInstitute,
  CachedTimetable,
  ExamsTimetableItem,
  HalfTerm,
  MergedTimetable,
  TimetableItem,
  TimetableType
} from "./types";
import Util from "./TimetableUtil";
import { DEVELOP } from "./constants";
import LPNUData from "./LPNUData";
import FallbackData from "./CachedData";
import * as handler from "../utils/requestHandler";

// storage keys
const LAST_OPENED_INSTITUTE = "last_opened_institute";
const LAST_OPENED_TIMETABLE = "last_opened_timetable";

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

const MERGED_TIMETABLE = "my";

class TimetableManager {
  private institutes: CachedInstitute[] = [];
  private groups: CachedGroup[] = [];
  private selectiveGroups: CachedGroup[] = [];

  private timetables: CachedTimetable[] = [];
  private examsTimetables: CachedTimetable[] = [];
  private mergedTimetable: MergedTimetable | null = null;
  
  private lastOpenedInstitute: string | null = null;
  private lastOpenedTimetable: string | null = null;

  private firstHalfTermGroups: string[] = [];
  private secondHalfTermGroups: string[] = [];

  private departments: string[] = [];
  private lecturers: string[] = [];

  async init() {
    // cache only data
    this.timetables = (await storage.getItem(TIMETABLES)) || [];
    this.mergedTimetable = (await storage.getItem(MERGED_TIMETABLE)) || null;
    storage.getItem(EXAMS_TIMETABLES).then(data => this.examsTimetables = data || []);
    
    // request data from server if needed
    this.groups = await this.getData(GROUPS, FallbackData.getGroups);
    this.selectiveGroups = await this.getData(SELECTIVE_GROUPS, FallbackData.getSelectiveGroups);
    this.lecturers = await this.getData(LECTURERS, FallbackData.getLecturers);
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

  async getLastOpenedInstitute() : Promise<string | undefined> {
    if (this.lastOpenedInstitute) return this.lastOpenedInstitute;
    return storage.getItem(LAST_OPENED_INSTITUTE) as Promise<string | undefined>;
  }

  async getLastOpenedTimetable() : Promise<string | undefined> {
    if (this.lastOpenedTimetable) return this.lastOpenedTimetable;
    return storage.getItem(LAST_OPENED_TIMETABLE) as Promise<string | undefined>;
  }

  async updateLastOpenedInstitute(institute: string) {
    this.lastOpenedInstitute = institute;
    return storage.setItem(LAST_OPENED_INSTITUTE, institute);
  }

  async updateLastOpenedTimetable(timetable: string) {
    this.lastOpenedTimetable = timetable;
    return storage.setItem(LAST_OPENED_TIMETABLE, timetable);
  }

  async getPartialTimetable(group: string, halfTerm: 1 | 2, checkCache = true) {
    if (!(await this.ifPartialTimetableExists(group, halfTerm)))
      throw new Error(`Group ${group} does not exist or does't have ${halfTerm} term partial timetable`);

    const key = PARTIAL_TIMETABLE + group + "_" + halfTerm;

    if (checkCache) 
      return await this.getData(key, LPNUData.getPartialTimetable, group, halfTerm);
    
    const data = await LPNUData.getPartialTimetable(group, halfTerm);
    if (!data) throw new Error(`Failed to get partial timetable! Group: ${group}, halfTerm: ${halfTerm}`);
    this.updateCache(key, data);
    return data;
  }

  async getPartials(group: string): Promise<HalfTerm[]> {
    const temp = await Promise.allSettled([HalfTerm.First, HalfTerm.Second]
      .map((halfTerm) => this.ifPartialTimetableExists(group, halfTerm)));
    return temp
      .map((el, i) => el.status === "fulfilled" && el.value ? i + 1 : false)
      .filter(el => el) as HalfTerm[];
  }

  getTimetable(group: string, type?: TimetableType, checkCache = true) {
    const timetableType = type ?? this.tryToGetType(group);
    if (!timetableType) throw Error(`Couldn't define a type! Group: ${group}`);
    if (timetableType === 'merged') return this.getMergedTimetable();

    let cacheData: Promise<TimetableItem[] | undefined>, fetchData: Promise<TimetableItem[] | null>;
    group = group.trim();
    const data = this.timetables.find(el => el.group.toUpperCase() === group.toUpperCase());

    if (data && !Util.needsUpdate(data.time)) {
      cacheData = storage.getItem(TIMETABLE + group);
    } else {
      cacheData = FallbackData.getTimetable(timetableType, group)
        .catch(() => storage.getItem(TIMETABLE + group));
    }

    const setStorageData = (timetable: TimetableItem[] | null | undefined) => {
      if(!timetable) return;
      this.timetables = this.timetables.filter(
        el => el.group.toUpperCase() !== group.toUpperCase()
      );
      this.timetables.push({
        group: group,
        time: Date.now(),
        subgroup: data?.subgroup
      });
      storage.setItem(TIMETABLE + group, timetable);
      storage.setItem(TIMETABLES, this.timetables);
    }

    fetchData = LPNUData.getTimetable(timetableType, group).catch(() => {
      cacheData.then(setStorageData);
      handler.warn("Data is possibly outdated!");
      return null;
    });

    fetchData.then(setStorageData);
    
    return [cacheData, fetchData] as const;
  }

  getMergedTimetable() {
    if (!this.mergedTimetable) throw Error("Merge doesn't exist!");
    let cacheData: Promise<TimetableItem[] | undefined>, fetchData: Promise<TimetableItem[] | null>;
    const timetables = this.mergedTimetable.timetables.map(el => this.getTimetable(el));
    const cachePromises = timetables.map(([cache]) => cache);
    const fetchPromises = timetables.map(([_, fetch]) => fetch);
    cacheData = Promise.all(cachePromises).then(timetables => {
      const merged = Util.mergeTimetables(timetables);
      return merged;
    });
    fetchData = Promise.all(fetchPromises).then(timetables => {
      const merged = Util.mergeTimetables(timetables)
      return merged;
    }).catch(() => {
      handler.warn("Data is possibly outdated!");
      return null;
    });
    return [cacheData, fetchData] as const;
  }


  getExamsTimetable(group: string, type?: TimetableType, checkCache = true) {
    let cacheData: Promise<ExamsTimetableItem[]>, fetchData: Promise<ExamsTimetableItem[] | null>;
    group = group.trim();
    const data = this.examsTimetables.find(el => el.group.toUpperCase() === group.toUpperCase());
    const timetableType = type ?? this.tryToGetType(group);
    if (!timetableType) throw Error(`Couldn't define a type! Group: ${group}`);

    if (checkCache && data && !Util.needsUpdate(data.time)) {
      cacheData = storage.getItem(EXAMS_TIMETABLE + group);      
    } else {
      cacheData = FallbackData.getExamsTimetable(timetableType, group);
    }

    this.examsTimetables = this.examsTimetables.filter(
      el => el.group.toUpperCase() !== group.toUpperCase()
    );
    this.examsTimetables.push({ group: group, time: Date.now() });

    const setStorageData = (timetable: ExamsTimetableItem[] | null) => {
      if(!timetable) return;
      storage.setItem(EXAMS_TIMETABLE + group, timetable);
      storage.setItem(EXAMS_TIMETABLES, this.examsTimetables);
    }

    fetchData = LPNUData.getExamsTimetable(timetableType, group).catch(() => {
      cacheData.then(setStorageData);
      handler.warn("Data is possibly outdated!");
      return null;
    });

    fetchData.then(setStorageData);
    
    return [cacheData, fetchData] as const;
  }

  updateSubgroup(group?: string, subgroup: 1 | 2 = 1) {
    if (!group) return;
    group = group.trim();

    if (Util.isMerged(group)) {
      if (!this.mergedTimetable) throw Error("Merge doesn't exist!");
      this.mergedTimetable = {
        ...this.mergedTimetable,
        subgroup: subgroup
      }
      return storage.setItem(MERGED_TIMETABLE, this.mergedTimetable);
    }

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
    
    if (Util.isMerged(group)) {
      if (!this.mergedTimetable) throw Error("Merge doesn't exist!");
      return this.mergedTimetable.subgroup;
    }
    
    group = group.trim();
    const data = this.timetables.find(el => el.group === group);
    if (!data) return;
    return data.subgroup;
  }

  deleteTimetable(group: string) {
    if (Util.isMerged(group)) {
      this.mergedTimetable = null;
      return storage.deleteItem(MERGED_TIMETABLE);
    }
    group = group.trim();
    this.timetables = this.timetables.filter(el => el.group !== group);
    storage.deleteItem(TIMETABLE + group);
    return storage.setItem(TIMETABLES, this.timetables);
  }

  saveMergedTimetable(timetable: TimetableItem[], timetablesToMerge: string[]) {
    this.mergedTimetable = {
      group: "Мій розклад",
      time: Date.now(),
      subgroup: 1,
      timetables: timetablesToMerge,
    }
    return storage.setItem(MERGED_TIMETABLE,  this.mergedTimetable);
  }

  tryToGetType(timetable: string): TimetableType | undefined {
    timetable = timetable.trim();
    const compare = (el: string) => el.toUpperCase() === timetable.toUpperCase();
    if (this.groups.some(compare)) return 'timetable';
    if (this.selectiveGroups.some(compare)) return 'selective';
    if (this.lecturers.some(compare)) return 'lecturer';
    if (timetable === MERGED_TIMETABLE) return 'merged';
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

  get cachedMergedTimetable() {
    return this.mergedTimetable;
  }

  private async getInstitutes(): Promise<CachedInstitute[]> {
    if (this.institutes.length > 0) return this.institutes;
    return this.institutes = await this.getData(INSTITUTES, FallbackData.getInstitutes);
  }

  private async ifPartialTimetableExists(group: string, halfTerm: 1 | 2) {
    if (!this.groups.includes(group)) return false;
    const partialGroups = await this.getPartialGroups(halfTerm);
    return partialGroups.includes(group);
  }

  private async getPartialGroups(halfTerm: 1 | 2) {
    if (halfTerm === 1) {
      if (this.firstHalfTermGroups.length !== 0) return this.firstHalfTermGroups;
      const data = await this.getData(PARTIAL_GROUPS_1, LPNUData.getPartialGroups, halfTerm);
      this.firstHalfTermGroups = data;
      return data;
    } else {
      if (this.secondHalfTermGroups.length !== 0) return this.secondHalfTermGroups;
      const data = await this.getData(PARTIAL_GROUPS_2, LPNUData.getPartialGroups, halfTerm);
      this.secondHalfTermGroups = data;
      return data;
    }
  }

  private async getTimetableGroups(institute?: string): Promise<string[]> {
    const key = GROUPS + (institute ? ("_" + institute) : "");
    if (!institute && this.groups.length > 0) return this.groups;

    const data = await this.getData(key, FallbackData.getGroups, institute);
    if (!institute) this.groups = data;
    return data;
  }

  private async getSelectiveGroups(): Promise<string[]> {
    if (this.selectiveGroups.length > 0) return this.selectiveGroups;
    return this.selectiveGroups = await this.getData(SELECTIVE_GROUPS, FallbackData.getSelectiveGroups);
  }

  private async getLecturers(department?: string): Promise<string[]> {
    if (this.lecturers.length > 0 && !department) return this.lecturers;
    const lecturers = await FallbackData.getLecturers(department);
    if (!department) {
      this.updateCache(LECTURERS, lecturers);
      this.lecturers = lecturers;
    }
    return lecturers;
  }

  private async getLecturerDepartments(): Promise<string[]> {
    if (this.departments.length > 0) return this.departments;
    return this.departments = await this.getData(DEPARTMENTS, FallbackData.getLecturerDepartments);
  }

  
  private async getData<T>(cacheKey: string, fn: (...params: any[]) => Promise<T>, ...args: any[]) {    
    const cached = await this.getFromCache<T>(cacheKey);
    if (Array.isArray(cached) && cached.length > 0) return cached;
    if (!Array.isArray(cached) && cached) return cached;
    
    if (DEVELOP) console.log("Getting data from server", cacheKey);
    const binding = (cacheKey.includes("partial")) ? LPNUData : FallbackData; // TODO: fix this
    const data: T = await fn.call(binding, ...args).catch(async () => {
      if (DEVELOP) console.log("Failed to get data from server", cacheKey);
      const cached = await this.getFromCache<T>(cacheKey, true);
      if (cached) return cached;
      throw Error("Failed to get data from server");
    });
    this.updateCache(cacheKey, data);
    return data;
  }

  private async getFromCache<T>(key: string, force = false) {
    const cached = await storage.getItem(key);
    const updated = await storage.getItem(key + UPDATED);
    if (cached && (!Util.needsUpdate(updated) || force )) return cached as T;
  }

  private updateCache(key: string, data: any) {
    storage.setItem(key, data);
    storage.setItem(key + UPDATED, Date.now());
  }
}

const manager = new TimetableManager();

export default manager;