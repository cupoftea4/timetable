export type TimetableItem = {
  day: number;
  isFirstSubgroup: boolean;
  isFirstWeek: boolean;
  isSecondSubgroup: boolean;
  isSecondWeek: boolean;
  lecturer: string;
  location: string;
  number: number;
  subject: string;
  type: TimetableItemType;
  urls: string[];
};

export type MergedTimetableItem = TimetableItem & { timetableName: string };

export type ExamsTimetableItem = {
  date: Date;
  lecturer: string;
  subject: string;
  number: number;
  urls: string[];
};

export type TimetableItemType = "lection" | "practical" | "lab" | "consultation";
export type LPNUTimetableType = "timetable" | "selective" | "lecturer";
export type TimetableType = LPNUTimetableType | "merged";

export type CachedTimetable = { group: string; time: number; subgroup?: 1 | 2 };
export type MergedTimetable = CachedTimetable & { timetables: string[] };
export type CachedGroup = string;
export type CachedInstitute = string;

export enum Year {
  First = 1,
  Second = 2,
  Third = 3,
  Fourth = 4,
}

export enum HalfTerm {
  First = 1,
  Second = 2,
}

export type TimetablePageType = "home" | "lecturer" | "selective" | "timetable";
