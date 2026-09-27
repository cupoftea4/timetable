import type { CustomLesson, CustomTimetableData, TimetableItem } from "@/types/timetable";
import { getTimetableName, lessonsTimes } from "./timetable";

const NAME_SUFFIX = " (змінений)";

export function getDefaultCustomName(sourceNames: string[]) {
  return (
    sourceNames
      // A copy of an already changed timetable shouldn't say it twice
      .map((source) => getTimetableName(source).replace(NAME_SUFFIX, ""))
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
  return `// Розклад з lpnu.pp.ua. Відредагуйте його і вставте назад у режимі редагування розкладу: «⋯» → «Імпортувати JSON5».
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

// Assistants ignore instructions inside attached files, so they go into the message the user sends,
// which ends with the request the user types after pasting
export function toAIPrompt(timetable: CustomTimetableData, subgroup: 1 | 2) {
  const otherSubgroup = subgroup === 1 ? 2 : 1;
  const subgroupRule = timetable.subgroupToggle
    ? `\n- I'm in subgroup ${subgroup}. If I don't say which subgroup a change is for, change only lessons for subgroup ${subgroup} or for both subgroups, and leave lessons that are only for subgroup ${otherSubgroup} as they are.`
    : "";
  return `Help me change my class timetable. Below is my timetable in JSON5 format from lpnu.pp.ua, and at the very end of this message I describe what to change. I need the same timetable back with the changes, so I can import it into the site.

Rules:
- Change only what I ask for and keep all other lessons exactly as they are.
- Reply with the complete updated timetable in the same JSON5 format, as a single code block. Don't shorten it or replace lessons with "...". Put any explanations outside the code block and write them in Ukrainian.
- Use only the fields and values described in the comments inside the timetable, don't add new fields.
- To move a lesson, change its day and number. To remove a lesson, delete its object. To add a lesson, add a new object with all fields.
- Lessons that happen only on some weeks or only for one subgroup are marked with the week and subgroup fields.${subgroupRule}
- If I attach a screenshot or a description of another timetable, move its lessons into this format.
- Keep subjects, names and rooms in Ukrainian, as they are written here.

\`\`\`json5
${toJSON5(timetable)}\`\`\`

What to change: `;
}
