import {
  type CachedInstitute,
  type ExamsTimetableItem,
  HalfTerm,
  type MergedTimetableItem,
  type TimetableItem,
  type TimetablePageType,
  type TimetableType,
} from "@/types/timetable";
import type { ActualPromise, OptimisticPromise, RenderPromises } from "@/types/utils";
import { sortGroups } from "@/utils/timetable";
import { DEVELOP } from "../constants";
import * as Util from "../timetable";
import LocalCache, { type CacheData, type CacheKey } from "../timetableStorage";
import Toast from "../toasts";
import FallbackData from "./CachedData";
import LPNUData from "./LPNUData";

const MERGED_TIMETABLE = "my";

class TimetableManager {
  async init(type?: TimetablePageType) {
    await LocalCache.initRamCache(type);

    return Promise.all([
      this.getData("groups", FallbackData, FallbackData.getGroups).then((data) =>
        LocalCache.set("groups", sortGroups(data ?? []))
      ),
      this.getData("selectiveGroups", FallbackData, FallbackData.getSelectiveGroups).then((data) =>
        LocalCache.set("selectiveGroups", sortGroups(data ?? []))
      ),
      this.getData("lecturers", FallbackData, FallbackData.getLecturers).then((data) =>
        LocalCache.set("lecturers", data)
      ),
    ]).catch((e) => console.error(e));
  }

  isInited() {
    return LocalCache.isInited();
  }

  async getFirstLayerSelectionByType(type: TimetableType) {
    switch (type) {
      case "selective": {
        const data = await this.getSelectiveGroups();
        const tempGroups = new Set<string>(data.map((group) => Util.getGroupName(group, type)));
        return Util.getFirstLetters([...tempGroups]);
      }
      case "lecturer":
        return Util.getFirstLetters(await this.getLecturerDepartments());
      default:
        return await this.getInstitutes();
    }
  }

  firstLayerItemExists(type: TimetableType, query: string) {
    const isInstitute = LocalCache.sync.institutes?.includes(query);
    switch (type) {
      case "selective":
        return !isInstitute && LocalCache.sync.selectiveGroups?.some((g) => Util.startsWithLetters(g, query));
      case "lecturer":
        return !isInstitute && LocalCache.sync.departments?.some((d) => Util.startsWithLetters(d, query));
      case "timetable":
        return isInstitute;
      default:
        return false;
    }
  }

  async getSecondLayerByType(type: TimetableType, query: string) {
    switch (type) {
      case "selective": {
        const data = await this.getSelectiveGroups();
        const tempGroups = new Set<string>(data.map((group) => Util.getGroupName(group, type)));
        return [...tempGroups].filter((group) => Util.startsWithLetters(group, query));
      }
      case "lecturer":
        return (await this.getLecturerDepartments()).filter((group) => Util.startsWithLetters(group, query));
      default: {
        const groups = await this.getTimetableGroups(query);
        return [...new Set<string>(groups.map((group) => Util.getGroupName(group, type)))];
      }
    }
  }

  async getThirdLayerByType(type: TimetableType, query: string) {
    switch (type) {
      case "selective": {
        const data = await this.getSelectiveGroups();
        return data.filter((group) => Util.getGroupName(group, type) === query);
      }
      case "lecturer":
        return await this.getLecturers(query);
      default: {
        const groups = await this.getTimetableGroups();
        return groups.filter((group) => Util.getGroupName(group, type) === query);
      }
    }
  }

  async getLastOpenedInstitute(): Promise<string | undefined> {
    return LocalCache.get("lastOpenedInstitute").then((t) => t?.data);
  }

  async getLastOpenedTimetable(): Promise<string | undefined> {
    return LocalCache.get("lastOpenedTimetable").then((t) => t?.data);
  }

  async updateLastOpenedInstitute(institute: string) {
    return LocalCache.set("lastOpenedInstitute", institute);
  }

  async updateLastOpenedTimetable(timetable: string) {
    return LocalCache.set("lastOpenedTimetable", timetable);
  }

  async getPartials(group: string): Promise<HalfTerm[]> {
    const temp = await Promise.allSettled(
      [HalfTerm.First, HalfTerm.Second].map((halfTerm) => this.ifPartialTimetableExists(group, halfTerm))
    );
    return temp
      .map((el, i) => (el.status === "fulfilled" && el.value ? i + 1 : false))
      .filter((el) => el) as HalfTerm[];
  }

  getTimetable(group: string, type?: TimetableType, checkCache = true): RenderPromises<TimetableItem[]> {
    const groupName = group.trim();
    const timetableType = type ?? this.tryToGetType(groupName);
    if (!timetableType) throw Error(`Couldn't define a type! Group: ${groupName}`);

    if (timetableType === "merged") return this.getMergedTimetable();

    let cacheData: OptimisticPromise<TimetableItem[]>;
    const data = LocalCache.sync.savedTimetables?.find((el) => el.group.toLowerCase() === groupName.toLowerCase());

    if (checkCache && data && !Util.needsUpdate(data.time)) {
      cacheData = LocalCache.get(`timetable_${groupName}`).then((t) => t?.data);
    } else {
      // TODO: implement server cache
      // cacheData = FallbackData.getTimetable(timetableType, groupName).catch(() =>
      //   storage.getItem(TIMETABLE + groupName)
      // );
      cacheData = Promise.resolve(null);
    }

    const fetchData: ActualPromise<TimetableItem[]> = LPNUData.getTimetable(timetableType, groupName) // doesn't work
      .catch(() => {
        cacheData.then((t) => this.saveTimetableLocally(groupName, t, data?.subgroup));
        Toast.warn("Data is possibly outdated!");
        return null;
      });

    fetchData.then((t) => this.saveTimetableLocally(groupName, t, data?.subgroup));
    return [cacheData, fetchData] as const;
  }

  getExamsTimetable(group: string, type?: TimetableType, checkCache = true): RenderPromises<ExamsTimetableItem[]> {
    const groupName = group.trim();
    const timetableType = type ?? this.tryToGetType(groupName);
    if (!timetableType) throw Error(`Couldn't define a type! Group: ${groupName}`);

    let cacheData: OptimisticPromise<ExamsTimetableItem[]>;
    const data = LocalCache.sync.examsTimetables?.find((el) => el.group.toLowerCase() === groupName.toLowerCase());

    if (checkCache && data && !Util.needsUpdate(data.time)) {
      cacheData = LocalCache.get(`exams_timetable_${groupName}`).then((t) => t?.data);
    } else {
      cacheData = FallbackData.getExamsTimetable(timetableType, groupName).catch(() =>
        LocalCache.get(`exams_timetable_${groupName}`).then((t) => t?.data)
      );
    }

    const fetchData: ActualPromise<ExamsTimetableItem[]> = LPNUData.getExamsTimetable(timetableType, groupName).catch(
      (e) => {
        console.warn("LPNU API is not working!", e);
        cacheData.then((t) => this.saveExamsLocally(groupName, t));
        Toast.warn("Data is possibly outdated!");
        return null;
      }
    );

    fetchData.then((t) => this.saveExamsLocally(groupName, t));
    return [cacheData, fetchData] as const;
  }

  async saveTimetableLocally(group: string, timetable?: TimetableItem[] | null, subgroup?: 1 | 2) {
    if (!timetable) return;
    const saved = LocalCache.sync.savedTimetables?.filter((el) => el.group.toLowerCase() !== group.toLowerCase()) ?? [];
    await LocalCache.set("savedTimetables", [...saved, { group, time: Date.now(), subgroup }]);
    await LocalCache.set(`timetable_${group}`, timetable);
    return timetable;
  }

  async saveExamsLocally(group: string, timetable?: ExamsTimetableItem[] | null) {
    if (!timetable) return;
    const saved = LocalCache.sync.examsTimetables?.filter((el) => el.group.toLowerCase() !== group.toLowerCase()) ?? [];
    await LocalCache.set("examsTimetables", [...saved, { group, time: Date.now() }]);
    await LocalCache.set(`exams_timetable_${group}`, timetable);
    return timetable;
  }

  getMergedTimetable(timetablesToMerge?: string[]): RenderPromises<TimetableItem[]> {
    const timetableNames = timetablesToMerge ?? LocalCache.sync.mergedTimetable?.timetables;
    if (!timetableNames) throw Error("Merge doesn't exist!");
    const timetables = timetableNames.map((el) => ({ name: el, data: this.getTimetable(el) }));
    const cachePromises = timetables.map(({ name, data }) => data[0].then((timetable) => ({ timetable, name })));
    const fetchPromises = timetables.map(({ name, data }) => data[1].then((timetable) => ({ timetable, name })));
    const cacheData: OptimisticPromise<MergedTimetableItem[]> = Promise.all(cachePromises)
      .then((timetables) => Util.mergeTimetables(timetables))
      .catch((err) => {
        console.error("Failed to merge timetables from cache", err);
        return null;
      });

    const fetchData: ActualPromise<TimetableItem[]> = Promise.all(fetchPromises)
      .then((timetables) => {
        const merged = Util.mergeTimetables(timetables);
        this.saveMergedTimetable(timetableNames);
        return merged;
      })
      .catch(() => {
        cacheData.then((merged) => merged && this.saveMergedTimetable(timetableNames));
        Toast.warn("Data is possibly outdated!");
        return null;
      });
    return [cacheData, fetchData] as const;
  }

  async updateSubgroup(groupName?: string, subgroup: 1 | 2 = 1) {
    if (!groupName) return;
    const group = groupName.trim();

    if (Util.isMerged(group)) {
      const mergedTimetable = (await LocalCache.get("mergedTimetable")).data;
      if (!mergedTimetable) throw Error("Updating subgroup: Merge doesn't exist!");
      return LocalCache.set("mergedTimetable", {
        ...mergedTimetable,
        subgroup,
      });
    }

    const data = LocalCache.sync.savedTimetables?.find((el) => el.group === group);
    if (!data) throw Error(`Failed to update subgroup! Group: ${group}`);
    if (data.subgroup === subgroup) return;

    const savedTimetables = LocalCache.sync.savedTimetables?.filter((el) => el.group !== group) ?? []; // remove previous timetable
    return LocalCache.set("savedTimetables", [...savedTimetables, { group, time: data.time, subgroup }]);
  }

  getSubgroup(groupName?: string) {
    if (!groupName) return;

    if (Util.isMerged(groupName)) {
      const mergedTimetable = LocalCache.sync.mergedTimetable;
      if (!mergedTimetable) {
        if (DEVELOP) console.error("Getting subgroup: Merge doesn't exist!");
        return;
      }
      return mergedTimetable.subgroup;
    }

    const groupNameClean = groupName.trim();
    const data = LocalCache.sync.savedTimetables?.find((el) => el.group === groupNameClean);
    if (!data) {
      if (DEVELOP) console.error(`Failed to get subgroup! Group: ${groupNameClean}`);
      return;
    }
    return data.subgroup ?? 1;
  }

  async deleteTimetable(groupName: string) {
    if (Util.isMerged(groupName)) {
      LocalCache.set("mergedTimetable", undefined);
      return;
    }
    const groupNameClean = groupName.trim();
    await LocalCache.set(
      "savedTimetables",
      LocalCache.sync.savedTimetables?.filter((el) => el.group !== groupNameClean)
    );
    await LocalCache.set(`timetable_${groupNameClean}`, undefined);
  }

  saveMergedTimetable(timetablesToMerge: string[]) {
    const mergedTimetable = {
      group: "Мій розклад",
      time: Date.now(),
      subgroup: LocalCache.sync.mergedTimetable?.subgroup ?? 1,
      timetables: timetablesToMerge,
    };
    return LocalCache.set("mergedTimetable", mergedTimetable);
  }

  tryToGetType(timetableName: string): TimetableType | undefined {
    const timetable = timetableName.trim();
    const compare = (el: string) => el.toLowerCase() === timetable.toLowerCase();
    if (LocalCache.sync.groups?.some(compare)) return "timetable";
    if (LocalCache.sync.selectiveGroups?.some(compare)) return "selective";
    if (LocalCache.sync.lecturers?.some(compare)) return "lecturer";
    if (timetable === MERGED_TIMETABLE) return "merged";

    // try to guess the type based on the name
    const numberOfDashes = timetable.split("-").length - 1;
    const containsNumbers = /\d/.test(timetable);

    if (!containsNumbers) return "lecturer";
    if (numberOfDashes === 1) return "timetable";
    if (numberOfDashes === 2) return "selective";

    return "timetable"; // FIXME temporary allow to fetch unknown groups
  }

  get cachedTimetables() {
    return LocalCache.sync.savedTimetables ?? [];
  }

  getCachedTime(group: string, isExams = false) {
    if (isExams) {
      return LocalCache.sync.examsTimetables?.find((el) => el.group === group)?.time;
    }
    if (Util.isMerged(group)) {
      return LocalCache.sync.mergedTimetable?.time;
    }
    return LocalCache.sync.savedTimetables?.find((el) => el.group === group)?.time;
  }

  get cachedInstitutes() {
    return LocalCache.sync.institutes;
  }

  get cachedGroups() {
    return LocalCache.sync.groups ?? [];
  }

  get cachedSelectiveGroups() {
    return LocalCache.sync.selectiveGroups ?? [];
  }

  get cachedLecturers() {
    return LocalCache.sync.lecturers ?? [];
  }

  get cachedMergedTimetable() {
    return LocalCache.sync.mergedTimetable;
  }

  private async getInstitutes(): Promise<CachedInstitute[]> {
    return this.getData("institutes", FallbackData, FallbackData.getInstitutes).then((i) => i ?? []);
  }

  private async ifPartialTimetableExists(_group: string, _halfTerm: 1 | 2) {
    return false;
  }

  private async getTimetableGroups(institute?: string): Promise<string[]> {
    return await this.getData(
      `${institute ? (`groups_${institute}` as const) : ("groups" as const)}`,
      FallbackData,
      FallbackData.getGroups,
      institute
    ).then((g) => g ?? []);
  }

  private getSelectiveGroups(): Promise<string[]> {
    return this.getData("selectiveGroups", FallbackData, FallbackData.getSelectiveGroups).then((g) => g ?? []);
  }

  private getLecturers(department?: string): Promise<string[]> {
    return this.getData("lecturers", FallbackData, FallbackData.getLecturers, department).then((l) => l ?? []);
  }

  private getLecturerDepartments(): Promise<string[]> {
    return this.getData("departments", FallbackData, FallbackData.getLecturerDepartments).then((d) => d ?? []);
  }

  private async getData<K extends CacheKey, P extends unknown[]>(
    key: K,
    binding: typeof LPNUData | typeof FallbackData,
    fn: (...params: P) => Promise<CacheData[K]>,
    ...args: P
  ): Promise<CacheData[K] | undefined> {
    if (DEVELOP) console.log("Getting data", key);
    const cached = (await LocalCache.get(key)).data;
    if (Array.isArray(cached) && cached.length > 0) return cached;
    if (!Array.isArray(cached) && cached) return cached;

    if (DEVELOP) console.log("Getting data from server", cached);
    const data: CacheData[K] | undefined = await fn.call(binding, ...args).catch(async () => {
      if (DEVELOP) console.log("Failed to get data from server", key);
      const cached = await LocalCache.get(key, true);
      if (cached) return cached.data;
      throw Error("Failed to get data from server");
    });
    if (data) LocalCache.set(key, data);
    return data;
  }
}

const manager = new TimetableManager();

export default manager;
