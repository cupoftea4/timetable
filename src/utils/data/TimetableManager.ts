import {
  type CachedInstitute,
  type CustomLesson,
  type CustomTimetable,
  type CustomTimetableDraft,
  type ExamsTimetableItem,
  HalfTerm,
  type MergedTimetableData,
  type MergedTimetableItem,
  type TimetableItem,
  type TimetableMode,
  type TimetablePageType,
  type TimetableType,
} from "@/types/timetable";
import type { ActualPromise, OptimisticPromise, RenderPromises } from "@/types/utils";
import { sortGroups } from "@/utils/timetable";
import { DEVELOP } from "../constants";
import { toCustomLessons, toTimetableItems } from "../customTimetable";
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
      case "lecturer": {
        const lecturers = await this.getLecturers();
        const tempLecturers = new Set<string>(lecturers.map((lecturer) => Util.getGroupName(lecturer, type)));
        return Util.getFirstLetters([...tempLecturers]);
      }
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
        const names = [...new Set(data.map((group) => Util.getGroupName(group, type)))];
        return names.filter((name) => Util.startsWithLetters(name, query));
      }
      case "lecturer": {
        const lecturers = await this.getLecturers();
        const names = lecturers
          .map((lecturer) => Util.getGroupName(lecturer, type))
          .filter((name) => Util.startsWithLetters(name, query));
        return Util.extractLecturerUniquePrefixes(names);
      }
      default: {
        const groups = await this.getTimetableGroups(query);
        return [...new Set(groups.map((group) => Util.getGroupName(group, type)))];
      }
    }
  }

  async getThirdLayerByType(type: TimetableType, query: string) {
    switch (type) {
      case "selective": {
        const data = await this.getSelectiveGroups();
        return data.filter((group) => Util.getGroupName(group, type) === query);
      }
      case "lecturer": {
        const lecturers = await this.getLecturers();
        const normalizedQuery = query.trim();
        const names = [
          ...new Set(
            lecturers
              .map((lecturer) => Util.getGroupName(lecturer, type))
              .filter((name) => Util.getLecturerPrefix(name) === normalizedQuery)
          ),
        ];
        return names.sort((a, b) => a.localeCompare(b));
      }
      default: {
        const groups = await this.getTimetableGroups();
        return groups.filter((group) => Util.getGroupName(group, type) === query);
      }
    }
  }

  async getLastOpenedInstitute(): Promise<string | null> {
    return LocalCache.get("lastOpenedInstitute").then((t) => t?.data);
  }

  async getLastOpenedPath(): Promise<string | null> {
    const [timetable, mode] = await Promise.all([
      LocalCache.get("lastOpenedTimetable"),
      LocalCache.get("lastOpenedMode"),
    ]);
    if (!timetable.data) return null;
    return mode.data === "exams" ? `${timetable.data}/exams` : timetable.data;
  }

  async updateLastOpenedInstitute(institute: string) {
    return LocalCache.set("lastOpenedInstitute", institute);
  }

  async updateLastOpenedTimetable(timetable: string, mode: TimetableMode = "timetable") {
    await Promise.all([LocalCache.set("lastOpenedTimetable", timetable), LocalCache.set("lastOpenedMode", mode)]);
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
    if (timetableType === "custom") {
      const toItems = (timetable?: CustomTimetable | null) => (timetable ? toTimetableItems(timetable.lessons) : null);
      const [cacheData, fetchData] = this.getCustomTimetable(groupName, true);
      return [cacheData.then(toItems), fetchData.then(toItems)] as const;
    }

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
        cacheData.then((t) => {
          if (!t) return;
          this.saveTimetableLocally(groupName, t, data?.subgroup);
          Toast.warn("Data is possibly outdated!");
        });
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
      // TODO: implement server cache
      // cacheData = FallbackData.getExamsTimetable(timetableType, groupName).catch(() =>
      //   LocalCache.get(`exams_timetable_${groupName}`).then((t) => t?.data)
      // );
      cacheData = Promise.resolve(null);
    }

    const fetchData: ActualPromise<ExamsTimetableItem[]> = LPNUData.getExamsTimetable(timetableType, groupName).catch(
      (e) => {
        console.warn("LPNU API is not working!", e);
        cacheData.then((t) => {
          if (!t) return;
          this.saveExamsLocally(groupName, t);
          Toast.warn("Data is possibly outdated!");
        });
        return null;
      }
    );

    fetchData.then((t) => this.saveExamsLocally(groupName, t));
    return [cacheData, fetchData] as const;
  }

  async saveTimetableLocally(group: string, timetable?: TimetableItem[] | null, subgroup?: 1 | 2) {
    if (!timetable) return;
    const { data: savedTimetables } = await LocalCache.get("savedTimetables");
    const saved = savedTimetables?.filter((el) => el.group.toLowerCase() !== group.toLowerCase()) ?? [];
    await LocalCache.set("savedTimetables", [...saved, { group, time: Date.now(), subgroup }]);
    await LocalCache.set(`timetable_${group}`, timetable);
    return timetable;
  }

  /** A deleted one is still available as a source of a merge */
  getCustomTimetable(group: string, asSource = false): RenderPromises<CustomTimetable> {
    const cacheData = LocalCache.get(`custom_${Util.getCustomId(group)}`, true).then((t) => t.data);
    const fetchData: ActualPromise<CustomTimetable> = FallbackData.getCustomTimetable(Util.getCustomId(group)).then(
      async (fetched) => {
        if (!fetched || (fetched.deletedAt && !asSource)) {
          // A merged timetable keeps the last lessons of a deleted custom one, they just stop updating
          if (!LocalCache.sync.mergedTimetable?.timetables.includes(group)) await this.deleteTimetable(group);
          throw Toast.NONEXISTING_TIMETABLE;
        }
        const lessons =
          fetched.lessons ??
          (await this.mergeSources(fetched.sourceNames)[1].then((items) => items && toCustomLessons(items)));
        if (!lessons) return null;
        const timetable = { ...fetched, lessons };
        if (!fetched.deletedAt) await this.saveCustomLocally(group, timetable);
        return timetable;
      },
      () => {
        cacheData.then((t) => t && Toast.warn("Data is possibly outdated!"));
        return null;
      }
    );
    return [cacheData, fetchData] as const;
  }

  async saveCustomLocally(group: string, timetable: CustomTimetable, subgroup?: 1 | 2) {
    const saved = (await LocalCache.get("savedTimetables")).data ?? [];
    subgroup ??= saved.find((el) => el.group === group)?.subgroup;
    await LocalCache.set("savedTimetables", [
      ...saved.filter((el) => el.group !== group),
      { group, time: Date.now(), subgroup, name: timetable.name, kind: timetable.kind, updatedAt: timetable.updatedAt },
    ]);
    await LocalCache.set(`custom_${timetable.id}`, timetable);
    this.resolveMyTimetable();
  }

  getCustomEditToken(id: string) {
    return LocalCache.sync.customEditTokens?.[id];
  }

  async createMergedTimetable(timetable: MergedTimetableData) {
    const { id, editToken } = await FallbackData.createMergedTimetable(timetable);
    await this.saveCustomEditToken(id, editToken);
    return Util.CUSTOM_PREFIX + id;
  }

  /** Moves the local-only merged timetable to the server, so it can be shared */
  async uploadMergedTimetable(lessons: CustomLesson[]) {
    const merged = LocalCache.sync.mergedTimetable;
    if (!merged) return;
    const timetable = { name: merged.group, sourceNames: merged.timetables };
    const group = await this.createMergedTimetable(timetable);
    const now = new Date().toISOString();
    await this.saveCustomLocally(
      group,
      {
        ...timetable,
        id: Util.getCustomId(group),
        kind: "merged",
        subgroupToggle: true,
        lessons,
        updatedAt: now,
        deletedAt: null,
      },
      merged.subgroup
    );
    await LocalCache.set("myTimetable", group);
    await this.deleteTimetable(MERGED_TIMETABLE);
    return group;
  }

  async saveCustomEditToken(id: string, token: string) {
    const { data: tokens } = await LocalCache.get("customEditTokens");
    return LocalCache.set("customEditTokens", { ...tokens, [id]: token });
  }

  getCustomDraft(group: string) {
    return LocalCache.sync.customDrafts?.[group];
  }

  async saveCustomDraft(group: string, draft: CustomTimetableDraft | null) {
    const { [group]: _, ...drafts } = (await LocalCache.get("customDrafts")).data ?? {};
    return LocalCache.set("customDrafts", draft ? { ...drafts, [group]: draft } : drafts);
  }

  async saveExamsLocally(group: string, timetable?: ExamsTimetableItem[] | null) {
    if (!timetable) return;
    const { data: examsTimetables } = await LocalCache.get("examsTimetables");
    const saved = examsTimetables?.filter((el) => el.group.toLowerCase() !== group.toLowerCase()) ?? [];
    await LocalCache.set("examsTimetables", [...saved, { group, time: Date.now() }]);
    await LocalCache.set(`exams_timetable_${group}`, timetable);
    return timetable;
  }

  getMergedTimetable(): RenderPromises<TimetableItem[]> {
    const timetableNames = LocalCache.sync.mergedTimetable?.timetables;
    if (!timetableNames) throw Error("Merge doesn't exist!");
    const [cacheData, fetchData] = this.mergeSources(timetableNames);
    // It may have moved to the server while loading
    void Promise.all([cacheData, fetchData]).then(([cached, fetched]) => {
      if ((fetched ?? cached) && LocalCache.sync.mergedTimetable) this.saveMergedTimetable(timetableNames);
    });
    return [cacheData, fetchData] as const;
  }

  private mergeSources(timetableNames: string[]): RenderPromises<TimetableItem[]> {
    const timetables = timetableNames.map((el) => ({ name: el, data: this.getTimetable(el) }));
    const cachePromises = timetables.map(({ name, data }) => data[0].then((timetable) => ({ timetable, name })));
    // A source that failed to load keeps its cached lessons instead of disappearing from the merge
    const fetchPromises = timetables.map(({ name, data }) =>
      data[1]
        .catch((error) => (error === Toast.NONEXISTING_TIMETABLE ? null : Promise.reject(error)))
        .then(async (timetable) => ({ timetable: timetable ?? (await data[0]), name }))
    );
    const cacheData: OptimisticPromise<MergedTimetableItem[]> = Promise.all(cachePromises)
      .then((timetables) => Util.mergeTimetables(timetables))
      .catch((err) => {
        console.error("Failed to merge timetables from cache", err);
        return null;
      });

    const fetchData: ActualPromise<TimetableItem[]> = Promise.all(fetchPromises)
      .then((timetables) => Util.mergeTimetables(timetables))
      .catch(() => {
        cacheData.then((merged) => merged && Toast.warn("Data is possibly outdated!"));
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

    const { data: savedTimetables } = await LocalCache.get("savedTimetables");
    const saved = savedTimetables?.filter((el) => el.group !== group) ?? []; // remove previous timetable
    return LocalCache.set("savedTimetables", [...saved, { ...data, subgroup }]);
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
      LocalCache.set("mergedTimetable", null);
      return;
    }
    const groupNameClean = groupName.trim();
    const { data: savedTimetables } = await LocalCache.get("savedTimetables");
    await LocalCache.set("savedTimetables", savedTimetables?.filter((el) => el.group !== groupNameClean) ?? null);
    await LocalCache.set(
      Util.isCustom(groupNameClean) ? `custom_${Util.getCustomId(groupNameClean)}` : `timetable_${groupNameClean}`,
      null
    );
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
    if (Util.isCustom(timetable)) return "custom";
    const compare = (el: string) => el.toLowerCase() === timetable.toLowerCase();
    if (LocalCache.sync.groups?.some(compare)) {
      if (timetable.toLowerCase().endsWith("з")) return "parttime";
      return "timetable";
    }
    if (LocalCache.sync.selectiveGroups?.some(compare)) return "selective";
    if (LocalCache.sync.lecturers?.some(compare)) return "lecturer";
    if (timetable === MERGED_TIMETABLE) return "merged";

    // try to guess the type based on the name
    const numberOfDashes = timetable.split("-").length - 1;
    const containsNumbers = /\d/.test(timetable);

    if (!containsNumbers) return "lecturer";
    if (numberOfDashes === 1) {
      if (timetable.toLowerCase().endsWith("з")) return "parttime";
      return "timetable";
    }
    if (numberOfDashes >= 2) return "selective";

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

  /** /my is a shortcut to the first custom timetable you got, until it's gone, then to the latest one */
  resolveMyTimetable() {
    const customs = this.cachedTimetables.map(({ group }) => group).filter(Util.isCustom);
    const current = LocalCache.sync.myTimetable;
    if (current && customs.includes(current)) return current;
    const next = customs.at(-1);
    void LocalCache.set("myTimetable", next ?? null);
    return next;
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

  private getLecturers(): Promise<string[]> {
    return this.getData("lecturers", FallbackData, FallbackData.getLecturers).then((l) => l ?? []);
  }

  private getLecturerDepartments(): Promise<string[]> {
    return this.getData("departments", FallbackData, FallbackData.getLecturerDepartments).then((d) => d ?? []);
  }

  private async getData<K extends CacheKey, P extends unknown[]>(
    key: K,
    binding: typeof LPNUData | typeof FallbackData,
    fn: (...params: P) => Promise<CacheData[K]>,
    ...args: P
  ): Promise<CacheData[K] | null> {
    if (DEVELOP) console.log("Getting data", key);
    const cached = (await LocalCache.get(key)).data;
    if (Array.isArray(cached) && cached.length > 0) return cached;
    if (!Array.isArray(cached) && cached) return cached;

    if (DEVELOP) console.log("Getting data from server", cached);
    const data: CacheData[K] | null = await fn.call(binding, ...args).catch(async () => {
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
