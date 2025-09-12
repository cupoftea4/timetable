import type {
  CachedGroup,
  CachedInstitute,
  CachedTimetable,
  ExamsTimetableItem,
  MergedTimetable,
  TimetableItem,
  TimetablePageType,
} from "@/types/timetable";
import storage from "./storage";
import { sortGroups } from "./timetable";
import * as Util from "./timetable";

type StorageType = "localStorage" | "indexedDB";
const CACHE_KEYS = [
  "lastOpenedInstitute",
  "lastOpenedTimetable",
  "institutes",
  "groups",
  "lecturers",
  "departments",
  "selectiveGroups",
  "savedTimetables",
  "examsTimetables",
  "mergedTimetable",
  "firstHalfTermGroups",
  "secondHalfTermGroups",
] as const;
type StandardCacheKey = (typeof CACHE_KEYS)[number];

export type CacheConfig = { key: string; storage: StorageType };
const CACHE_CONFIGS: Record<StandardCacheKey, CacheConfig> = {
  lastOpenedInstitute: { key: "last_opened_institute", storage: "localStorage" },
  lastOpenedTimetable: { key: "last_opened_timetable", storage: "localStorage" },
  institutes: { key: "institutes", storage: "indexedDB" },
  groups: { key: "groups", storage: "indexedDB" },
  lecturers: { key: "lecturers", storage: "indexedDB" },
  departments: { key: "departments", storage: "indexedDB" },
  selectiveGroups: { key: "selective_groups", storage: "indexedDB" },
  savedTimetables: { key: "cached_timetables", storage: "localStorage" },
  examsTimetables: { key: "cached_exams_timetables", storage: "localStorage" },
  mergedTimetable: { key: "my", storage: "localStorage" },
  firstHalfTermGroups: { key: "first_half_term_groups", storage: "indexedDB" },
  secondHalfTermGroups: { key: "second_half_term_groups", storage: "indexedDB" },
};

const TIMETABLE_KEY = "timetable_" as const;
const EXAMS_TIMETABLE_KEY = "exams_timetable_" as const;
const GROUPS_KEY = "groups_" as const;

const UPDATED = "_updated";

const isStandardKey = (key: string): key is StandardCacheKey => {
  return CACHE_KEYS.includes(key);
};

type TimetableCacheKey = `${typeof TIMETABLE_KEY}${string}`;
type ExamsTimetableCacheKey = `${typeof EXAMS_TIMETABLE_KEY}${string}`;
type GroupsCacheKey = `${typeof GROUPS_KEY}${string}`;
export type CacheKey = StandardCacheKey | TimetableCacheKey | ExamsTimetableCacheKey | GroupsCacheKey;

export type CacheData = {
  [K in CacheKey]: K extends "institutes"
    ? CachedInstitute[]
    : K extends "groups" | "selectiveGroups"
      ? CachedGroup[]
      : K extends "lecturers" | "departments" | "firstHalfTermGroups" | "secondHalfTermGroups"
        ? string[]
        : K extends "examsTimetables" | "savedTimetables"
          ? CachedTimetable[]
          : K extends "mergedTimetable"
            ? MergedTimetable
            : K extends "lastOpenedInstitute" | "lastOpenedTimetable"
              ? string
              : K extends TimetableCacheKey
                ? TimetableItem[]
                : K extends ExamsTimetableCacheKey
                  ? ExamsTimetableItem[]
                  : K extends GroupsCacheKey
                    ? string[]
                    : never;
};

// Manages data saved locally: in RAM, indexedDB and localStorage
export default class LocalCache {
  private static ramCache: Partial<CacheData> = {};

  static async initRamCache(_?: TimetablePageType) {
    // TODO: init for open page type only
    await Promise.all([
      LocalCache.get("institutes").then(LocalCache.setRamCache),
      LocalCache.get("groups").then(({ data }) =>
        LocalCache.setRamCache({ key: "groups", data: data && sortGroups(data) })
      ),
      LocalCache.get("lecturers").then(LocalCache.setRamCache),
      LocalCache.get("mergedTimetable").then(LocalCache.setRamCache),
      LocalCache.get("lastOpenedTimetable").then(LocalCache.setRamCache),
      LocalCache.get("lastOpenedInstitute").then(LocalCache.setRamCache),
    ]);

    LocalCache.get("selectiveGroups").then(({ data }) =>
      LocalCache.setRamCache({ key: "selectiveGroups", data: data && sortGroups(data) })
    );
    LocalCache.get("examsTimetables").then(LocalCache.setRamCache);
    LocalCache.get("savedTimetables").then(LocalCache.setRamCache);
  }

  static isInited() {
    return (
      LocalCache.ramCache.institutes &&
      LocalCache.ramCache.institutes.length > 0 &&
      LocalCache.ramCache.groups &&
      LocalCache.ramCache.groups.length > 0 &&
      LocalCache.ramCache.selectiveGroups &&
      LocalCache.ramCache.selectiveGroups.length > 0
    );
  }

  private static setRamCache<K extends keyof CacheData>({ key, data }: { key: K; data: CacheData[K] | undefined }) {
    LocalCache.ramCache[key] = data;
  }

  private static getCacheConfig(key: CacheKey): CacheConfig {
    if (isStandardKey(key)) return CACHE_CONFIGS[key];
    return { key, storage: "indexedDB" };
  }

  static async get<K extends CacheKey>(key: K, force = false): Promise<{ key: K; data: CacheData[K] | undefined }> {
    if (isStandardKey(key) && LocalCache.ramCache[key]) return { key, data: LocalCache.ramCache[key] };
    const config = LocalCache.getCacheConfig(key);
    if (config.storage === "indexedDB") {
      const cached = await storage.getItem(config.key);
      const updated = await storage.getItem<number>(config.key + UPDATED);
      if (cached && updated && (!Util.needsUpdate(updated) || force)) return { key, data: cached as CacheData[K] };
    }
    if (config.storage === "localStorage") {
      const cached = JSON.parse(localStorage.getItem(config.key) ?? "null");
      if (cached) return { key, data: cached as CacheData[K] };
    }
    return { key, data: undefined };
  }

  static async set<K extends CacheKey>(key: K, data: CacheData[K] | undefined) {
    const config = LocalCache.getCacheConfig(key);
    if (!config) return;
    if (config.storage === "indexedDB") {
      await storage.setItem(config.key, data);
      await storage.setItem(config.key + UPDATED, Date.now());
    }
    if (config.storage === "localStorage") {
      localStorage.setItem(config.key, JSON.stringify(data));
    }
    if (isStandardKey(key)) {
      LocalCache.ramCache = {
        ...LocalCache.ramCache,
        [key]: data,
      };
    }
  }

  static get sync() {
    return LocalCache.ramCache;
  }
}
