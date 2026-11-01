import type { Semester } from "@/types/timetable";
import LocalCache, { type CacheData } from "@/utils/timetableStorage";
import { getCurrentSemester as getCurrentSemesterByDate } from "../date";
import CachedData from "./CachedData";

type SemesterState = CacheData["currentSemester"];

const fetchSemesterState = async (): Promise<SemesterState> => {
  const { semester, expiresAt, exams } = await CachedData.getCurrentSemester();
  const state: SemesterState = {
    semester,
    expiresAt: Date.parse(expiresAt),
    examsPublished: exams?.published ?? null,
  };
  await LocalCache.set("currentSemester", state);
  return state;
};

let semesterRequest: Promise<SemesterState> | null = null;

const getSemesterState = async (): Promise<SemesterState> => {
  const { data: cached } = await LocalCache.get("currentSemester");
  if (cached && cached.expiresAt > Date.now()) return cached;

  semesterRequest ??= fetchSemesterState().finally(() => {
    semesterRequest = null;
  });
  return await semesterRequest;
};

export const getCurrentSemester = async (): Promise<Semester> => {
  try {
    return (await getSemesterState()).semester;
  } catch {
    return getCurrentSemesterByDate();
  }
};

export const isExamsPublished = async (): Promise<boolean> => {
  return getSemesterState()
    .then((state) => state.examsPublished ?? false)
    .catch(() => false);
};
