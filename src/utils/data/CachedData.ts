import type { ExamsTimetableItem, LPNUTimetableType, TimetableItem, TimetableType } from "@/types/timetable";
import { DEVELOP } from "../constants";

const FALLBACK_URL = "https://raw.githubusercontent.com/cupoftea4/timetable-data/data/";

type CachedExamsTimetableItem = Omit<ExamsTimetableItem, "date"> & { date: string };

export default class CachedData {
  private static async fetchData<T>(path: string) {
    if (DEVELOP) console.warn("Timetable fallback url", FALLBACK_URL + path);
    const response = await fetch(FALLBACK_URL + path);
    if (!response.ok) throw Error("Couldn't fetch or parse timetable");
    return (await response.json()) as T;
  }

  static getInstitutes(): Promise<string[]> {
    return CachedData.fetchData("institutes.json");
  }

  static getGroups(institute?: string): Promise<string[]> {
    const fallbackPath = institute ? `institutes/${institute}.json` : "groups.json";
    return CachedData.fetchData(fallbackPath);
  }

  static getSelectiveGroups(): Promise<string[]> {
    return CachedData.fetchData("selective/groups.json");
  }

  static async getLecturers(department?: string): Promise<string[]> {
    if (department) {
      const data: Record<string, string[]> = await CachedData.fetchData("lecturers/grouped.json");
      return data[department] ?? [];
    }
    const data: string[] = await CachedData.fetchData("lecturers/all.json");
    return [...new Set(data)].sort((a, b) => a.localeCompare(b));
  }

  static getLecturerDepartments(): Promise<string[]> {
    return CachedData.fetchData("lecturers/departments.json");
  }

  static getTimetable(type: LPNUTimetableType, timetableName: string): Promise<TimetableItem[]> {
    let fallbackPath = `timetables/${timetableName}.json`;
    if (type === "lecturer") {
      fallbackPath = `lecturers/timetables/${timetableName}.json`;
    }
    if (type === "selective") {
      fallbackPath = `selective/timetables/${timetableName}.json`;
    }

    return CachedData.fetchData(fallbackPath);
  }

  static getExamsTimetable(type: TimetableType, timetableName: string): Promise<ExamsTimetableItem[]> {
    let fallbackPath = `exams/${timetableName}.json`;
    if (type === "lecturer") {
      fallbackPath = `exams/lecturers/${timetableName}.json`;
    }

    return CachedData.fetchData<CachedExamsTimetableItem[]>(fallbackPath).then((data: CachedExamsTimetableItem[]) =>
      data.map((item) => ({ ...item, date: new Date(item.date) }))
    );
  }
}
