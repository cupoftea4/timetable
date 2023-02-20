import TimetableUtil from "./TimetableUtil";
import { ExamsTimetableItem, TimetableItem } from "./types";

function weeksLeftToDate(date: Date) {
  const timeDiff = date.getTime() - new Date().getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksLeft = Math.ceil(timeDiff / oneWeek);
  return weeksLeft;
}

export default class ISCFile {
  public static fromExamsTimetable(timetable: ExamsTimetableItem[]): string {
    const text = this.createICSFile(
      timetable.map(({
        date, subject, lecturer, number, urls
      }) => {
        const [start, end] = this.lessonNumberToICSTime(date, number);
        return this.createEvent({
          start, end,
          summary: subject,
          description: lecturer,
          location: urls[0] ?? ''
        });
      }).join(''));
    return text;
  } 

  public static fromTimetable(timetable: TimetableItem[], subgroup: 1 | 2, curWeek: 1 | 2): string {
    const text = this.createICSFile(
      timetable.map((
        {day, number, subject, lecturer, location, urls, isFirstWeek, isSecondWeek, isFirstSubgroup, isSecondSubgroup}
      ) => {
        if (isSecondSubgroup !== (subgroup === 2) && !(isFirstSubgroup && isSecondSubgroup)) return null;
        const date = new Date();
        const daysUntilNextDayOfWeek = (day - new Date().getDay() + 7) % 7;
        date.setDate(date.getDate() + daysUntilNextDayOfWeek + ((isSecondWeek === (curWeek === 2) && (isFirstSubgroup && isSecondSubgroup))? 7 : 0));
        const [start, end] = this.lessonNumberToICSTime(date, number);
        const rrule = this.getRRULE(isFirstWeek, isSecondWeek, curWeek);
        const [lecturerName, lecturerRoom] = lecturer.split(',');
        return this.createEvent({
          start, end,
          summary: subject,
          description: lecturerName + ',' + location,
          location: (lecturerRoom ?? "") + " " + (urls[0] ?? ''),
          rrule,
        });
    }).filter(Boolean).join(''));
    return text;
  }

  private static getRRULE(
    isFirstWeek: boolean,
    isSecondWeek: boolean, 
    curWeek: 1 | 2,
  ): string {
    const date = new Date();
    const lastMonth = new Date(date.getFullYear(), date.getMonth() < 8 ? 5 : 12, 0);
    const weeksToLastMonth = weeksLeftToDate(lastMonth);
    const halfWeeksToLastMonth = 
      (week: 1|2) => curWeek === week 
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

  private static lessonNumberToICSTime(date: Date, number: number) {
    const {start, end} = TimetableUtil.lessonsTimes[number - 1];
    const [startHours, startMinutes] = start.split(':');
    const [endHours, endMinutes] = end.split(':');
    date.setHours(+startHours, +startMinutes, 0, 0);
    const startTime = date.toISOString().replace(/[-:]|(\.000)/g, '');
    date.setHours(+endHours, +endMinutes, 0, 0);
    const endTime = date.toISOString().replace(/[-:]|\.000/g, '');
    return [startTime, endTime];
  }

  private static createICSFile(content: string) {
    return  `BEGIN:VCALENDAR
PRODID:Calendar
VERSION:2.0
${content}
END:VCALENDAR`;
  }

  private static createEvent({start, end, summary, description, location, rrule}: {
    start: string,
    end: string,
    summary: string,
    description: string,
    location?: string,
    rrule?: string,
  }) {
    return `
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${summary}
DESCRIPTION:${description}\
${location ? "\nLOCATION:" + location : ""}\
${rrule ? "\nRRULE:" + rrule : ""}
TRANSP:TRANSPARENT
END:VEVENT`;
  }
}