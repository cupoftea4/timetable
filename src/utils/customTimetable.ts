import type { CustomLesson, CustomTimetableData, TimetableItem } from "@/types/timetable";
import { getTimetableName, lessonsTimes } from "./timetable";

const NAME_SUFFIX = " (змінений)";

export function getDefaultCustomName(sourceNames: string[]) {
  return (
    sourceNames
      .map(getTimetableName)
      .join(" + ")
      .slice(0, 60 - NAME_SUFFIX.length) + NAME_SUFFIX
  );
}

export function toTimetableItems(lessons: CustomLesson[]): TimetableItem[] {
  return lessons.map(({ week, subgroup, details, ...lesson }) => ({
    ...lesson,
    isFirstWeek: week !== "znam",
    isSecondWeek: week !== "chys",
    isFirstSubgroup: subgroup !== 2,
    isSecondSubgroup: subgroup !== 1,
    urls: details
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean),
  }));
}

export function toCustomLessons(items: TimetableItem[]): CustomLesson[] {
  const lessons = items.map(
    (item): CustomLesson => ({
      day: item.day,
      number: item.number,
      subject: item.subject,
      lecturer: item.lecturer,
      location: item.location,
      type: item.type,
      week: item.isFirstWeek === item.isSecondWeek ? "all" : item.isFirstWeek ? "chys" : "znam",
      subgroup: item.isFirstSubgroup === item.isSecondSubgroup ? "all" : item.isFirstSubgroup ? 1 : 2,
      details: item.urls.join("\n"),
    })
  );
  // Merged timetables repeat lessons shared by several groups
  return [...new Map(lessons.map((lesson) => [JSON.stringify(lesson), lesson])).values()];
}

const LESSON_KEYS = [
  "day",
  "number",
  "subject",
  "lecturer",
  "location",
  "type",
  "week",
  "subgroup",
  "details",
] as const satisfies (keyof CustomLesson)[];

export function toJSON5({ name, subgroupToggle, lessons }: CustomTimetableData) {
  const lessonTimesComment = lessonsTimes.map(({ start, end }, i) => `${i + 1} = ${start}–${end}`).join(", ");
  const lessonLines = lessons
    .toSorted((a, b) => a.day - b.day || a.number - b.number)
    .map((lesson) => `    { ${LESSON_KEYS.map((key) => `${key}: ${JSON.stringify(lesson[key])}`).join(", ")} },`);
  return `// Розклад з lpnu.pp.ua. Відредагуйте цей файл і імпортуйте його в режимі редагування розкладу.
// Формат JSON5: можна писати коментарі та ставити кому після останнього елемента.
{
  // Назва розкладу, до 60 символів
  name: ${JSON.stringify(name)},
  // false — без перемикача підгруп, обидві підгрупи показуються разом (як у розкладі викладача)
  subgroupToggle: ${subgroupToggle},
  // До 150 пар. Поля кожної пари:
  //   day — день тижня: 1 = понеділок … 7 = неділя
  //   number — номер пари: ${lessonTimesComment}
  //   subject — назва предмета (обов'язково)
  //   lecturer, location — викладач і аудиторія (необов'язково)
  //   type — "lection" (лекція), "practical" (практична), "lab" (лабораторна), "consultation" (консультація)
  //   week — "all" (щотижня), "chys" (по чисельнику), "znam" (по знаменнику)
  //   subgroup — "all" (обидві підгрупи), 1 або 2
  //   details — посилання чи примітки, кожне з нового рядка "\\n" (необов'язково)
  lessons: [
${lessonLines.join("\n")}
  ],
}
`;
}

export function downloadJSON5(timetable: CustomTimetableData) {
  const url = URL.createObjectURL(new Blob([toJSON5(timetable)], { type: "application/json5" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${timetable.name}.json5`;
  link.click();
  URL.revokeObjectURL(url);
}
