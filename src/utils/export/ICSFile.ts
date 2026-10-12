import type { ExamsTimetableItem, TimetableItem } from "@/types/timetable";
import { getCurrentUADate, getNextLessonDate, isSecondNULPWeek } from "@/utils/date";
import { removeLineBreaks } from "@/utils/general";
import { formatLocationForGoogleMaps, getDisplayType, getWorkingSaturdays, lessonsTimes } from "../timetable";

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

function cleanInfo(text: string) {
  return text
    .replaceAll(/Лекція|Практична|Лабораторна/giu, "")
    .trim()
    .replace(/,$/, "");
}

function toTFormattedString(date: Date, time: string) {
  const [hours, minutes] = time.split(":");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}T${hours?.padStart(2, "0")}${minutes}00`;
}

export default class ISCFile {
  public static fromExamsTimetable(timetable: ExamsTimetableItem[]): string {
    const text = ISCFile.createICSFile(
      timetable
        .map(({ date, subject, lecturer, number, urls }) => {
          const [start, end] = ISCFile.lessonNumberToICSTime(date, number);
          return ISCFile.createEvent({
            start,
            end,
            summary: subject,
            description: lecturer,
            location: urls[0] ?? "",
          });
        })
        .join("")
    );
    return text;
  }

  public static fromTimetable(timetable: TimetableItem[], subgroup: 1 | 2): string {
    const now = getCurrentUADate();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const isCurrentWeekSecond = isSecondNULPWeek(now);
    const isForSubgroup = ({ isFirstSubgroup, isSecondSubgroup }: TimetableItem) =>
      isSecondSubgroup === (subgroup === 2) || (isFirstSubgroup && isSecondSubgroup);

    const weekly = timetable.filter(isForSubgroup).map((item) => {
      const date = getNextLessonDate(now, item.day, item.isFirstWeek, item.isSecondWeek, isCurrentWeekSecond);
      return ISCFile.lessonEvent(item, date, ISCFile.getRRULE(date, item.isFirstWeek, item.isSecondWeek, now));
    });
    const saturdays = getWorkingSaturdays(timetable)
      .filter(({ date }) => date >= today)
      .flatMap(({ date, lessons }) => lessons.filter(isForSubgroup).map((item) => ISCFile.lessonEvent(item, date)));

    return ISCFile.createICSFile([...weekly, ...saturdays].join(""));
  }

  private static lessonEvent(
    { number, subject, lecturer, location, urls, type }: TimetableItem,
    date: Date,
    rrule?: string
  ) {
    const [start, end] = ISCFile.lessonNumberToICSTime(date, number);
    const description = [cleanInfo(lecturer), cleanInfo(location), getDisplayType(type), urls[0]]
      .filter(Boolean)
      .join(", ");
    return ISCFile.createEvent({
      start,
      end,
      summary: subject,
      description,
      location: formatLocationForGoogleMaps(location),
      rrule,
    });
  }

  private static getTermEnd(now: Date) {
    const LAST_MONTH_TERM_1 = 5; // June
    const LAST_MONTH_TERM_2 = 11; // December
    const FIRST_MONTH_TERM_2 = 7; // September

    const isHoliday = (month: number) => month >= LAST_MONTH_TERM_1 && month < FIRST_MONTH_TERM_2;

    const currentMonth = now.getMonth();
    let month: number;

    if (isHoliday(currentMonth)) {
      month = currentMonth + 1;
    } else if (currentMonth <= LAST_MONTH_TERM_1) {
      month = LAST_MONTH_TERM_1;
    } else {
      month = LAST_MONTH_TERM_2;
    }

    return new Date(now.getFullYear(), month, 0);
  }

  private static getRRULE(firstDate: Date, isFirstWeek: boolean, isSecondWeek: boolean, now: Date): string {
    if (!isFirstWeek && !isSecondWeek) return "";
    const interval = isFirstWeek && isSecondWeek ? 1 : 2;
    const termEnd = ISCFile.getTermEnd(now);
    const occurrences = Math.floor((termEnd.getTime() - firstDate.getTime()) / (ONE_WEEK * interval)) + 1;
    const count = Math.max(occurrences, 1);
    return interval === 1 ? `FREQ=WEEKLY;INTERVAL=1;COUNT=${count}` : `FREQ=WEEKLY;INTERVAL=2;COUNT=${count};WKST=MO`;
  }

  private static lessonNumberToICSTime(date: Date, number: number) {
    const lessonTime = lessonsTimes[number - 1];
    if (!lessonTime) throw new Error(`Invalid lesson number: ${number}`);
    const { start, end } = lessonTime;
    const startTime = toTFormattedString(date, start);
    const endTime = toTFormattedString(date, end);
    return [startTime, endTime] as const;
  }

  private static createICSFile(content: string) {
    return `BEGIN:VCALENDAR
PRODID:Calendar
VERSION:2.0
BEGIN:VTIMEZONE
TZID:Europe/Kiev
LAST-MODIFIED:20050809T050000Z
BEGIN:STANDARD
DTSTART:20071104T040000
TZOFFSETFROM:+0300
TZOFFSETTO:+0200
TZNAME:EET
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:20070311T030000
TZOFFSETFROM:+0200
TZOFFSETTO:+0300
TZNAME:EEST
END:DAYLIGHT
END:VTIMEZONE
${content}
END:VCALENDAR`;
  }

  private static createEvent({
    start,
    end,
    summary,
    description,
    location,
    rrule,
  }: {
    start: string;
    end: string;
    summary: string;
    description: string;
    location?: string;
    rrule?: string;
  }) {
    const cleanSummary = removeLineBreaks(summary);
    return `
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${cleanSummary}
DESCRIPTION:${description}\
${location ? `\nLOCATION:${location}` : ""}\
${rrule ? `\nRRULE:${rrule}` : ""}
TRANSP:TRANSPARENT
END:VEVENT`;
  }
}
