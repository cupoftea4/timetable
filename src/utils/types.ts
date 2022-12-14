export type IconStyles = {className?: string, style?: React.CSSProperties};

export type TimetableItem = {
  day: number,
  isFirstSubgroup: boolean,
  isFirstWeek: boolean,
  isSecondSubgroup: boolean,
  isSecondWeek: boolean,
  lecturer: string,
  location: string,
  number: number,
  subject: string,
  type: TimetableItemType,
  urls: string[]
}

export type ExamsTimetableItem = {
  date: Date,
  lecturer: string,
  subject: string,
  number: number,
  urls: string[]
}

export type TimetableItemType = 'lecture' | 'practical' | 'lab' | 'consultation';
export type TimetableType = 'timetable' | 'selective' | 'lecturer';

export type CachedTimetable = {group: string, time: number, subgroup?: 1 | 2};
export type CachedGroup = string;
export type CachedInstitute = string;

export enum Year {
  First = 1,
  Second,
  Third,
  Fourth,
}

export enum Status {
  Loading,
  Idle,
  Failed
}