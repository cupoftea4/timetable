import { formatLocationForGoogleMaps, lessonsTimes } from '../timetable';
import type { ExamsTimetableItem, TimetableItem } from '@/types/timetable';
import { removeLineBreaks } from '@/utils/general';

function toTFormattedString (date: Date, time: string) {
  const [hours, minutes] = time.split(':');
  const dateOnly = date.toISOString().substring(0, 10).replace(/-/g, '');
  const formattedTime = `${dateOnly}T${hours?.padStart(2, '0')}${minutes}00`;
  return formattedTime;
}

function weeksLeftToDate (date: Date) {
  const timeDiff = date.getTime() - new Date().getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksLeft = Math.ceil(timeDiff / oneWeek);
  return weeksLeft;
}

export default class ISCFile {
  public static fromExamsTimetable (timetable: ExamsTimetableItem[]): string {
    const text = this.createICSFile(
      timetable.map(({
        date, subject, lecturer, number, urls
      }) => {
        const [start, end] = this.lessonNumberToICSTime(date, number);
        return this.createEvent({
          start,
          end,
          summary: subject,
          description: lecturer,
          location: urls[0] ?? ''
        });
      }).join(''));
    return text;
  }

  public static fromTimetable (timetable: TimetableItem[], subgroup: 1 | 2, curWeek: 1 | 2): string {
    const text = this.createICSFile(
      timetable.map((
        { day, number, subject, lecturer, location, urls, isFirstWeek, isSecondWeek, isFirstSubgroup, isSecondSubgroup }
      ) => {
        if (isSecondSubgroup !== (subgroup === 2) && !(isFirstSubgroup && isSecondSubgroup)) return null;
        const date = new Date();
        const daysUntilNextDayOfWeek = (day - new Date().getDay() + 7) % 7;
        date.setDate(
          date.getDate() +
          daysUntilNextDayOfWeek +
          ((isSecondWeek === (curWeek === 2) && (isFirstSubgroup && isSecondSubgroup)) ? 7 : 0)
        );
        const [start, end] = this.lessonNumberToICSTime(date, number);
        const rrule = this.getRRULE(isFirstWeek, isSecondWeek, curWeek);
        const lectureLocation = lecturer.split(',')[1];

        return this.createEvent({
          start,
          end,
          summary: subject,
          description: location.replaceAll(/,./g, '').trim() + ', ' +
            lecturer.trim().replace(/,$/, '') + ' ' + (urls[0] ?? ''),
          location: formatLocationForGoogleMaps(lectureLocation),
          rrule
        });
      }).filter(Boolean).join(''));
    return text;
  }

  private static getRRULE (
    isFirstWeek: boolean,
    isSecondWeek: boolean,
    curWeek: 1 | 2
  ): string {
    const date = new Date();
    const LAST_MONTH_TERM_1 = 5; // June
    const LAST_MONTH_TERM_2 = 11; // December
    const FIRST_MONTH_TERM_2 = 7; // September

    const isHoliday = (month: number) => month >= LAST_MONTH_TERM_1 && month < FIRST_MONTH_TERM_2;

    const currentMonth = date.getMonth();
    let month;

    if (isHoliday(currentMonth)) {
      month = currentMonth + 1;
    } else if (currentMonth <= LAST_MONTH_TERM_1) {
      month = LAST_MONTH_TERM_1;
    } else {
      month = LAST_MONTH_TERM_2;
    }

    const lastMonth = new Date(date.getFullYear(), month, 0);
    const weeksToLastMonth = weeksLeftToDate(lastMonth);
    const halfWeeksToLastMonth =
      (week: 1 | 2) => curWeek === week
        ? Math.ceil(weeksToLastMonth / 2)
        : Math.floor(weeksToLastMonth / 2);
    if (isFirstWeek && isSecondWeek) {
      return 'FREQ=WEEKLY;INTERVAL=1;COUNT=' + weeksToLastMonth;
    } else if (isFirstWeek) {
      return `FREQ=WEEKLY;INTERVAL=2;COUNT=${halfWeeksToLastMonth(1)};WKST=MO;`;
    } else if (isSecondWeek) {
      return `FREQ=WEEKLY;INTERVAL=2;COUNT=${halfWeeksToLastMonth(2)};WKST=MO;`;
    } else {
      return '';
    }
  }

  private static lessonNumberToICSTime (date: Date, number: number) {
    if (!lessonsTimes[number - 1]) throw new Error(`Invalid lesson number: ${number}`);
    const { start, end } = lessonsTimes[number - 1]!;
    const startTime = toTFormattedString(date, start);
    const endTime = toTFormattedString(date, end);
    return [startTime, endTime] as const;
  }

  private static createICSFile (content: string) {
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

  private static createEvent ({ start, end, summary, description, location, rrule }: {
    start: string
    end: string
    summary: string
    description: string
    location?: string
    rrule?: string
  }) {
    const cleanSummary = removeLineBreaks(summary.trim());
    return `
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${cleanSummary}
DESCRIPTION:${description}\
${location ? '\nLOCATION:' + location : ''}\
${rrule ? '\nRRULE:' + rrule : ''}
TRANSP:TRANSPARENT
END:VEVENT`;
  }
}
