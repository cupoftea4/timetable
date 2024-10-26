import type { ExamsTimetableItem, TimetableItem, TimetableItemType } from "@/types/timetable";

const INSTITUTES_SELECTOR = "#edit-departmentparent-abbrname-selective";
const GROUPS_SELECTOR = "#edit-studygroup-abbrname-selective";
const SELECTIVE_GROUPS_SELECTOR = "#edit-studygroup-abbrname-selective";
const LECTURERS_SELECTOR = "#edit-teachername-selective";
const DEPARTMENTS_SELECTOR = "#edit-department-name-selective";
const TIMETABLE_SELECTOR = ".view-content";

class TimetableParser {
  parseInstitutes(html: string) {
    const select = this.parseAndGetFirstElBySelector(html, INSTITUTES_SELECTOR);
    const institutes = Array.from(select?.children ?? [])
      .map((child) => (child as HTMLInputElement).value)
      .filter((inst) => inst !== "All")
      .sort((a, b) => a.localeCompare(b));
    if (institutes.length === 0) throw new Error("No institutes found");
    return institutes;
  }

  parseGroups(html: string) {
    const select = this.parseAndGetFirstElBySelector(html, GROUPS_SELECTOR);
    const groups = Array.from(select?.children ?? [])
      .map((child) => (child as HTMLInputElement).value)
      .filter((inst) => inst !== "All")
      .sort((a, b) => a.localeCompare(b));
    if (groups.length === 0) throw new Error("No groups found");
    return groups;
  }

  parseSelectiveGroups(html: string) {
    const select = this.parseAndGetFirstElBySelector(html, SELECTIVE_GROUPS_SELECTOR);
    const groups = Array.from(select?.children ?? [])
      .map((child) => (child as HTMLInputElement).value)
      .filter((group) => group !== "All")
      .sort((a, b) => a.localeCompare(b));
    if (groups.length === 0) throw new Error("No groups found");
    return groups;
  }

  parseLecturers(html: string) {
    const select = this.parseAndGetFirstElBySelector(html, LECTURERS_SELECTOR);
    const lecturers = Array.from(select?.children ?? [])
      .map((child) => (child as HTMLInputElement).value)
      .filter((inst) => inst !== "All")
      .sort((a, b) => a.localeCompare(b));
    if (lecturers.length === 0) throw new Error("No institutes found");
    return lecturers;
  }

  parseLecturerDepartments(html: string) {
    const select = this.parseAndGetFirstElBySelector(html, DEPARTMENTS_SELECTOR);
    const departments = Array.from(select?.children ?? [])
      .map((child) => (child as HTMLInputElement).value)
      .filter((depart) => depart !== "All")
      .sort((a, b) => a.localeCompare(b));
    if (departments.length === 0) throw new Error("No institutes found");
    return departments;
  }

  parsePartialGroups(html: string) {
    const select = this.parseAndGetFirstElBySelector(html, GROUPS_SELECTOR);
    const groups = Array.from(select?.children ?? [])
      .map((child) => (child as HTMLInputElement).value)
      .filter((inst) => inst !== "All")
      .sort((a, b) => a.localeCompare(b));
    return groups;
  }

  parseExamsTimetable(html: string) {
    console.log("html", html);
    const content = this.parseAndGetFirstElBySelector(html, TIMETABLE_SELECTOR);
    if (!content) throw Error("No content found");
    const exams = this.parseExamsTimetableV2(content);
    if (exams.length === 0) throw Error("Exams timetable is empty");
    return exams;
  }

  public parseTimetable(html: string) {
    const table = this.parseAndGetFirstElBySelector(html, TIMETABLE_SELECTOR);
    if (!table) throw Error("No table found");
    const timetable = this.parseTimetableV2(table);
    if (timetable.length === 0) throw Error("Timetable is empty");
    return timetable;
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

  private dayToNumber(day: string) {
    const days = ["пн", "вт", "ср", "чт", "пт", "сб", "нд"];
    return days.indexOf(day.toLowerCase()) + 1 || -1;
  }

  private parseTimetableV2(table: Element) {
    const contentChildren = table.children ?? [];

    let lessons: TimetableItem[] = [];
    let currentLesson = 0;
    let currentDay: number | undefined;

    for (let i = 0; i < contentChildren.length; i++) {
      const child = contentChildren[i];
      if (child?.classList.contains("view-grouping-header")) {
        currentDay = this.dayToNumber(child?.textContent ?? "");
      } else if (child?.tagName === "H3") {
        currentLesson = Number.parseInt(child?.textContent ?? "0");
      } else if (child?.classList.contains("stud_schedule")) {
        const pairs = this.parsePair(child);
        if (currentLesson === 0) console.warn("Lesson number is 0!", child);
        if (currentDay === undefined) throw Error("Got wrong DOM structure for timetable: no day");

        for (const lesson of pairs) {
          lesson.day = currentDay;
          lesson.number = currentLesson;
        }

        lessons = lessons.concat(pairs);
      } else {
        throw Error("Got wrong DOM structure for timetable: unknown child");
      }
    }
    return lessons;
  }

  private parseExamsTimetableV2(content: Element) {
    const contentChildren = content.children ?? [];

    const exams: ExamsTimetableItem[] = [];
    let currentExam: Partial<ExamsTimetableItem> = { urls: [] };
    let firstLoop = true;

    const saveExam = (exam: Partial<ExamsTimetableItem>) => {
      if (!exam.date || !exam.number || !exam.subject || !exam.lecturer || !exam.urls) {
        console.error("Got wrong DOM structure for exam: not all fields are filled", exam);
      } else {
        exams.push(exam as ExamsTimetableItem);
      }
    };

    for (let i = 0; i < contentChildren.length; i++) {
      const child = contentChildren[i];
      if (child?.classList.contains("view-grouping-header")) {
        if (!child.textContent) continue; // don't ask me why 🫠
        if (!firstLoop) {
          saveExam(currentExam);
        }
        firstLoop = false;
        currentExam = { urls: [] }; // golang style, sry
        currentExam.date = new Date(child.textContent ?? "");
      } else if (child?.tagName === "H3") {
        currentExam.number = Number.parseInt(child?.textContent ?? "0");
      } else if (child?.classList.contains("stud_schedule")) {
        const textContent = child.querySelector(".group_content");
        console.log("textContent", textContent);
        for (const element of textContent?.childNodes ?? []) {
          if (element.nodeType !== Node.TEXT_NODE) continue;
          if (!currentExam.subject) {
            currentExam.subject = element.textContent ?? "";
          } else if (!currentExam.lecturer) {
            // careful, last text element is empty in lecturers exams timetable
            currentExam.lecturer = element.textContent ?? "";
          }
        }
      } else {
        throw Error("Got wrong DOM structure for timetable: unknown child");
      }
    }
    saveExam(currentExam);
    return exams;
  }

  private parsePair(pair: Element): TimetableItem[] {
    const lessonElements = pair.querySelectorAll(".group_content");
    const lessons = [];

    for (const element of lessonElements) {
      const id = element.parentElement?.id ?? "";
      const meta = this.parseLessonId(id);

      const data = this.parseLessonData(element);

      const lesson: TimetableItem = {
        ...data,
        type: this.tryToGetType(element.textContent ?? ""),
        ...meta,
        day: -1,
        number: -1,
      };
      lessons.push(lesson);
    }

    return lessons;
  }

  private parseLessonData(element: Element) {
    const texts = [];
    const lessonUrls = [];
    let br = false;
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeName === "BR") {
        if (br) texts.push(""); // sometimes text is skipped with sequenced <br/>
        br = true;
      } else if (node.nodeName === "SPAN") {
        const a = (node as Element).querySelector("a");
        const url = a?.getAttribute("href");
        const fixedUrl = url?.startsWith("http") ? url : `https://${url}`;
        lessonUrls.push(fixedUrl);
        br = false;
      } else {
        br = false;
        texts.push(node.textContent);
      }
    }

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const parts = texts[1]!.split(",");
    if (parts.length !== 3) {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      parts[0] = texts[1]!;
      parts[1] = "";
    }
    return {
      subject: texts[0] ?? "",
      lecturer: parts[0] ?? "",
      location: parts[1] ?? "",
      urls: lessonUrls,
    };
  }

  private parseLessonId(id: string) {
    const split = id.split("_");
    let subgroup: number | "all" = "all";
    let week = "full";
    if (!split[1] || !split[split.length - 1]) throw Error("Got wrong lesson id!");
    if (id.includes("sub")) {
      subgroup = Number.parseInt(split[1]);
    }
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    week = split[split.length - 1]!;
    return {
      isFirstWeek: week === "full" || week === "chys",
      isSecondWeek: week === "full" || week === "znam",
      isFirstSubgroup: subgroup === "all" || subgroup === 1,
      isSecondSubgroup: subgroup === "all" || subgroup === 2,
    };
  }

  private tryToGetType(location: string): TimetableItemType {
    const locationClean = location.toLowerCase();
    if (locationClean.includes("практична")) return "practical";
    if (locationClean.includes("лабораторна")) return "lab";
    if (locationClean.includes("конс.")) return "consultation";
    return "lection";
  }

  private parseAndGetFirstElBySelector(html: string, css: string): HTMLElement | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.querySelector(css);
  }
}

const parser = new TimetableParser();

export default parser;
