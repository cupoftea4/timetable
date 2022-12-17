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
  type: TimetableType,
  urls: string[]
}

export type TimetableType = 'lecture' | 'practical' | 'lab' | 'consultation';

export type CachedTimetable = {group: string, time: number, subgroup: 1 | 2};
export type CachedGroup = string;
export type CachedInstitute = string;
export type ObjectType = {[key: string]: string};