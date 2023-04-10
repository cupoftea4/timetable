import TimetableManager from "./TimetableManager";
import { CachedTimetable, TimetableItem, TimetableType } from "./types";
import { findAndConvertRomanNumeral } from "./utils";

const UPDATE_PERIOD = 24 * 60 * 60 * 1000; // 1 day

export default class TimetableUtil {
  static lessonsTimes = [ 
    {start:  "8:30", end: "10:05"},
    {start: "10:20", end: "11:55"},
    {start: "12:10", end: "13:45"},
    {start: "14:15", end: "15:50"},
    {start: "16:00", end: "17:35"},
    {start: "17:40", end: "19:15"},
    {start: "19:20", end: "20:55"},
    {start: "21:00", end: "22:35"}
  ];

  static mergeTimetables(timetables: (TimetableItem[] | undefined | null)[]) {
    const mergedTimetable = timetables.reduce((acc, timetable) => {
      timetable?.forEach(item => {
        acc!.push(item);
      });
      return acc;
    }, [] as TimetableItem[]);
    if (!mergedTimetable || !mergedTimetable.length) throw new Error("Something went wrong");
    return mergedTimetable;
  }

  static isMerged(timetable: string) {
    return timetable.includes("my") || timetable.includes("Мій розклад");
  }

  static getTimetableName(timetable: CachedTimetable | string) {
    const name = typeof timetable === "string" ? timetable : timetable.group;
    if (TimetableUtil.isMerged(name)) return "Мій розклад";
    return name;
  }

  
  static getGroupName(group: string, timetableType: TimetableType) {
    if (timetableType === "selective") return group.split("-")[0] + "-" + group.split("-")[1];
    if (timetableType === "lecturer") return group;
    return group.split("-")[0];
  }

  static sortGroupsByYear(groups: string[]) {
    return groups.reduce((acc, group) => {
      const parts = group.split("-");
      const yearIndex = +(parts[parts.length - 1][0] ?? 0);
      if (!acc[yearIndex]) acc[yearIndex] = [];
      acc[yearIndex].push(group);
      return acc;
    }, [] as string[][]);
  }

  static getFirstLetters = (array: string[]) => {
    const alphabet = [...new Set<string>([...array].map(group => group[0]).sort((a, b) => a.localeCompare(b)))];
    const alphabetArray = alphabet.reduce((acc, letter, index) => {
      if (index % 2 === 0) acc.push(letter);
      else acc[acc.length - 1] += "-" + letter;
      return acc;
    }, [] as string[]);
    return alphabetArray;
  }

  static startsWithLetters = (str: string, letters: string) => { // letters = "А-Б"
    const [start, end] = letters.split("-");
    if (!end) return str.startsWith(start);
    return str[0].localeCompare(start) >= 0 && str[0].localeCompare(end) <= 0;
  }

  static needsUpdate(timestamp: number) {
    if (!timestamp) return true;
    return navigator.onLine && (Date.now() - UPDATE_PERIOD > timestamp);
  }

  static getAllTimetables() {
    return (
      TimetableManager.cachedGroups
    ).concat(
      TimetableManager.cachedSelectiveGroups
    ).concat(
      TimetableManager.cachedLecturers
    )
  }

  static formatLocationForGoogleMaps(location: string | undefined) {
    const UNI_NAME = "НУ «Львівська політехніка»";

    if (!location) return UNI_NAME;

    let building = null;
    if (location.includes("Гол. н.к.")) {
      building = "Головний корпус";
    } else {
      const buildingNumber = findAndConvertRomanNumeral(location);
      if (buildingNumber) building = `${buildingNumber}-й корпус`;
    }

    return UNI_NAME + (building ? `, ${building}` : "");
  }

}
