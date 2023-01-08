import { timeout } from "./promiseHandling";
import { ExamsTimetableItem, TimetableItem, TimetableItemType, TimetableType } from "./types";

const NULP_STUDENTS = "https://student.lpnu.ua/";
const NULP_STAFF = "https://staff.lpnu.ua/";

const TIMETABLE_SUFFIX = "students_schedule";
const SELECTIVE_SUFFIX = "schedule_selective";
const LECTURER_SUFFIX = "lecturer_schedule";
const TIMETABLE_EXAMS_SUFFIX = "students_exam";
const LECTURER_EXAMS_SUFFIX = "lecturer_exam";

const PROXY = "https://api.codetabs.com/v1/proxy?quest=";

const FALLBACK_URL = "https://raw.githubusercontent.com/cupoftea4/timetable-data/data/";

const TIMEOUT = 3000; // 3s

type RequestSuffix = 
		  typeof TIMETABLE_SUFFIX
		| typeof SELECTIVE_SUFFIX
		| typeof LECTURER_SUFFIX
		| typeof TIMETABLE_EXAMS_SUFFIX
		| typeof LECTURER_EXAMS_SUFFIX;

const timetableSuffixes: {[key in TimetableType]: RequestSuffix} = {
	timetable:  "students_schedule" ,
	selective: "schedule_selective",
	lecturer: "lecturer_schedule"
}

class TimetableParser {

	private async fetchHtml(params: {[key: string]: string} = {}, suffix = TIMETABLE_SUFFIX) {
		const isLecturer = suffix === LECTURER_SUFFIX || suffix === LECTURER_EXAMS_SUFFIX;
		let baseUrl = (isLecturer ? NULP_STAFF : NULP_STUDENTS) + suffix;
		const originalUrl = new URL(baseUrl);
		for(let key in params) {
			originalUrl.searchParams.set(key, params[key]);
		}
		const proxiedUrl = PROXY + originalUrl.href;
		return timeout(TIMEOUT, fetch(proxiedUrl)).then(response => {
			if(!response.ok) throw Error(response.statusText);
			return response.text();
		})
	}

	async getSelectiveGroups() {
		return this.fetchHtml({}, SELECTIVE_SUFFIX).then(html => {
			const select = this.parseAndGetFirstElBySelector(html, "#edit-studygroup-abbrname-selective");
			const groups = Array.from(select?.children ?? [])
								.map(child => (child as HTMLInputElement).value)
								.filter(group => group !== "All")
								.sort((a, b) => a.localeCompare(b));
			return groups;
		}).catch(async err => {
			const fallback = FALLBACK_URL + `selective/groups.json`;
			const response = await fetch(fallback);
			if (!response.ok)
				throw Error(err);
			return await response.json() as string[];
		})
	}

	async getInstitutes() {
		return this.fetchHtml().then(html => {
	
			const select = this.parseAndGetFirstElBySelector(html, "#edit-departmentparent-abbrname-selective");
			const institutes = Array.from(select?.children ?? [])
									.map(child => (child as HTMLInputElement).value)
									.filter(inst => inst !== "All")
									.sort((a, b) => a.localeCompare(b));
			return institutes;
		}).catch(async err => {
			const response = await fetch(FALLBACK_URL + "institutes.json");
			if (!response.ok)
				throw Error(err);
			return await response.json() as string[];
		});
	}

	async getLecturers(department?: string) {
		return this.fetchHtml(department ? 
			{department_name_selective: department} : {}, LECTURER_SUFFIX).then(html => {
			const select = this.parseAndGetFirstElBySelector(html, "#edit-teachername-selective");
			const lecturers = Array.from(select?.children ?? [])
									.map(child => (child as HTMLInputElement).value)
									.filter(inst => inst !== "All")
									.sort((a, b) => a.localeCompare(b));
			
			return lecturers;
		}).catch(async err => {
			const fallback = FALLBACK_URL + "lecturers/" + (department ?  "grouped.json" : "all.json");
			console.warn("Lecturers fallback url", fallback, department);
			const response = await fetch(fallback);
			if (!response.ok)
				throw Error(err);
			const data = await response.json() ;
			return (department ? data[department] : data) as string[];
		});
	}

	async getLecturerDepartments() {
		return this.fetchHtml({}, LECTURER_SUFFIX).then(html => {
			const select = this.parseAndGetFirstElBySelector(html, "#edit-department-name-selective");
			const departments = Array.from(select?.children ?? [])
				.map(child => (child as HTMLInputElement).value)
				.filter(depart => depart !== "All")
				.sort((a, b) => a.localeCompare(b));
			return departments;
		}).catch(async err => {
			const fallback = FALLBACK_URL + `lecturers/departments.json`;
			const response = await fetch(fallback);
			if (!response.ok)
				throw Error(err);
			return await response.json() as string[];
		});
	}
	
	async getGroups(departmentparent_abbrname_selective = "All") {
		return this.fetchHtml({departmentparent_abbrname_selective}).then(html => {
			const select = this.parseAndGetFirstElBySelector(html, "#edit-studygroup-abbrname-selective");
			const groups = Array.from(select?.children ?? [])
								.map(child => (child as HTMLInputElement).value)
								.filter(inst => inst !== "All")
								.sort((a, b) => a.localeCompare(b));
			return groups;
		}).catch(async err => {
			let fallbackPath = `institutes/${departmentparent_abbrname_selective}.json`;
			if(departmentparent_abbrname_selective === "All") { //get all groups
				fallbackPath = `groups.json`;
			}
			const response = await fetch(FALLBACK_URL + fallbackPath);
			if (!response.ok)
				throw Error(err);
			return await response.json() as string[];
		})
	}

	private async parseTimetable(params: { [key: string]: string; }, suffix?: string) {
		try {
			const html = await this.fetchHtml(params, suffix);
			const table = this.parseAndGetFirstElBySelector(html, ".view-content");
			if (!table)
				throw Error("No table found");
			const days = Array.from(table.children);
			return days.map((day) => this.parseDay(day)).flat(1);
		} catch (err) {
			let fallbackPath = `timetables/${params?.studygroup_abbrname_selective}.json`;
			if (suffix === LECTURER_SUFFIX) {
				fallbackPath = `lecturers/timetables/${params?.teachername_selective}.json`;
			}
			if (suffix === SELECTIVE_SUFFIX) {
				fallbackPath = `selective/timetables/${params?.studygroup_abbrname_selective}.json`;
			}
			console.warn("Timetable fallback url", FALLBACK_URL + fallbackPath);
			const response = await fetch(FALLBACK_URL + fallbackPath);
			if (!response.ok) throw Error("Couldn't fetch or parse timetable");
			return await response.json() as TimetableItem[];
		}
	}
	
	async getTimetable(type: TimetableType, timetableName = "All", timetableCategory = "All") {
		const suffix = timetableSuffixes[type];
		if (suffix === SELECTIVE_SUFFIX) {
			return this.parseTimetable({studygroup_abbrname_selective: timetableName}, suffix);
		}
		if (suffix === LECTURER_SUFFIX) {
			return this.parseTimetable({
				department_name_selective: timetableCategory,
				teachername_selective: timetableName,
				assetbuilding_name_selective: "весь семестр"
			}, LECTURER_SUFFIX);
		}
		return this.parseTimetable({
			departmentparent_abbrname_selective: timetableCategory,
			studygroup_abbrname_selective: timetableName,
			semestrduration: '1', // Why, NULP?
		})
	}
	
	async getExamsTimetable(type: TimetableType, group = "All", institute = "All") {
		let request;
		if (type === 'lecturer') {
			request = this.fetchHtml({
				namedepartment_selective: institute,
				teachername_selective: group
			}, LECTURER_EXAMS_SUFFIX)
		} else {
			request = this.fetchHtml({
				departmentparent_abbrname_selective: institute,
				studygroup_abbrname_selective: group
			}, TIMETABLE_EXAMS_SUFFIX)
		}

		return request.then(html => {
			const content = this.parseAndGetFirstElBySelector(html, ".view-content");
			const exams = Array.from(content?.children ?? [])
								.map(this.parseExam)
			return exams;
		}).catch(async err => {
			throw Error(err);
		})
	}
	
	
	/*
		Exam DOM structure:
			header
			content
				h3 {exam.number}
				stud_schedule
					{exam.subject} 
					br
					{exam.lecturer}
					span
						a {exam.url}
	*/
	
	private parseExam(exam: Element) {
		const dayText = exam.querySelector(".view-grouping-header");
		if(!dayText) {
			throw Error("Got wrong DOM structure for exam!");
		}
		const date = new Date(dayText.textContent ?? "");
		let lecturer = "", subject = "", number = 0, urls: string[] = [];
		const contentChildren = exam.querySelector(".view-grouping-content")?.children ?? [];
	
		[...contentChildren].forEach(child => {
			// it's h3 with lesson number
			if (!child.classList.contains("stud_schedule")) { 
				number = parseInt(child.textContent ?? "0");
			// it's stud_schedule with lesson info
			} else { 																					
				const examContent = child.querySelector(".group_content");
				if(!examContent) {
					throw Error("Got wrong DOM structure for exam!");
				}
				[...examContent.childNodes].forEach(node => {
					// lecturer and subject are in text nodes
					if(node.nodeType === Node.TEXT_NODE) {
						const text = node.textContent?.trim();
						if(!text) return;
						if(!subject) subject = text; 
						else if(!lecturer) lecturer = text;
					}
					// urls are in a tags
					if(node.nodeType === Node.ELEMENT_NODE) {
						const a = (node as Element).querySelector("a");
						if(a) urls.push(a.href);
					}
				});
			}
		});
	
		return {
			date,
			lecturer,
			subject,
			number,
			urls
		} as ExamsTimetableItem;
	}

	private dayToNumber(day: string) {
		switch(day?.toLowerCase()) {
			case "пн":
				return 1;
			case "вт":
				return 2;
			case "ср":
				return 3;
			case "чт":
				return 4;
			case "пт":
				return 5;
			case "сб":
				return 6;
			case "нд":
				return 7;
			default:
				return -1;		
		}
	}
	
	private parseDay(day: Element) {
		const dayText = day.querySelector(".view-grouping-header");
		if(!dayText) {
			throw Error("Got wrong DOM structure for day!");
		}
		
		const dayNumber = this.dayToNumber(dayText.textContent ?? "");
		const contentChildren = day.querySelector(".view-grouping-content")?.children ?? [];
	
		let dayLessons: TimetableItem[] = [];
	
		let currentLessonNumber = 0;
		for(let i = 0; i < contentChildren.length; i++) {
			const child = contentChildren[i];
			if(child.classList.contains("stud_schedule")) {
				const lessons = this.parsePair(child);
				if(currentLessonNumber === 0) console.warn("Lesson number is 0!", child);
	
				for(const lesson of lessons) {
					lesson.day = dayNumber;
					lesson.number = currentLessonNumber;
				}
				
				dayLessons = dayLessons.concat(lessons);
			} else {
				currentLessonNumber = Number.parseInt(child.textContent ?? "0");
			}
		}
		return dayLessons;
	}
	
	private parsePair(pair: Element): TimetableItem[] {
		const lessonElements = pair.querySelectorAll(".group_content");
		const lessons = [];
	
		for(let element of lessonElements) {
			const id = element.parentElement?.id ?? "";
			const meta = this.parseLessonId(id);
	
			const data = this.parseLessonData(element);
	
			const lesson: TimetableItem = {
				...data, 
				type: this.tryToGetType(data.location), 
				...meta, 
				day: -1,
				number: -1
			};
			lessons.push(lesson);
		}
	
		return lessons;
	}
	
	private parseLessonData(element: Element) {
		const texts = []
		let lessonUrls = [];
		let br = false;
		for(let node of Array.from(element.childNodes)) {
			if(node.nodeName === "BR") {
				if(br) texts.push(""); //sometimes text is skipped with sequenced <br/> 
				br = true;
			} else if(node.nodeName === "SPAN") {
				lessonUrls.push((node as Element).querySelector("a")?.href ?? "");
				br = false;
			} else {
				br = false;
				texts.push(node.textContent)
			}
		}
		return {
			subject: texts[0] || "",
			lecturer: texts[1] || "",
			location: texts[2] || "",
			urls: lessonUrls,
		}
	}
	
	private parseLessonId(id: string) {
		const split = id.split("_");
		let subgroup: number | "all" = "all";
		let week = "full";
		if(id.includes("sub")) {
			subgroup = Number.parseInt(split[1]);
		}
		week = split[split.length-1];
		return {
			isFirstWeek: week === "full" || week === "chys",
			isSecondWeek: week === "full" || week === "znam",
			isFirstSubgroup: subgroup === "all" || subgroup === 1,
			isSecondSubgroup: subgroup === "all" || subgroup === 2,
		}
	}
	
	private tryToGetType(location: string): TimetableItemType {
		location = location.toLowerCase();
		if(location.includes("практична")) return "practical";
		if(location.includes("лабораторна")) return "lab";
		if(location.includes("конс.")) return "consultation";
		return "lecture";
	}
	
	private parseAndGetFirstElBySelector(html: string, css: string): HTMLElement | null {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		return doc.querySelector(css) ?? new HTMLElement();
	}

}

const parser = new TimetableParser();

export default parser;
