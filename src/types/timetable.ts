export type TimetableItem = {
  day: number;
  date?: Date;
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
export type Semester = "1" | "2";
export type LPNUTimetableType = "timetable" | "selective" | "lecturer" | "parttime";
export type TimetableType = LPNUTimetableType | "merged" | "custom";

export type CachedTimetable = {
  group: string;
  time: number;
  subgroup?: 1 | 2;
  name?: string;
  kind?: CustomTimetable["kind"];
  updatedAt?: string;
};
export type MergedTimetable = CachedTimetable & { timetables: string[] };
export type SourceLesson = Pick<TimetableItem, "day" | "number" | "subject" | "lecturer" | "location" | "type"> & {
  week: "all" | "chys" | "znam";
  subgroup: "all" | 1 | 2;
  details: string;
};

export type CustomLesson = SourceLesson & { source?: string; original?: SourceLesson; removed?: true };
export type CustomTimetableData = { name: string; subgroupToggle: boolean; lessons: CustomLesson[] };
export type CustomTimetable = CustomTimetableData & {
  id: string;
  /** Merged ones follow their sources, their lessons are the last merge of them */
  kind: "edited" | "merged";
  sourceNames: string[];
  updatedAt: string;
  deletedAt: string | null;
};
export type CustomTimetableResponse = Omit<CustomTimetable, "lessons"> & { lessons: CustomLesson[] | null };
export type MergedTimetableData = { name: string; sourceNames: string[] };
export type CustomTimetableDraft = {
  /** Page the editor was opened on */
  group: string;
  /** State before editing, to know if there are changes */
  timetable: CustomTimetableData;
  /** Its sourceNames are missing until the user changes them */
  draft: CustomTimetableData & { sourceNames?: string[] };
  sourceNames: string[];
  /** Missing until the first save creates the custom timetable */
  /** Merged ones stay merged while only their name and groups change */
  saved?: { id: string; editToken: string; merged?: boolean };
};

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
export type TimetableMode = "timetable" | "exams";
