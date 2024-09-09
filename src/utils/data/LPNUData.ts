import { timeout } from '@/utils/promises';
import Parser from './Parser';
import type { LPNUTimetableType, TimetableType } from '@/types/timetable';
import { getCurrentSemester } from '../date';

// const NULP_STUDENTS = 'https://student.lpnu.ua/';
const NULP_STUDENTS_2023 = 'https://student.lpnu.ua/';
// const NULP_STAFF = 'https://staff.lpnu.ua/';
const NULP_STAFF_2023 = 'https://staff.lpnu.ua/';
const CURRENT_SEMESTER = getCurrentSemester();

const PROXY: string = import.meta.env.VITE_PROXY;

const TIMEOUT = 35000; // 35s

const TIMETABLE_SUFFIX = 'students_schedule';
const SELECTIVE_SUFFIX = 'schedule_selective';
const LECTURER_SUFFIX = 'lecturer_schedule';
const TIMETABLE_EXAMS_SUFFIX = 'students_exam';
const LECTURER_EXAMS_SUFFIX = 'lecturer_exam';

type LPNURequestSuffix =
  | typeof TIMETABLE_SUFFIX
  | typeof SELECTIVE_SUFFIX
  | typeof LECTURER_SUFFIX
  | typeof TIMETABLE_EXAMS_SUFFIX
  | typeof LECTURER_EXAMS_SUFFIX;

const timetableSuffixes: Record<LPNUTimetableType, LPNURequestSuffix> = {
  timetable: 'students_schedule',
  selective: 'schedule_selective',
  lecturer: 'lecturer_schedule'
};

type StudentParams = {
  departmentparent_abbrname_selective?: string

  studygroup_abbrname?: string
  semestr: '1' | '2'
  semestrduration?: '1' | '2' | '3'
};

type LecturerParams = {
  department_name_selective?: string
  assetbuilding_name_selective?: 'весь семестр'

  teachername?: string
  semestr?: '1' | '2'
  semestrduration?: '1' | '2' | '3'
};

type ExamsStudentParams = {
  studygroup_abbrname: string
  departmentparent_abbrname_selective?: string
};

type ExamsLecturerParams = {
  teachername: string
  namedepartment_selective?: string
};

type SelectiveParams = {
  studygroup_abbrname: string
};

type LPNURequestParams =
  | StudentParams
  | LecturerParams
  | ExamsStudentParams
  | ExamsLecturerParams
  | SelectiveParams
  | null;

const getKeysWithTypes = <T extends string>(obj: Record<T, string>) => {
  return Object.keys(obj) as T[];
};

const isLecturer = (suffix: LPNURequestSuffix) => {
  return suffix === LECTURER_SUFFIX || suffix === LECTURER_EXAMS_SUFFIX;
};

const buildURL = (base: string, params: Record<string, string> | null) => {
  const originalUrl = new URL(base);
  if (!params) return originalUrl.href;
  getKeysWithTypes(params).forEach((key) => originalUrl.searchParams.set(key, params[key]!));
  return originalUrl.href;
};

export default class LPNUData {
  private static fetchHTML(params: LPNURequestParams = null, suffix: LPNURequestSuffix = TIMETABLE_SUFFIX) {
    const origin = isLecturer(suffix) ? NULP_STAFF_2023 : NULP_STUDENTS_2023;

    const built = buildURL(origin + suffix, params);
    const proxiedUrl = PROXY + built;
    return timeout(TIMEOUT, fetch(proxiedUrl)).then((response) => {
      if (!response.ok) throw Error(response.statusText);
      return response.text();
    });
  }

  static getSelectiveGroups() {
    return this.fetchHTML(null, SELECTIVE_SUFFIX).then(Parser.parseSelectiveGroups.bind(Parser));
  }

  static getInstitutes() {
    return this.fetchHTML().then(Parser.parseInstitutes.bind(Parser));
  }

  static getLecturers(department?: string) {
    return this.fetchHTML(
      department ? { department_name_selective: department } : null,
      LECTURER_SUFFIX
    ).then(Parser.parseLecturers.bind(Parser));
  }

  static getLecturerDepartments() {
    return this.fetchHTML(null, LECTURER_SUFFIX).then(Parser.parseLecturerDepartments.bind(Parser));
  }

  static getGroups(institute = 'All') {
    return this.fetchHTML({
      semestr: CURRENT_SEMESTER,
      departmentparent_abbrname_selective: institute
    }).then(Parser.parseGroups.bind(Parser));
  }

  static getPartialGroups(semesterHalf: 1 | 2, institute = 'All') {
    const semesterParam = semesterHalf === 1 ? '2' : '3';
    return this.fetchHTML(
      {
        departmentparent_abbrname_selective: institute,
        semestr: CURRENT_SEMESTER,
        semestrduration: semesterParam
      },
      TIMETABLE_SUFFIX
    ).then(Parser.parsePartialGroups.bind(Parser));
  }

  static getTimetable(type: LPNUTimetableType, timetableName = 'All', timetableCategory = 'All') {
    const suffix = timetableSuffixes[type];
    if (suffix === LECTURER_SUFFIX) {
      return this.fetchHTML(
        {
          teachername: timetableName,
          semestr: CURRENT_SEMESTER,
          semestrduration: '1' // Why, NULP?
        },
        LECTURER_SUFFIX
      ).then(Parser.parseTimetable.bind(Parser));
    }

    if (suffix === SELECTIVE_SUFFIX) {
      return this.fetchHTML(
        {
          studygroup_abbrname: timetableName.toLowerCase()
        },
        SELECTIVE_SUFFIX
      ).then(Parser.parseTimetable.bind(Parser));
    }

    return this.fetchHTML(
      {
        studygroup_abbrname: timetableName.toLowerCase(),
        semestr: CURRENT_SEMESTER,
        semestrduration: '1' // Why, NULP?
      },
      suffix
    ).then(Parser.parseTimetable.bind(Parser));
  }

  static getPartialTimetable(timetableName: string, semesterHalf: 1 | 2) {
    const semesterParam = semesterHalf === 1 ? '2' : '3';
    // TODO: fix support for lecturer partial timetable
    return this.fetchHTML(
      {
        departmentparent_abbrname_selective: 'All',
        studygroup_abbrname: timetableName,
        semestrduration: semesterParam
      },
      TIMETABLE_SUFFIX
    ).then(Parser.parseTimetable.bind(Parser));
  }

  static getExamsTimetable(type: TimetableType, group = 'All', institute = 'All') {
    if (type === 'lecturer') {
      return this.fetchHTML(
        {
          teachername: group
        },
        LECTURER_EXAMS_SUFFIX
      ).then(Parser.parseExamsTimetable.bind(Parser));
    }
    return this.fetchHTML(
      {
        studygroup_abbrname: group
      },
      TIMETABLE_EXAMS_SUFFIX
    ).then(Parser.parseExamsTimetable.bind(Parser));
  }
}
