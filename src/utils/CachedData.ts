import { TimetableItem, TimetableType } from "./types";

const FALLBACK_URL = "https://raw.githubusercontent.com/cupoftea4/timetable-data/data/";

export class CachedData {
  private static async fetchData(path: string) {
		console.warn("Timetable fallback url", FALLBACK_URL + path);
		const response = await fetch(FALLBACK_URL + path);
		if (!response.ok) throw Error("Couldn't fetch or parse timetable");
		return await response.json();
	}

  static fetchInstitutes(): Promise<string[]> {
    return this.fetchData("institutes.json");
  }

  static fetchGroups(institute: string): Promise<string[]> {
    const fallbackPath = institute ? `institutes/${institute}.json` : `groups.json`;
		return  this.fetchData(fallbackPath);
  }

  static fetchSelectiveGroups(): Promise<string[]> {
    return this.fetchData("selective/groups.json");
  }

  static async fetchLecturers(department?: string): Promise<string[]> {
    if (department) {
      const data: Record<string, string[]> = await this.fetchData("lecturers/grouped.json");
      return data[department] ?? [];
    }
    const data: string[] = await this.fetchData("lecturers/all.json");
    return ([...new Set(data)] ).sort((a, b) => a.localeCompare(b))
  }

  static fetchLecturerDepartments(): Promise<string[]> {
    return this.fetchData("lecturers/departments.json");
  }

  static fetchTimetable(type: TimetableType, timetableName?: string,): Promise<TimetableItem[]> {
    let fallbackPath = `timetables/${timetableName}.json`;
    if (type === "lecturer") 
      fallbackPath = `lecturers/timetables/${timetableName}.json`;
    if (type === "selective") 
      fallbackPath = `selective/timetables/${timetableName}.json`;
    
    return this.fetchData(fallbackPath);
  }

}