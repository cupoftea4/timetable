import storage from '../storage';
import * as Util from '../timetable';
import { DEVELOP } from '../constants';
import LPNUData from './LPNUData';
import FallbackData from './CachedData';
import Toast from '../toasts';
import {
  type CachedGroup,
  type CachedInstitute,
  type CachedTimetable,
  type ExamsTimetableItem,
  type MergedTimetable,
  type TimetableItem,
  type TimetableType,
  HalfTerm
} from '@/types/timetable';
import type { RenderPromises, ActualPromise, OptimisticPromise } from '@/types/utils';

// storage keys
const LAST_OPENED_INSTITUTE = 'last_opened_institute';
const LAST_OPENED_TIMETABLE = 'last_opened_timetable';

const INSTITUTES = 'institutes';
const GROUPS = 'groups';
const LECTURERS = 'lecturers';
const DEPARTMENTS = 'departments';
const SELECTIVE_GROUPS = 'selective_groups';
const TIMETABLES = 'cached_timetables';
const EXAMS_TIMETABLES = 'cached_exams_timetables';
const TIMETABLE = 'timetable_';
const PARTIAL_GROUPS_1 = 'partial_groups_1';
const PARTIAL_GROUPS_2 = 'partial_groups_2';
const PARTIAL_TIMETABLE = 'partial_timetable_';
const EXAMS_TIMETABLE = 'exams_timetable_';
const UPDATED = '_updated';

const MERGED_TIMETABLE = 'my';

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
    this.timetables = (await storage.getItem(TIMETABLES)) ?? [];
    this.mergedTimetable = (await storage.getItem(MERGED_TIMETABLE)) ?? null;
    storage.getItem<CachedTimetable[]>(EXAMS_TIMETABLES).then((data) => {
      this.examsTimetables = data ?? [];
    });

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
      case 'selective': {
        const data = await this.getSelectiveGroups();
        const tempGroups = new Set<string>(data.map((group) => Util.getGroupName(group, type)));
        return Util.getFirstLetters([...tempGroups]);
      }
      case 'lecturer':
        return Util.getFirstLetters(await this.getLecturerDepartments());
      default:
        return await this.getInstitutes();
    }
  }

  firstLayerItemExists(type: TimetableType, query: string) {
    const isInstitute = this.institutes.includes(query);
    switch (type) {
      case 'selective':
        return !isInstitute && this.selectiveGroups.some((group) => Util.startsWithLetters(group, query));
      case 'lecturer':
        return (
          !isInstitute && this.departments.some((department) => Util.startsWithLetters(department, query))
        );
      case 'timetable':
        return isInstitute;
      default:
        return false;
    }
  }

  async getSecondLayerByType(type: TimetableType, query: string) {
    switch (type) {
      case 'selective': {
        const data = await this.getSelectiveGroups();
        const tempGroups = new Set<string>(data.map((group) => Util.getGroupName(group, type)));
        return [...tempGroups].filter((group) => Util.startsWithLetters(group, query));
      }
      case 'lecturer':
        return (await this.getLecturerDepartments()).filter((group) => Util.startsWithLetters(group, query));
      default: {
        const groups = await this.getTimetableGroups(query);
        return [...new Set<string>(groups.map((group) => Util.getGroupName(group, type)))];
      }
    }
  }

  async getThirdLayerByType(type: TimetableType, query: string) {
    switch (type) {
      case 'selective': {
        const data = await this.getSelectiveGroups();
        return data.filter((group) => Util.getGroupName(group, type) === query);
      }
      case 'lecturer':
        return await this.getLecturers(query);
      default: {
        const groups = await this.getTimetableGroups();
        return groups.filter((group) => Util.getGroupName(group, type) === query);
      }
    }
  }

  async getLastOpenedInstitute(): Promise<string | undefined> {
    if (this.lastOpenedInstitute) return this.lastOpenedInstitute;
    return await storage.getItem<string>(LAST_OPENED_INSTITUTE);
  }

  async getLastOpenedTimetable(): Promise<string | undefined> {
    if (this.lastOpenedTimetable) return this.lastOpenedTimetable;
    return await storage.getItem<string>(LAST_OPENED_TIMETABLE);
  }

  async updateLastOpenedInstitute(institute: string) {
    this.lastOpenedInstitute = institute;
    return await storage.setItem(LAST_OPENED_INSTITUTE, institute);
  }

  async updateLastOpenedTimetable(timetable: string) {
    this.lastOpenedTimetable = timetable;
    return await storage.setItem(LAST_OPENED_TIMETABLE, timetable);
  }

  async getPartialTimetable(group: string, halfTerm: 1 | 2, checkCache = true) {
    if (!(await this.ifPartialTimetableExists(group, halfTerm))) {
      throw new Error(`Group ${group} does not exist or does't have ${halfTerm} term partial timetable`);
    }

    const key = PARTIAL_TIMETABLE + group + '_' + halfTerm;

    if (checkCache) {
      return await this.getData(key, LPNUData.getPartialTimetable, group, halfTerm);
    }

    const data = await LPNUData.getPartialTimetable(group, halfTerm);
    if (!data) throw new Error(`Failed to get partial timetable! Group: ${group}, halfTerm: ${halfTerm}`);
    this.updateCache(key, data);
    return data;
  }

  async getPartials(group: string): Promise<HalfTerm[]> {
    const temp = await Promise.allSettled(
      [HalfTerm.First, HalfTerm.Second].map((halfTerm) => this.ifPartialTimetableExists(group, halfTerm))
    );
    return temp
      .map((el, i) => (el.status === 'fulfilled' && el.value ? i + 1 : false))
      .filter((el) => el) as HalfTerm[];
  }

  getTimetable(group: string, type?: TimetableType, checkCache = true): RenderPromises<TimetableItem[]> {
    const groupName = group.trim();
    const timetableType = type ?? this.tryToGetType(groupName);
    if (!timetableType) throw Error(`Couldn't define a type! Group: ${groupName}`);

    if (timetableType === 'merged') return this.getMergedTimetable();

    let cacheData: OptimisticPromise<TimetableItem[]>;
    const data = this.timetables.find((el) => el.group.toLowerCase() === groupName.toLowerCase());

    if (checkCache && data && !Util.needsUpdate(data.time)) {
      cacheData = storage.getItem(TIMETABLE + groupName);
    } else {
      cacheData = FallbackData.getTimetable(timetableType, groupName).catch(() =>
        storage.getItem(TIMETABLE + groupName)
      );
    }

    const fetchData: ActualPromise<TimetableItem[]> = LPNUData.getTimetable(timetableType, groupName) // doesn't work
      .catch(() => {
        cacheData.then((t) => this.saveTimetableLocally(groupName, t, data?.subgroup));
        Toast.warn('Data is possibly outdated!');
        return null;
      });

    fetchData.then((t) => this.saveTimetableLocally(groupName, t, data?.subgroup));
    return [cacheData, fetchData as any] as const;
  }

  getExamsTimetable(
    group: string,
    type?: TimetableType,
    checkCache = true
  ): RenderPromises<ExamsTimetableItem[]> {
    const groupName = group.trim();
    const timetableType = type ?? this.tryToGetType(groupName);
    if (!timetableType) throw Error(`Couldn't define a type! Group: ${groupName}`);

    let cacheData: OptimisticPromise<ExamsTimetableItem[]>;
    const data = this.examsTimetables.find((el) => el.group.toLowerCase() === groupName.toLowerCase());

    if (checkCache && data && !Util.needsUpdate(data.time)) {
      cacheData = storage.getItem(EXAMS_TIMETABLE + groupName);
    } else {
      cacheData = FallbackData.getExamsTimetable(timetableType, groupName).catch(() =>
        storage.getItem(EXAMS_TIMETABLE + groupName)
      );
    }

    const fetchData: ActualPromise<ExamsTimetableItem[]> = LPNUData.getExamsTimetable(
      timetableType,
      groupName
    ).catch((e) => {
      console.warn('LPNU API is not working!', e);
      cacheData.then((t) => this.saveExamsLocally(groupName, t));
      Toast.warn('Data is possibly outdated!');
      return null;
    });

    fetchData.then((t) => this.saveExamsLocally(groupName, t));
    return [cacheData, fetchData] as const;
  }

  saveTimetableLocally(group: string, timetable?: TimetableItem[] | null, subgroup?: 1 | 2) {
    if (!timetable) return;
    this.timetables = this.timetables.filter((el) => el.group.toLowerCase() !== group.toLowerCase());
    this.timetables.push({
      group,
      time: Date.now(),
      subgroup
    });
    storage.setItem(TIMETABLE + group, timetable);
    storage.setItem(TIMETABLES, this.timetables);
    return timetable;
  }

  saveExamsLocally(group: string, timetable?: ExamsTimetableItem[] | null) {
    if (!timetable) return;
    this.examsTimetables = this.examsTimetables.filter(
      (el) => el.group.toLowerCase() !== group.toLowerCase()
    );
    this.examsTimetables.push({ group, time: Date.now() });
    storage.setItem(EXAMS_TIMETABLE + group, timetable);
    storage.setItem(EXAMS_TIMETABLES, this.examsTimetables);
    return timetable;
  }

  getMergedTimetable(timetablesToMerge?: string[]): RenderPromises<TimetableItem[]> {
    const timetableNames =
      timetablesToMerge ??
      this.mergedTimetable?.timetables ??
      ((this.mergedTimetable as any)?.timetableNames as string[]); // for backward compatibility
    if (!timetableNames) throw Error("Merge doesn't exist!");
    const timetables = timetableNames.map((el) => ({ name: el, data: this.getTimetable(el) }));
    const cachePromises = timetables.map(({ name, data }) =>
      data[0].then((timetable) => ({ timetable, name }))
    );
    const fetchPromises = timetables.map(({ name, data }) =>
      data[1].then((timetable) => ({ timetable, name }))
    );
    const cacheData: OptimisticPromise<TimetableItem[]> = Promise.all(cachePromises).then((timetables) =>
      Util.mergeTimetables(timetables)
    );

    const fetchData: ActualPromise<TimetableItem[]> = Promise.all(fetchPromises)
      .then((timetables) => {
        const merged = Util.mergeTimetables(timetables);
        this.saveMergedTimetable(timetableNames);
        return merged;
      })
      .catch(() => {
        cacheData.then((merged) => merged && this.saveMergedTimetable(timetableNames));
        Toast.warn('Data is possibly outdated!');
        return null;
      });
    return [cacheData, fetchData] as const;
  }

  updateSubgroup(group?: string, subgroup: 1 | 2 = 1) {
    if (!group) return;
    group = group.trim();

    if (Util.isMerged(group)) {
      if (!this.mergedTimetable) throw Error("Updating subgroup: Merge doesn't exist!");
      this.mergedTimetable = {
        ...this.mergedTimetable,
        subgroup
      };
      return storage.setItem(MERGED_TIMETABLE, this.mergedTimetable);
    }

    const data = this.timetables.find((el) => el.group === group);
    if (!data) throw Error(`Failed to update subgroup! Group: ${group}`);
    if (data.subgroup === subgroup) return;

    this.timetables = this.timetables.filter((el) => el.group !== group); // remove previous timetable
    this.timetables.push({
      group,
      time: data.time,
      subgroup
    });
    return storage.setItem(TIMETABLES, this.timetables);
  }

  getSubgroup(group?: string) {
    if (!group) return;

    if (Util.isMerged(group)) {
      if (!this.mergedTimetable) {
        if (DEVELOP) console.error("Getting subgroup: Merge doesn't exist!");
        return 1;
      }
      return this.mergedTimetable.subgroup;
    }

    group = group.trim();
    const data = this.timetables.find((el) => el.group === group);
    if (!data) return;
    return data.subgroup;
  }

  deleteTimetable(group: string) {
    if (Util.isMerged(group)) {
      this.mergedTimetable = null;
      return storage.deleteItem(MERGED_TIMETABLE);
    }
    group = group.trim();
    this.timetables = this.timetables.filter((el) => el.group !== group);
    storage.deleteItem(TIMETABLE + group);
    return storage.setItem(TIMETABLES, this.timetables);
  }

  saveMergedTimetable(timetablesToMerge: string[]) {
    this.mergedTimetable = {
      group: 'Мій розклад',
      time: Date.now(),
      subgroup: this.mergedTimetable?.subgroup ?? 1,
      timetables: timetablesToMerge
    };
    return storage.setItem(MERGED_TIMETABLE, this.mergedTimetable);
  }

  tryToGetType(timetable: string): TimetableType | undefined {
    timetable = timetable.trim();
    const compare = (el: string) => el.toLowerCase() === timetable.toLowerCase();
    if (this.groups.some(compare)) return 'timetable';
    if (this.selectiveGroups.some(compare)) return 'selective';
    if (this.lecturers.some(compare)) return 'lecturer';
    if (timetable === MERGED_TIMETABLE) return 'merged';

    // try to guess the type based on the name
    const numberOfDashes = timetable.split('-').length - 1;
    const containsNumbers = /\d/.test(timetable);

    if (!containsNumbers) return 'lecturer';
    if (numberOfDashes === 1) return 'timetable';
    if (numberOfDashes === 2) return 'selective';

    return 'timetable'; // FIXME temporary allow to fetch unknown groups
  }

  getCachedTimetables() {
    return this.timetables;
  }

  getCachedTime(group: string, isExams = false) {
    if (isExams) {
      return this.examsTimetables.find((el) => el.group === group)?.time;
    }
    return this.timetables.find((el) => el.group === group)?.time;
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
    this.institutes = await this.getData(INSTITUTES, FallbackData.getInstitutes);
    return this.institutes;
  }

  private async ifPartialTimetableExists(group: string, halfTerm: 1 | 2) {
    // if (!this.groups.includes(group)) return false;
    // const partialGroups = await this.getPartialGroups(halfTerm);
    // return partialGroups.includes(group);
    return false;
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
    const key = GROUPS + (institute ? '_' + institute : '');
    if (!institute && this.groups.length > 0) return this.groups;

    const data = await this.getData(key, FallbackData.getGroups, institute);
    if (!institute) this.groups = data;
    return data;
  }

  private async getSelectiveGroups(): Promise<string[]> {
    if (this.selectiveGroups.length > 0) return this.selectiveGroups;
    this.selectiveGroups = await this.getData(SELECTIVE_GROUPS, FallbackData.getSelectiveGroups);
    return this.selectiveGroups;
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
    this.departments = await this.getData(DEPARTMENTS, FallbackData.getLecturerDepartments);
    return this.departments;
  }

  private async getData<T>(cacheKey: string, fn: (...params: any[]) => Promise<T>, ...args: any[]) {
    const cached = await this.getFromCache<T>(cacheKey);
    if (Array.isArray(cached) && cached.length > 0) return cached;
    if (!Array.isArray(cached) && cached) return cached;

    if (DEVELOP) console.log('Getting data from server', cacheKey);
    const binding = cacheKey.includes('partial') ? LPNUData : FallbackData; // TODO: fix this
    const data: T = await fn.call(binding, ...args).catch(async () => {
      if (DEVELOP) console.log('Failed to get data from server', cacheKey);
      const cached = await this.getFromCache<T>(cacheKey, true);
      if (cached) return cached;
      throw Error('Failed to get data from server');
    });
    this.updateCache(cacheKey, data);
    return data;
  }

  private async getFromCache<T>(key: string, force = false) {
    const cached = await storage.getItem(key);
    const updated = await storage.getItem<number>(key + UPDATED);
    if (cached && updated && (!Util.needsUpdate(updated) || force)) return cached as T;
  }

  private updateCache(key: string, data: any) {
    storage.setItem(key, data);
    storage.setItem(key + UPDATED, Date.now());
  }
}

const manager = new TimetableManager();

export default manager;
