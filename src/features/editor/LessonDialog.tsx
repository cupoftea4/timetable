import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Field,
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { type FC, useState } from "react";
import type { CustomLesson } from "@/types/timetable";
import { getDisplayType, lessonsTimes } from "@/utils/timetable";
import { DAYS } from "./constants";
import styles from "./TimetableEditor.module.scss";

type Option<T> = readonly [T, string];

const TYPES = (["lection", "practical", "lab", "consultation"] as const).map(
  (type): Option<CustomLesson["type"]> => [type, getDisplayType(type)]
);
const WEEKS: Option<CustomLesson["week"]>[] = [
  ["all", "Щотижня"],
  ["chys", "По чисельнику"],
  ["znam", "По знаменнику"],
];
const SUBGROUPS: Option<CustomLesson["subgroup"]>[] = [
  ["all", "Обидві"],
  [1, "I підгрупа"],
  [2, "II підгрупа"],
];
const DAY_OPTIONS = DAYS.map((day, i): Option<number> => [i + 1, day]);
const NUMBER_OPTIONS = lessonsTimes.map(({ start, end }, i): Option<number> => [i + 1, `${i + 1} (${start}–${end})`]);

type SelectProps<T> = { label: string; value: T; options: Option<T>[]; onChange: (value: T) => void };

const Select = <T extends string | number>({ label, value, options, onChange }: SelectProps<T>) => (
  <Field className={styles.field}>
    <Label>{label}</Label>
    <Listbox value={value} onChange={onChange}>
      <ListboxButton className={styles.select}>
        {options.find(([optionValue]) => optionValue === value)?.[1]}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </ListboxButton>
      <ListboxOptions anchor={{ to: "bottom start", gap: 4 }} className={styles.options}>
        {options.map(([optionValue, text]) => (
          <ListboxOption key={optionValue} value={optionValue} className={styles.option}>
            {text}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  </Field>
);

type OwnProps = {
  lesson: CustomLesson;
  isNew: boolean;
  onSave: (lesson: CustomLesson) => void;
  onDuplicate: (lesson: CustomLesson) => void;
  onDelete: () => void;
  onClose: () => void;
};

const LessonDialog: FC<OwnProps> = ({ lesson: initialLesson, isNew, onSave, onDuplicate, onDelete, onClose }) => {
  const [lesson, setLesson] = useState(initialLesson);
  const set = <K extends keyof CustomLesson>(key: K, value: CustomLesson[K]) =>
    setLesson((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open onClose={onClose} className={styles.backdrop}>
      <DialogPanel
        as="form"
        className={styles.dialog}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(lesson);
        }}
      >
        <DialogTitle className={styles.dialogTitle}>{isNew ? "Нова пара" : "Редагування пари"}</DialogTitle>
        <label className={styles.field}>
          Предмет
          <input
            required
            autoFocus
            maxLength={200}
            value={lesson.subject}
            onChange={(e) => set("subject", e.target.value)}
          />
        </label>
        <div className={styles.row}>
          <label className={styles.field}>
            Викладач
            <input maxLength={200} value={lesson.lecturer} onChange={(e) => set("lecturer", e.target.value)} />
          </label>
          <label className={styles.field}>
            Аудиторія
            <input maxLength={200} value={lesson.location} onChange={(e) => set("location", e.target.value)} />
          </label>
        </div>
        <div className={styles.row}>
          <Select label="День" value={lesson.day} options={DAY_OPTIONS} onChange={(value) => set("day", value)} />
          <Select
            label="Пара"
            value={lesson.number}
            options={NUMBER_OPTIONS}
            onChange={(value) => set("number", value)}
          />
        </div>
        <div className={styles.row}>
          <Select label="Тип" value={lesson.type} options={TYPES} onChange={(value) => set("type", value)} />
          <Select label="Тиждень" value={lesson.week} options={WEEKS} onChange={(value) => set("week", value)} />
          <Select
            label="Підгрупа"
            value={lesson.subgroup}
            options={SUBGROUPS}
            onChange={(value) => set("subgroup", value)}
          />
        </div>
        <label className={styles.field}>
          Посилання та примітки
          <textarea rows={3} maxLength={1000} value={lesson.details} onChange={(e) => set("details", e.target.value)} />
        </label>
        <div className={styles.dialogActions}>
          {!isNew && (
            <>
              <button type="button" className={styles.danger} onClick={onDelete}>
                Видалити
              </button>
              <button type="button" onClick={() => onDuplicate(lesson)}>
                Дублювати
              </button>
            </>
          )}
          <button type="button" className={styles.pushRight} onClick={onClose}>
            Скасувати
          </button>
          <button type="submit" className={styles.primary}>
            {isNew ? "Додати" : "Готово"}
          </button>
        </div>
      </DialogPanel>
    </Dialog>
  );
};

export default LessonDialog;
