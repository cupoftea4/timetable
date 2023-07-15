import TimetableManager from "./data/TimetableManager";
import { CachedTimetable, ExamsTimetableItem, MergedTimetableItem, TimetableItem, TimetableType } from "./types";
import { findAndConvertRomanNumeral, hashCode } from "./general";

const UPDATE_PERIOD = 24 * 60 * 60 * 1000; // 1 day

const lessonsComparator = (a: TimetableItem, b: TimetableItem) => a.subject === b.subject && a.lecturer === b.lecturer;

export const lessonsTimes: readonly {readonly start: string, readonly end: string}[] = [ 
  {start:  "8:30", end: "10:05"},
  {start: "10:20", end: "11:55"},
  {start: "12:10", end: "13:45"},
  {start: "14:15", end: "15:50"},
  {start: "16:00", end: "17:35"},
  {start: "17:40", end: "19:15"},
  {start: "19:20", end: "20:55"},
  {start: "21:00", end: "22:35"}
];

export function mergeTimetables(timetables: {name: string, timetable: (TimetableItem[] | undefined | null)}[]) {
  const mergedTimetable = timetables.reduce((acc, timetableData) => {
    timetableData.timetable?.forEach(item => {
      acc!.push({...item, timetableName: timetableData.name});
    });
    return acc;
  }, [] as MergedTimetableItem[]);
  if (!mergedTimetable || !mergedTimetable.length) throw new Error("Something went wrong");
  return mergedTimetable;
}

export function isMerged(timetable: string) {
  return timetable.includes("my") || timetable.includes("Мій розклад");
}

export function getTimetableName(timetable: CachedTimetable | string) {
  const name = typeof timetable === "string" ? timetable : timetable.group;
  if (isMerged(name)) return "Мій розклад";
  return name;
}


export function getGroupName(group: string, timetableType: TimetableType) {
  if (timetableType === "selective") return group.split("-")[0] + "-" + group.split("-")[1];
  if (timetableType === "lecturer") return group;
  return group.split("-")[0]!;
}

export function sortGroupsByYear(groups: string[]) {
  return groups.reduce((acc, group) => {
    const parts = group.split("-");
    const yearIndex = +(parts[parts.length - 1]![0] ?? 0);
    if (!acc[yearIndex]) acc[yearIndex] = [];
    acc[yearIndex]!.push(group);
    return acc;
  }, [] as string[][]);
}

export function getFirstLetters(array: readonly string[]) {
  const alphabet = [...new Set<string>([...array].map(group => group[0]!).sort((a, b) => a.localeCompare(b)))];
  const alphabetArray = alphabet.reduce((acc, letter, index) => {
    if (index % 2 === 0) acc.push(letter);
    else acc[acc.length - 1] += "-" + letter;
    return acc;
  }, [] as string[]);
  return alphabetArray;
}

export function startsWithLetters(str: string, letters: string) { // letters = "А-Б"
  const [start, end] = letters.split("-");
  if (!start) return false;
  if (!end) return str.startsWith(start);
  return Boolean(str[0] && str[0].localeCompare(start) >= 0 && str[0].localeCompare(end) <= 0);
}

export function needsUpdate(timestamp: number) {
  if (!timestamp) return true;
  return navigator.onLine && (Date.now() - UPDATE_PERIOD > timestamp);
}

export function getAllTimetables() {
  return (
    TimetableManager.cachedGroups
  ).concat(
    TimetableManager.cachedSelectiveGroups
  ).concat(
    TimetableManager.cachedLecturers
  )
}

export function formatLocationForGoogleMaps(location: string | undefined) {
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

export function unique(array: TimetableItem[]) {
  return array.reduce((acc, item) => {
    if (!acc.some(i => lessonsComparator(i, item))) acc.push(item);
    return acc;
  }, [] as TimetableItem[]);
}

export function isExams(timetableItem: TimetableItem | ExamsTimetableItem): timetableItem is ExamsTimetableItem {
  return !timetableItem.hasOwnProperty("type");
}

export function generateId(item: TimetableItem) {
  const fields = [
    item.day,
    item.isFirstSubgroup,
    item.isFirstWeek,
    item.isSecondSubgroup,
    item.isSecondWeek,
    item.lecturer,
    item.location,
    item.number,
    item.subject,
    item.type
  ];

  const data = fields.join('|');
  const hash = hashCode(data);
  return hash.toString();
}