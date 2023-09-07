/* eslint-disable no-tabs */
import type { ExamsTimetableItem, TimetableItem, TimetableItemType } from '@/types/timetable';

const INSTITUTES_SELECTOR = '#edit-departmentparent-abbrname-selective';
const GROUPS_SELECTOR = '#edit-studygroup-abbrname-selective';
const SELECTIVE_GROUPS_SELECTOR = '#edit-studygroup-abbrname-selective';
const LECTURERS_SELECTOR = '#edit-teachername-selective';
const DEPARTMENTS_SELECTOR = '#edit-department-name-selective';
const TIMETABLE_SELECTOR = '.view-content';

class TimetableParser {
  parseInstitutes (html: string) {
    const select = this.parseAndGetFirstElBySelector(html, INSTITUTES_SELECTOR);
    const institutes = Array.from(select?.children ?? [])
      .map(child => (child as HTMLInputElement).value)
      .filter(inst => inst !== 'All')
      .sort((a, b) => a.localeCompare(b));
    if (institutes.length === 0) throw new Error('No institutes found');
    return institutes;
  }

  parseGroups (html: string) {
    const select = this.parseAndGetFirstElBySelector(html, GROUPS_SELECTOR);
    const groups = Array.from(select?.children ?? [])
      .map(child => (child as HTMLInputElement).value)
      .filter(inst => inst !== 'All')
      .sort((a, b) => a.localeCompare(b));
    if (groups.length === 0) throw new Error('No groups found');
    return groups;
  }

  parseSelectiveGroups (html: string) {
    const select = this.parseAndGetFirstElBySelector(html, SELECTIVE_GROUPS_SELECTOR);
    const groups = Array.from(select?.children ?? [])
      .map(child => (child as HTMLInputElement).value)
      .filter(group => group !== 'All')
      .sort((a, b) => a.localeCompare(b));
    if (groups.length === 0) throw new Error('No groups found');
    return groups;
  }

  parseLecturers (html: string) {
    const select = this.parseAndGetFirstElBySelector(html, LECTURERS_SELECTOR);
    const lecturers = Array.from(select?.children ?? [])
      .map(child => (child as HTMLInputElement).value)
      .filter(inst => inst !== 'All')
      .sort((a, b) => a.localeCompare(b));
    if (lecturers.length === 0) throw new Error('No institutes found');
    return lecturers;
  }

  parseLecturerDepartments (html: string) {
    const select = this.parseAndGetFirstElBySelector(html, DEPARTMENTS_SELECTOR);
    const departments = Array.from(select?.children ?? [])
      .map(child => (child as HTMLInputElement).value)
      .filter(depart => depart !== 'All')
      .sort((a, b) => a.localeCompare(b));
    if (departments.length === 0) throw new Error('No institutes found');
    return departments;
  }

  parsePartialGroups (html: string) {
    const select = this.parseAndGetFirstElBySelector(html, GROUPS_SELECTOR);
    const groups = Array.from(select?.children ?? [])
      .map(child => (child as HTMLInputElement).value)
      .filter(inst => inst !== 'All')
      .sort((a, b) => a.localeCompare(b));
    return groups;
  }

  parseExamsTimetable (html: string) {
    const content = this.parseAndGetFirstElBySelector(html, TIMETABLE_SELECTOR);
    const exams = Array.from(content?.children ?? [])
      .map(this.parseExam);
    if (exams.length === 0) throw Error('Exams timetable is empty');
    return exams;
  }

  public parseTimetable (html: string) {
    const table = this.parseAndGetFirstElBySelector(html, TIMETABLE_SELECTOR);
    if (!table) throw Error('No table found');
    const timetable = this.parseTimetableV2(table);
    // const days = Array.from(table.children);
    // const timetable = days.map((day) => this.parseDay(day)).flat(1);
    if (timetable.length === 0) throw Error('Timetable is empty');
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

  private parseExam (exam: Element) {
    const dayText = exam.querySelector('.view-grouping-header');
    if (!dayText) {
      throw Error('Got wrong DOM structure for exam!');
    }
    const date = new Date(dayText.textContent ?? '');
    let lecturer = '', subject = '', number = 0;
    const urls: string[] = [];
    const contentChildren = exam.querySelector('.view-grouping-content')?.children ?? [];

    [...contentChildren].forEach(child => {
      // it's h3 with lesson number
      if (!child.classList.contains('stud_schedule')) {
        number = parseInt(child.textContent ?? '0');
        // it's stud_schedule with lesson info
      } else {
        const examContent = child.querySelector('.group_content');
        if (!examContent) {
          throw Error('Got wrong DOM structure for exam!');
        }
        [...examContent.childNodes].forEach(node => {
          // lecturer and subject are in text nodes
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (!text) return;
            if (!subject) subject = text;
            else if (!lecturer) lecturer = text;
          }
          // urls are in a tags
          if (node.nodeType === Node.ELEMENT_NODE) {
            const a = (node as Element).querySelector('a');
            if (a) urls.push(a.href);
          }
        });
      }
    });

    const result: ExamsTimetableItem = { date, lecturer, subject, number, urls };
    return result;
  }

  private dayToNumber (day: string) {
    const days = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'];
    return (days.indexOf(day.toLowerCase()) + 1) || -1;
  }

  private parseTimetableV2 (table: Element) {
    const contentChildren = table.children ?? [];

    let lessons: TimetableItem[] = [], currentLesson = 0, currentDay: number | undefined;

    for (let i = 0; i < contentChildren.length; i++) {
      const child = contentChildren[i];
      if (child?.classList.contains('view-grouping-header')) {
        currentDay = this.dayToNumber(child?.textContent ?? '');
      } else if (child?.tagName === 'H3') {
        currentLesson = Number.parseInt(child?.textContent ?? '0');
      } else if (child?.classList.contains('stud_schedule')) {
        const pairs = this.parsePair(child);
        if (currentLesson === 0) console.warn('Lesson number is 0!', child);
        if (currentDay === undefined) throw Error('Got wrong DOM structure for timetable: no day');

        for (const lesson of pairs) {
          lesson.day = currentDay;
          lesson.number = currentLesson;
        }

        lessons = lessons.concat(pairs);
      } else {
        throw Error('Got wrong DOM structure for timetable: unknown child');
      }
    }
    return lessons;
  }

  private parseDay (day: Element) {
    console.log(day);
    const dayText = day.querySelector('.view-grouping-header');
    if (!dayText) {
      throw Error('Got wrong DOM structure for day!');
    }

    const dayNumber = this.dayToNumber(dayText.textContent ?? '');
    const contentChildren = day.querySelector('.view-grouping-content')?.children ?? [];

    let dayLessons: TimetableItem[] = [], currentLessonNumber = 0;

    for (let i = 0; i < contentChildren.length; i++) {
      const child = contentChildren[i];
      if (child?.classList.contains('stud_schedule')) {
        const lessons = this.parsePair(child);
        if (currentLessonNumber === 0) console.warn('Lesson number is 0!', child);

        for (const lesson of lessons) {
          lesson.day = dayNumber;
          lesson.number = currentLessonNumber;
        }

        dayLessons = dayLessons.concat(lessons);
      } else {
        currentLessonNumber = Number.parseInt(child?.textContent ?? '0');
      }
    }
    return dayLessons;
  }

  private parsePair (pair: Element): TimetableItem[] {
    const lessonElements = pair.querySelectorAll('.group_content');
    const lessons = [];

    for (const element of lessonElements) {
      const id = element.parentElement?.id ?? '';
      const meta = this.parseLessonId(id);

      const data = this.parseLessonData(element);

      const lesson: TimetableItem = {
        ...data,
        type: this.tryToGetType(element.textContent ?? ''),
        ...meta,
        day: -1,
        number: -1
      };
      lessons.push(lesson);
    }

    return lessons;
  }

  private parseLessonData (element: Element) {
    const texts = [];
    const lessonUrls = [];
    let br = false;
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeName === 'BR') {
        if (br) texts.push(''); // sometimes text is skipped with sequenced <br/>
        br = true;
      } else if (node.nodeName === 'SPAN') {
        lessonUrls.push((node as Element).querySelector('a')?.href ?? '');
        br = false;
      } else {
        br = false;
        texts.push(node.textContent);
      }
    }

    const parts = texts[1]!.split(',');
    if (parts.length !== 3) {
      parts[0] = texts[1]!;
      parts[1] = '';
    }
    return {
      subject: texts[0] ?? '',
      lecturer: parts[0] ?? '',
      location: parts[1] ?? '',
      urls: lessonUrls
    };
  }

  private parseLessonId (id: string) {
    const split = id.split('_');
    let subgroup: number | 'all' = 'all', week = 'full';
    if (!split[1] || !split[split.length - 1]) throw Error('Got wrong lesson id!');
    if (id.includes('sub')) {
      subgroup = Number.parseInt(split[1]);
    }
    week = split[split.length - 1]!;
    return {
      isFirstWeek: week === 'full' || week === 'chys',
      isSecondWeek: week === 'full' || week === 'znam',
      isFirstSubgroup: subgroup === 'all' || subgroup === 1,
      isSecondSubgroup: subgroup === 'all' || subgroup === 2
    };
  }

  private tryToGetType (location: string): TimetableItemType {
    location = location.toLowerCase();
    if (location.includes('практична')) return 'practical';
    if (location.includes('лабораторна')) return 'lab';
    if (location.includes('конс.')) return 'consultation';
    return 'lection';
  }

  private parseAndGetFirstElBySelector (html: string, css: string): HTMLElement | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.querySelector(css);
  }
}

const parser = new TimetableParser();

export default parser;
