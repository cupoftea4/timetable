export const LVIV_TIMEZONE = "Europe/Uzhgorod";

export const getCurrentUADate = () => {
  const offset = new Date().getTimezoneOffset() * 60000;
  const date = new Date(Date.now() + offset + getTimezoneOffset(LVIV_TIMEZONE));
  return date;
};

const getTimezoneOffset = (timeZone: string, date = new Date()) => {
  const tz = date.toLocaleString("en", { timeZone, timeStyle: "long" }).split(" ").slice(-1)[0];
  const utc = date.toUTCString();
  const dateString = utc.substring(0, utc.length - 4);
  const offset = Date.parse(`${dateString} UTC`) - Date.parse(`${dateString} ${tz}`);
  // return UTC offset in millis
  return offset;
};

export const stringToDate = (time: string) => {
  const date = getCurrentUADate();
  const [hours, minutes] = time.split(":");
  if (!hours || !minutes) return "Invalid time format";
  date.setHours(+hours);
  date.setMinutes(+minutes);
  date.setSeconds(0);
  return date;
};

export function getNULPWeek() {
  const date = getCurrentUADate();
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export function getCurrentSemester(): "1" | "2" {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Month is 0-based, so we add 1
  const currentDay = currentDate.getDate();

  // Check if it's January 22 or later but before August 1
  if ((currentMonth === 1 && currentDay >= 22) || (currentMonth > 1 && currentMonth < 8)) {
    return "2"; // Second semester
  }
  return "1"; // First semester
}

export function countDaysFrom(startDate: Date): number {
  const currentDate = new Date();
  let workingDaysCount = 0;

  // Clone the start date to avoid mutating the original one
  const date = new Date(startDate);

  if (date > currentDate) {
    return -1;
  }

  // Loop through each day between the start date and current date
  // eslint-disable-next-line no-unmodified-loop-condition
  while (date <= currentDate) {
    workingDaysCount++;
    // Move to the next day
    date.setDate(date.getDate() + 1);
  }

  return workingDaysCount;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

export function isDateInWeek(date: Date, weekStart: Date): boolean {
  const start = getWeekStart(weekStart);
  const end = getWeekEnd(weekStart);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d >= start && d <= end;
}

export function getAvailableWeeks(items: { date?: Date }[]): Date[] {
  const weekStarts = new Set<string>();

  for (const item of items) {
    if (item.date) {
      const weekStart = getWeekStart(item.date);
      weekStarts.add(weekStart.toISOString());
    }
  }

  const weeks = Array.from(weekStarts)
    .map((iso) => new Date(iso))
    .sort((a, b) => a.getTime() - b.getTime());

  return weeks;
}

export function getCurrentWeek(weeks: Date[]): Date | undefined {
  if (weeks.length === 0) return undefined;

  const now = getCurrentUADate();
  now.setHours(0, 0, 0, 0);
  const currentWeekStart = getWeekStart(now);

  const currentOrFuture = weeks.find((week) => week >= currentWeekStart);
  if (currentOrFuture) return currentOrFuture;

  return weeks[weeks.length - 1];
}

export function formatWeekRange(weekStart: Date, isCurrent: boolean): string {
  const weekEnd = getWeekEnd(weekStart);

  const months = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];

  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const startMonth = months[weekStart.getMonth()];
  const endMonth = months[weekEnd.getMonth()];

  let range: string;
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    range = `${startDay}-${endDay} ${startMonth}`;
  } else {
    range = `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }

  return isCurrent ? `Поточний тиждень (${range})` : range;
}

// `day`: 1 = Monday … 7 = Sunday
export function getNextLessonDate(
  now: Date,
  day: number,
  isFirstWeek: boolean,
  isSecondWeek: boolean,
  isCurrentWeekSecond: boolean
): Date {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const today = date.getDay() || 7;
  date.setDate(date.getDate() + ((day - today + 7) % 7));
  if (isFirstWeek === isSecondWeek) return date;

  const isTargetWeekSecond = day < today ? !isCurrentWeekSecond : isCurrentWeekSecond;
  if (isSecondWeek !== isTargetWeekSecond) date.setDate(date.getDate() + 7);
  return date;
}
