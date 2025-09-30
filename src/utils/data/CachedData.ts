import { DEVELOP } from "../constants";

const FALLBACK_URL = import.meta.env.VITE_BACKEND_URL;

export default class CachedData {
  private static async fetchData<T>(path: string) {
    if (DEVELOP) console.warn("Timetable fallback url", FALLBACK_URL + path);
    const response = await fetch(FALLBACK_URL + path);
    if (!response.ok) throw Error("Couldn't fetch or parse timetable");
    return (await response.json()) as T;
  }

  static getInstitutes(): Promise<string[]> {
    return CachedData.fetchData("/institutes");
  }

  static getGroups(institute?: string): Promise<string[]> {
    const fallbackPath = institute ? `/institutes/${institute}/groups` : "/regular/groups";
    return CachedData.fetchData(fallbackPath);
  }

  static getSelectiveGroups(): Promise<string[]> {
    return CachedData.fetchData("/selective/groups");
  }

  static async getLecturers(): Promise<string[]> {
    const data: string[] = await CachedData.fetchData("/lecturers/groups");
    return [...new Set(data)].sort((a, b) => a.localeCompare(b));
  }

  static getLecturerDepartments(): Promise<string[]> {
    return CachedData.fetchData("/lecturers/departments.json");
  }
}
