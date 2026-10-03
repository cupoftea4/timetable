import {
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Dialog, DialogPanel, DialogTitle, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { type FC, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import timetableStyles from "@/features/timetable/Timetable.module.scss";
import usePageTitle from "@/hooks/usePageTitle";
import SourcePicker from "@/shared/SourcePicker";
import { classes } from "@/styles/utils";
import type { CustomLesson, CustomTimetable, CustomTimetableData, CustomTimetableDraft } from "@/types/timetable";
import {
  getDefaultCustomName,
  isHandEdited,
  keepSources,
  markEdited,
  toCustomLessons,
  toJSON5,
  toRemoved,
} from "@/utils/customTimetable";
import FallbackData from "@/utils/data/CachedData";
import TimetableManager from "@/utils/data/TimetableManager";
import { CUSTOM_PREFIX, getCustomId, getDisplayType, isCustom, lessonsTimes } from "@/utils/timetable";
import Toast, { errorMessage } from "@/utils/toasts";
import AiEditDialog from "./AiEditDialog";
import ConfirmDialog, { type Confirmation } from "./ConfirmDialog";
import { DAYS } from "./constants";
import LessonDialog from "./LessonDialog";
import styles from "./TimetableEditor.module.scss";

type DraftLesson = CustomLesson & { id: string };

const withIds = (lessons: CustomLesson[]) => lessons.map((lesson) => ({ ...lesson, id: crypto.randomUUID() }));
const toSlotId = (day: number, number: number) => day * 10 + number;

// Lessons are the string ids and slots the numeric ones; prefer a lesson under the pointer to reorder within a slot
const detectCollision: CollisionDetection = (args) => {
  const collisions = pointerWithin(args);
  const lesson = collisions.find(({ id }) => typeof id === "string");
  if (lesson) return [lesson];
  return collisions.length ? collisions : rectIntersection(args);
};

const LessonCard: FC<{ lesson: CustomLesson }> = ({ lesson }) => (
  <>
    <span className={styles.subject}>{lesson.subject}</span>
    <span className={styles.meta}>{[lesson.lecturer, lesson.location].filter(Boolean).join(", ")}</span>
    <span className={styles.badges}>
      {getDisplayType(lesson.type)}
      {lesson.week !== "all" && <span>{lesson.week === "chys" ? "чис." : "знам."}</span>}
      {lesson.subgroup !== "all" && <span>{lesson.subgroup === 1 ? "I" : "II"} підгр.</span>}
    </span>
  </>
);

const SortableLesson: FC<{ lesson: DraftLesson; onClick: () => void }> = ({ lesson, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({ id: lesson.id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={classes(styles.card, isDragging && styles.dragging)}
      data-type={lesson.type}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <LessonCard lesson={lesson} />
    </button>
  );
};

type SlotProps = {
  day: number;
  number: number;
  lessons: DraftLesson[];
  onAdd: () => void;
  onEdit: (lesson: DraftLesson) => void;
};

const Slot: FC<SlotProps> = ({ day, number, lessons, onAdd, onEdit }) => {
  const { setNodeRef, isOver } = useDroppable({ id: toSlotId(day, number) });
  return (
    <td ref={setNodeRef} className={classes(styles.slot, isOver && styles.over)}>
      <SortableContext items={lessons} strategy={verticalListSortingStrategy}>
        {lessons.map((lesson) => (
          <SortableLesson key={lesson.id} lesson={lesson} onClick={() => onEdit(lesson)} />
        ))}
      </SortableContext>
      <button
        type="button"
        className={styles.add}
        onClick={onAdd}
        aria-label={`Додати пару: ${DAYS[day - 1]}, ${number}`}
      >
        +
      </button>
    </td>
  );
};

type OwnProps = CustomTimetableDraft & {
  onCancel: () => void;
  onSaved: (timetable: CustomTimetable) => void;
  /** Subgroup selected in the timetable, so AI edits of the export default to it */
  subgroup: 1 | 2;
};

const TimetableEditor: FC<OwnProps> = ({
  group,
  timetable,
  draft: initialDraft,
  sourceNames,
  saved,
  onCancel,
  onSaved,
  subgroup,
}) => {
  const [name, setName] = useState(initialDraft.name);
  const [subgroupToggle, setSubgroupToggle] = useState(initialDraft.subgroupToggle);
  // Deleted source lessons are kept aside and only put back on save, so the grid and exports never see them
  const [lessons, setLessons] = useState(() => withIds(initialDraft.lessons.filter((lesson) => !lesson.removed)));
  const [removed, setRemoved] = useState(() => initialDraft.lessons.filter((lesson) => lesson.removed));
  const [sources, setSources] = useState(initialDraft.sourceNames ?? sourceNames);
  // Escape in the name field brings this back
  const nameBeforeEdit = useRef(initialDraft.name);
  const [editedLesson, setEditedLesson] = useState<CustomLesson & { id?: string }>();
  const [draggedId, setDraggedId] = useState<string>();
  const [importText, setImportText] = useState<string>();
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  usePageTitle(`Редагування: ${name}`);

  const visibleLessons = lessons.map(({ id: _, ...lesson }) => lesson);
  const visibleDraft: CustomTimetableData = { name: name.trim(), subgroupToggle, lessons: visibleLessons };
  const draft: CustomTimetableData = { ...visibleDraft, lessons: [...visibleLessons, ...removed] };

  const initialLessons = [
    ...timetable.lessons.filter((lesson) => !lesson.removed),
    ...timetable.lessons.filter((lesson) => lesson.removed),
  ];
  const isDirty =
    JSON.stringify({ ...draft, sources }) !==
    JSON.stringify({ ...timetable, lessons: initialLessons, sources: sourceNames });
  const days = DAYS.slice(0, lessons.some((lesson) => lesson.day === 7) ? 7 : 6);
  const draggedLesson = lessons.find((lesson) => lesson.id === draggedId);

  // Kept until cancel, save or delete, so reloading or leaving the page doesn't lose the edit
  useEffect(() => {
    const allLessons = [...lessons.map(({ id: _, ...lesson }) => lesson), ...removed];
    const draft = { name, subgroupToggle, lessons: allLessons, sourceNames: sources };
    TimetableManager.saveCustomDraft(group, { group, timetable, draft, sourceNames, saved });
  }, [group, timetable, name, subgroupToggle, lessons, removed, sources, sourceNames, saved]);

  const moveLesson = ({ active, over }: DragEndEvent) => {
    setDraggedId(undefined);
    if (!over || over.id === active.id) return;
    setLessons((current) => {
      const from = current.findIndex((lesson) => lesson.id === active.id);
      const target = current.find((lesson) => lesson.id === over.id);
      const { day, number } = target ?? { day: Math.floor(Number(over.id) / 10), number: Number(over.id) % 10 };
      const moved = current.map((lesson, i) =>
        i === from ? { ...markEdited(lesson, { ...lesson, day, number }), id: lesson.id } : lesson
      );
      // Dropped on a lesson: take its place, dropped on an empty part of a slot: go last
      return arrayMove(moved, from, target ? current.indexOf(target) : current.length - 1);
    });
  };

  const saveLesson = ({ id, ...lesson }: CustomLesson & { id?: string }) => {
    setLessons((current) =>
      id
        ? current.map((l) => (l.id === id ? { ...markEdited(l, lesson), id } : l))
        : [...current, { ...lesson, source: undefined, original: undefined, id: crypto.randomUUID() }]
    );
    setEditedLesson(undefined);
  };

  const run = async (action: () => Promise<void>) => {
    setPending(true);
    try {
      await action();
    } catch (e) {
      Toast.error(e, errorMessage(e));
    } finally {
      setPending(false);
    }
  };

  // Untouched lessons of several groups stay merged and keep following them, edited ones stop
  const save = () =>
    run(async () => {
      const merged = !isHandEdited(draft) && sources.length > 1 && (!saved || saved.merged);
      const data = { ...draft, sourceNames: sources };
      const mergedData = { name: data.name, sourceNames: sources };
      let id: string;
      if (saved) {
        id = saved.id;
        if (merged) await FallbackData.updateMergedTimetable(id, saved.editToken, mergedData);
        else await FallbackData.updateCustomTimetable(id, saved.editToken, data);
      } else if (merged) {
        id = getCustomId(await TimetableManager.createMergedTimetable(mergedData));
      } else {
        const created = await FallbackData.createCustomTimetable(data);
        await TimetableManager.saveCustomEditToken(created.id, created.editToken);
        id = created.id;
      }
      const kind = merged ? "merged" : "edited";
      onSaved({ ...data, id, kind, updatedAt: new Date().toISOString(), deletedAt: null });
    });

  // A name the user hasn't changed follows the groups
  const changeSources = (next: string[]) => {
    if (name === getDefaultCustomName(sources)) setName(getDefaultCustomName(next));
    setSources(next);
  };

  const addSource = (source: string) =>
    run(async () => {
      const [cached, fetched] = TimetableManager.getTimetable(source);
      const items = (await fetched) ?? (await cached);
      if (!items) throw Error("Не вдалося завантажити розклад");
      changeSources([...sources, source]);
      setLessons((current) => [...current, ...withIds(toCustomLessons(items, source))]);
    });

  const removeSource = (source: string) => {
    changeSources(sources.filter((s) => s !== source));
    setLessons((current) => current.filter((lesson) => lesson.source !== source));
    setRemoved((current) => current.filter((lesson) => lesson.source !== source));
  };

  const copyJSON5 = () =>
    navigator.clipboard.writeText(toJSON5(visibleDraft)).then(
      () => Toast.success("Розклад скопійовано"),
      (e) => Toast.error(e, "Не вдалося скопіювати розклад")
    );

  const importDraft = (text: string, closeDialog: () => void) =>
    run(async () => {
      // AI answers put the timetable in a markdown code block, often with explanations around it
      const imported = await FallbackData.parseCustomTimetable(text.match(/```\w*\n([\s\S]*?)```/)?.[1] ?? text);
      const kept = keepSources(visibleLessons, imported.lessons);
      setName(imported.name);
      setSubgroupToggle(imported.subgroupToggle);
      setLessons(withIds(kept.lessons));
      setRemoved((current) => [...current, ...kept.removed]);
      closeDialog();
    });

  const remove = (saved: { id: string; editToken: string }) =>
    setConfirmation({
      title: "Видалити розклад?",
      text: "Посилання на нього перестане працювати для всіх.",
      confirmLabel: "Видалити",
      danger: true,
      onConfirm: () =>
        run(async () => {
          await FallbackData.deleteCustomTimetable(saved.id, saved.editToken);
          await TimetableManager.deleteTimetable(CUSTOM_PREFIX + saved.id);
          await TimetableManager.saveCustomDraft(group, null);
          navigate(`/${sources[0] ?? "home"}`, { replace: true });
        }),
    });

  const cancel = () => {
    if (!isDirty) return onCancel();
    setConfirmation({
      title: "Скасувати всі зміни?",
      text: "Незбережені зміни буде втрачено, а розклад залишиться таким, як до редагування.",
      confirmLabel: "Скасувати зміни",
      danger: true,
      onConfirm: onCancel,
    });
  };

  return (
    <div className={styles.editor}>
      <header className={styles.toolbar}>
        <input
          className={styles.name}
          value={name}
          maxLength={60}
          spellCheck={false}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => {
            nameBeforeEdit.current = name;
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setName(nameBeforeEdit.current);
            if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
          }}
          aria-label="Назва розкладу"
        />
        <Menu>
          <MenuButton className={classes(styles.button, styles.more)} aria-label="Інші дії">
            ⋯
          </MenuButton>
          <MenuItems modal={false} anchor={{ to: "bottom end", gap: 8 }} className={styles.menu}>
            <MenuItem>
              <button type="button" onClick={() => setShowAiDialog(true)}>
                Змінити з ШІ
              </button>
            </MenuItem>
            <MenuItem>
              <button type="button" onClick={copyJSON5}>
                Скопіювати JSON5
              </button>
            </MenuItem>
            <MenuItem>
              <button type="button" onClick={() => setImportText("")}>
                Імпортувати JSON5
              </button>
            </MenuItem>
            {saved && (
              <MenuItem>
                <button type="button" className={styles.danger} onClick={() => remove(saved)}>
                  Видалити розклад
                </button>
              </MenuItem>
            )}
          </MenuItems>
        </Menu>
        <button type="button" className={styles.button} onClick={cancel} disabled={pending}>
          Скасувати
        </button>
        <button type="button" className={classes(styles.button, styles.primary)} onClick={save} disabled={pending}>
          {saved ? "Зберегти" : isCustom(group) ? "Створити копію" : "Створити розклад"}
        </button>
      </header>
      <div className={styles.sources}>
        <span className={styles.sourcesLabel}>Групи:</span>
        {/* At least one group stays, so the timetable always has a source */}
        <SourcePicker
          compact
          value={sources}
          locked={sources.length === 1 ? sources[0] : undefined}
          disabled={pending}
          onAdd={addSource}
          onRemove={removeSource}
        />
      </div>
      <p className={styles.hint}>
        {saved ? "Зміни побачать усі, у кого є посилання." : "Оригінал не зміниться, ви отримаєте нове посилання."}{" "}
        Перетягуйте пари між клітинками, натисніть на пару, щоб змінити її, або на «+», щоб додати нову.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={detectCollision}
        onDragStart={({ active }) => setDraggedId(String(active.id))}
        onDragEnd={moveLesson}
        onDragCancel={() => setDraggedId(undefined)}
      >
        <table className={classes(timetableStyles.timetable, styles.grid)}>
          <thead>
            <tr>
              <th />
              {days.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lessonsTimes.map((time, i) => (
              <tr key={time.start}>
                <th>
                  <span className={classes(timetableStyles.metadata, timetableStyles.start)}>{time.start}</span>
                  <span className={classes(timetableStyles.metadata, timetableStyles.number)}>{i + 1}</span>
                  <span className={classes(timetableStyles.metadata, timetableStyles.end)}>{time.end}</span>
                </th>
                {days.map((dayName, j) => (
                  <Slot
                    key={dayName}
                    day={j + 1}
                    number={i + 1}
                    lessons={lessons.filter((lesson) => lesson.day === j + 1 && lesson.number === i + 1)}
                    onEdit={setEditedLesson}
                    onAdd={() =>
                      setEditedLesson({
                        day: j + 1,
                        number: i + 1,
                        subject: "",
                        lecturer: "",
                        location: "",
                        type: "lection",
                        week: "all",
                        subgroup: "all",
                        details: "",
                      })
                    }
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <DragOverlay>
          {draggedLesson && (
            <div className={classes(styles.card, styles.overlay)} data-type={draggedLesson.type}>
              <LessonCard lesson={draggedLesson} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      {confirmation && <ConfirmDialog {...confirmation} onClose={() => setConfirmation(undefined)} />}
      {showAiDialog && (
        <AiEditDialog
          timetable={visibleDraft}
          subgroup={subgroup}
          pending={pending}
          onApply={(answer) => importDraft(answer, () => setShowAiDialog(false))}
          onClose={() => setShowAiDialog(false)}
        />
      )}
      {editedLesson && (
        <LessonDialog
          lesson={editedLesson}
          isNew={!editedLesson.id}
          onSave={(lesson) => saveLesson({ ...lesson, id: editedLesson.id })}
          onDuplicate={(lesson) => saveLesson({ ...lesson, id: undefined })}
          onDelete={() => {
            setRemoved((current) => [...current, ...toRemoved(editedLesson)]);
            setLessons((current) => current.filter((lesson) => lesson.id !== editedLesson.id));
            setEditedLesson(undefined);
          }}
          onClose={() => setEditedLesson(undefined)}
        />
      )}
      <Dialog open={importText !== undefined} onClose={() => setImportText(undefined)} className={styles.backdrop}>
        <DialogPanel className={styles.dialog}>
          <DialogTitle className={styles.dialogTitle}>Імпорт JSON5</DialogTitle>
          <p className={styles.hint}>
            Вставте відредагований розклад у форматі JSON5 або JSON. Він замінить усі пари в редакторі, а зберегти зміни
            можна буде після перевірки.
          </p>
          <textarea
            className={styles.importText}
            rows={14}
            value={importText ?? ""}
            onChange={(e) => setImportText(e.target.value)}
            aria-label="Текст JSON5"
          />
          <div className={styles.dialogActions}>
            <button type="button" className={styles.pushRight} onClick={() => setImportText(undefined)}>
              Скасувати
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={() => importDraft(importText ?? "", () => setImportText(undefined))}
              disabled={pending || !importText?.trim()}
            >
              Імпортувати
            </button>
          </div>
        </DialogPanel>
      </Dialog>
    </div>
  );
};

export default TimetableEditor;
