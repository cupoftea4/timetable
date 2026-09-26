import type { CustomTimetable, CustomTimetableData, Semester } from "@/types/timetable";
import { DEVELOP } from "../constants";

const FALLBACK_URL = import.meta.env.VITE_BACKEND_URL;

export default class CachedData {
  private static async fetchData<T>(path: string) {
    if (DEVELOP) console.warn("Timetable fallback url", FALLBACK_URL + path);
    const response = await fetch(FALLBACK_URL + path);
    if (!response.ok) throw Error("Couldn't fetch or parse timetable");
    return (await response.json()) as T;
  }

  private static async send<T>(path: string, method: string, body?: object | string, token?: string) {
    const headers = new Headers(token ? { Authorization: `Bearer ${token}` } : {});
    if (body) headers.set("Content-Type", typeof body === "string" ? "text/plain" : "application/json");
    const response = await fetch(FALLBACK_URL + path, {
      method,
      headers,
      body: typeof body === "object" ? JSON.stringify(body) : body,
    });
    const data: unknown = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const message = typeof data === "object" && data && "message" in data ? String(data.message) : null;
      throw Error(message ?? `Request failed with status ${response.status}`);
    }
    return data as T;
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

  static getCurrentSemester(): Promise<{
    semester: Semester;
    expiresAt: string;
    exams?: { published: boolean | null; checkedAt: string | null };
  }> {
    return CachedData.fetchData("/semester");
  }

  static async getCustomTimetable(id: string) {
    const response = await fetch(`${FALLBACK_URL}/custom/${id}`);
    if (response.status === 404) return null;
    if (!response.ok) throw Error(`Couldn't fetch custom timetable ${id}`);
    return (await response.json()) as CustomTimetable;
  }

  static createCustomTimetable(timetable: CustomTimetableData & { sourceNames: string[] }) {
    return CachedData.send<{ id: string; editToken: string }>("/custom", "POST", timetable);
  }

  static updateCustomTimetable(id: string, token: string, timetable: CustomTimetableData) {
    return CachedData.send<null>(`/custom/${id}`, "PUT", timetable, token);
  }

  static deleteCustomTimetable(id: string, token: string) {
    return CachedData.send<null>(`/custom/${id}`, "DELETE", undefined, token);
  }

  static parseCustomTimetable(json5: string) {
    return CachedData.send<CustomTimetableData>("/custom/parse", "POST", json5);
  }
}
