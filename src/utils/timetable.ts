import TimetableManager from './data/TimetableManager';
import { findAndConvertRomanNumeral, hashCode } from './general';
import type {
  CachedTimetable,
  ExamsTimetableItem,
  MergedTimetableItem,
  TimetableItem,
  TimetableType
} from '@/types/timetable';

const UPDATE_PERIOD = 24 * 60 * 60 * 1000; // 1 day

const lessonsComparator = (a: TimetableItem, b: TimetableItem) => a.subject === b.subject && a.lecturer === b.lecturer;

export const lessonsTimes: ReadonlyArray<{ readonly start: string, readonly end: string }> = [
  { start: '8:30', end: '9:50' },
  { start: '10:05', end: '11:25' },
  { start: '11:40', end: '13:00' },
  { start: '13:15', end: '14:35' },
  { start: '14:50', end: '16:10' },
  { start: '16:25', end: '17:45' },
  { start: '18:00', end: '19:20' },
  { start: '19:30', end: '20:50' }
];

export function mergeTimetables (timetables: Array<{ name: string, timetable: TimetableItem[] | undefined | null }>) {
  const mergedTimetable = timetables.reduce<MergedTimetableItem[]>((acc, timetableData) => {
    timetableData.timetable?.forEach(item => {
      acc.push({ ...item, timetableName: timetableData.name });
    });
    return acc;
  }, []);
  if (!mergedTimetable?.length) throw new Error('Something went wrong');
  return mergedTimetable;
}

export function isMerged (timetable: string) {
  return timetable.includes('my') || timetable.includes('Мій розклад');
}

export function getTimetableName (timetable: CachedTimetable | string) {
  const name = typeof timetable === 'string' ? timetable : timetable.group;
  if (isMerged(name)) return 'Мій розклад';
  return name;
}

export function getGroupName (group: string, timetableType: TimetableType) {
  if (timetableType === 'selective') return group.split('-')[0]! + '-' + group.split('-')[1]!;
  if (timetableType === 'lecturer') return group;
  return group.split('-')[0]!;
}

export function sortGroupsByYear (groups: string[]) {
  return groups.reduce<string[][]>((acc, group) => {
    const parts = group.split('-');
    const yearIndex = +(parts[parts.length - 1]![0] ?? 0);
    if (!acc[yearIndex]) acc[yearIndex] = [];
    acc[yearIndex]!.push(group);
    return acc;
  }, []);
}

export function getFirstLetters (array: readonly string[]) {
  const alphabet = [...new Set<string>([...array].map(group => group[0]!).sort((a, b) => a.localeCompare(b)))];
  const alphabetArray = alphabet.reduce<string[]>((acc, letter, index) => {
    if (index % 2 === 0) acc.push(letter);
    else acc[acc.length - 1] += '-' + letter;
    return acc;
  }, []);
  return alphabetArray;
}

export function startsWithLetters (str: string, letters: string) { // letters = "А-Б"
  const [start, end] = letters.split('-');
  if (!start) return false;
  if (!end) return str.startsWith(start);
  return Boolean(str[0] && str[0].localeCompare(start) >= 0 && str[0].localeCompare(end) <= 0);
}

export function needsUpdate (timestamp: number) {
  if (!timestamp) return true;
  return navigator.onLine && (Date.now() - UPDATE_PERIOD > timestamp);
}

export function getAllTimetables () {
  return (
    TimetableManager.cachedGroups
  ).concat(
    TimetableManager.cachedSelectiveGroups
  ).concat(
    TimetableManager.cachedLecturers
  );
}

export function formatLocationForGoogleMaps (location: string | undefined) {
  const UNI_NAME = 'НУ «Львівська політехніка»';

  if (!location) return UNI_NAME;

  let building = null;
  if (location.includes('Гол. н.к.')) {
    building = 'Головний корпус';
  } else {
    const buildingNumber = findAndConvertRomanNumeral(location);
    if (buildingNumber) building = `${buildingNumber}-й корпус`;
  }

  return UNI_NAME + (building ? `, ${building}` : '');
}

export function unique (array: TimetableItem[]) {
  return array.reduce<TimetableItem[]>((acc, item) => {
    if (!acc.some(i => lessonsComparator(i, item))) acc.push(item);
    return acc;
  }, []);
}

export function isExams (timetableItem: TimetableItem | ExamsTimetableItem): timetableItem is ExamsTimetableItem {
  return !timetableItem.hasOwnProperty('type');
}

export function generateId (item: TimetableItem) {
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
