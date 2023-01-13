import { timeout } from "./promiseHandling";
import { TimetableType } from "./types";

const NULP_STUDENTS = "https://student.lpnu.ua/";
const NULP_STAFF = "https://staff.lpnu.ua/";

const PROXY = process.env.REACT_APP_PROXY;

const TIMEOUT = 2000; // 2s

const TIMETABLE_SUFFIX = "students_schedule";
const SELECTIVE_SUFFIX = "schedule_selective";
const LECTURER_SUFFIX = "lecturer_schedule";
const TIMETABLE_EXAMS_SUFFIX = "students_exam";
const LECTURER_EXAMS_SUFFIX = "lecturer_exam";

type LPNURequestSuffix = 
		  typeof TIMETABLE_SUFFIX
		| typeof SELECTIVE_SUFFIX
		| typeof LECTURER_SUFFIX
		| typeof TIMETABLE_EXAMS_SUFFIX
		| typeof LECTURER_EXAMS_SUFFIX;

const timetableSuffixes: Record<TimetableType, LPNURequestSuffix> = {
	timetable:  "students_schedule" ,
	selective: "schedule_selective",
	lecturer: "lecturer_schedule"
}

type StudentParams = {
	departmentparent_abbrname_selective: string,
	studygroup_abbrname_selective?: string,
	semestrduration?: '1' | '2' | '3'
}

type LecturerParams = {
	department_name_selective: string,
	teachername_selective?: string,
	assetbuilding_name_selective?: "весь семестр"
}

type ExamsStudentParams = {
	studygroup_abbrname_selective: string,
	departmentparent_abbrname_selective: string,
}

type ExamsLecturerParams = {
	teachername_selective: string,
	namedepartment_selective: string
} 

type LPNURequestParams =  StudentParams | LecturerParams | ExamsStudentParams | ExamsLecturerParams | null;


const getKeysWithTypes = <T extends string>(obj: Record<T, string>) => {
	return Object.keys(obj) as (T)[];
}

const isLecturer = (suffix: LPNURequestSuffix) => {
	return suffix === LECTURER_SUFFIX || suffix === LECTURER_EXAMS_SUFFIX;
}

const buildURL = (base: string, params: Record<string, string> | null) => {
	const originalUrl = new URL(base);
	if (!params) return originalUrl.href;
	(getKeysWithTypes(params)).forEach(key => 
		originalUrl.searchParams.set(key, params[key]))
	return originalUrl.href;
}


export default class LPNUData {
  private static async fetchHtml(
		params: LPNURequestParams = null, 
		suffix: LPNURequestSuffix = TIMETABLE_SUFFIX
	) {
		const origin = isLecturer(suffix) ? NULP_STAFF : NULP_STUDENTS;
		const built = buildURL(origin + suffix, params);
		const proxiedUrl = PROXY + built;
		return timeout(TIMEOUT, fetch(proxiedUrl)).then(response => {
			if(!response.ok) throw Error(response.statusText);
			return response.text();
		})
	}

  static async fetchSelectiveGroups() {
		return this.fetchHtml(null, SELECTIVE_SUFFIX);
  }

  static async fetchInstitutes() {
		return this.fetchHtml();
	}

	static async fetchLecturers(department?: string) {
		return this.fetchHtml(
			department ? {department_name_selective: department} : null,
			LECTURER_SUFFIX
		);
	}

	static async fetchLecturerDepartments() {
		return this.fetchHtml(null, LECTURER_SUFFIX);
	}

	static async fetchGroups(institute = "All") {
		return this.fetchHtml({
			departmentparent_abbrname_selective: institute
		});
	}

	static async fetchTimetable(type: TimetableType, timetableName = "All", timetableCategory = "All") {
		const suffix = timetableSuffixes[type];
		if (suffix === LECTURER_SUFFIX) {
			return this.fetchHtml({
				department_name_selective: timetableCategory,
				teachername_selective: timetableName,
				assetbuilding_name_selective: "весь семестр"
			}, LECTURER_SUFFIX);
		}
		return this.fetchHtml({
			departmentparent_abbrname_selective: timetableCategory,
			studygroup_abbrname_selective: timetableName,
			semestrduration: '1', // Why, NULP?
		}, suffix);
	} 

	static async fetchExamsTimetable(type: TimetableType, group = "All", institute = "All") {
		if (type === 'lecturer') {
			return this.fetchHtml({
				namedepartment_selective: institute,
				teachername_selective: group
			}, LECTURER_EXAMS_SUFFIX);
		} 
		return this.fetchHtml({
			departmentparent_abbrname_selective: institute,
			studygroup_abbrname_selective: group
		}, TIMETABLE_EXAMS_SUFFIX);
	}
}