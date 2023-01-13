import { TimetableType } from "./types";

const UPDATE_PERIOD = 3 * 24 * 60 * 60 * 1000; // 3 days

export default class TimetableUtil {
  static getGroupName(group: string, timetableType: TimetableType) {
    if (timetableType === "selective") return group.split("-")[0] + "-" + group.split("-")[1];
    if (timetableType === "lecturer") return group;
    return group.split("-")[0];
  }

  static sortGroupsByYear(groups: string[]) {
    return groups.reduce((acc, group) => {
      const yearIndex = +(group.split("-")?.at(-1)?.at(0) ?? 0);
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


  static needsUpdate(timestamp: number) {
    if (!timestamp) return true;
    return navigator.onLine && (Date.now() - UPDATE_PERIOD > timestamp);
  }
}
