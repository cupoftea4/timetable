import { CloseButton } from "@headlessui/react";
import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import TrashIcon from "@/assets/TrashIcon";
import ConfirmDialog from "@/features/editor/ConfirmDialog";
import { useIsTablet } from "@/hooks/useMediaQuery";
import Drawer from "@/shared/Drawer";
import SourcePicker from "@/shared/SourcePicker";
import type { CustomTimetable } from "@/types/timetable";
import FallbackData from "@/utils/data/CachedData";
import TimetableManager from "@/utils/data/TimetableManager";
import { getTimetableName, isMerged } from "@/utils/timetable";
import Toast, { errorMessage } from "@/utils/toasts";
import styles from "./CreateMergedModal.module.scss";

type Editing = CustomTimetable & { editToken: string };

// Lessons of removed groups go, the ones of added groups come in, hand edits stay
async function updateEdited(editing: Editing, timetable: { name: string; sourceNames: string[] }) {
  const added = timetable.sourceNames.filter((source) => !editing.sourceNames.includes(source));
  const addedLessons = await Promise.all(added.map((source) => TimetableManager.getSourceLessons(source)));
  const lessons = editing.lessons.filter((lesson) => !lesson.source || timetable.sourceNames.includes(lesson.source));
  const data = { ...timetable, subgroupToggle: editing.subgroupToggle, lessons: [...lessons, ...addedLessons.flat()] };
  return FallbackData.updateCustomTimetable(editing.id, editing.editToken, data);
}

type OwnProps = {
  defaultTimetables: string[];
  editing?: Editing;
  onClose: () => void;
  onUpdated: () => void;
};

const CreateMergedModal: FC<OwnProps> = ({ defaultTimetables, editing, onClose, onUpdated }) => {
  const initialTimetables = (editing?.sourceNames ?? defaultTimetables).filter((t) => !isMerged(t));
  const [timetablesToMerge, setTimetablesToMerge] = useState(initialTimetables);
  const [name, setName] = useState(editing?.name ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdited = editing?.kind === "edited";
  // An edited timetable keeps at least the group it came from, merging needs two
  const minTimetables = isEdited ? 1 : 2;
  const lockedTimetable = isEdited
    ? timetablesToMerge.length === 1
      ? timetablesToMerge[0]
      : undefined
    : !editing && defaultTimetables.length === 1
      ? defaultTimetables[0]
      : undefined;
  const isSheet = useIsTablet();

  const navigate = useNavigate();

  function addTimetableToMerge(timetable: string) {
    if (timetablesToMerge.includes(timetable) || timetablesToMerge.length >= 5) return;
    setTimetablesToMerge([...timetablesToMerge, timetable]);
  }

  function onSaveClick() {
    const timetable = {
      name: name.trim() || timetablesToMerge.map(getTimetableName).join(" + ").slice(0, 60),
      sourceNames: timetablesToMerge,
    };
    const request = !editing
      ? TimetableManager.createMergedTimetable(timetable).then((group) => navigate(`/${group}`))
      : (isEdited
          ? updateEdited(editing, timetable)
          : FallbackData.updateMergedTimetable(editing.id, editing.editToken, timetable)
        ).then(onUpdated);
    Toast.promise(request, editing ? "Зберігаємо зміни" : Toast.PENDING_MERGED).catch((e) =>
      Toast.error(e, errorMessage(e))
    );
  }

  function deleteTimetable({ id, editToken }: Editing) {
    Toast.promise(TimetableManager.deleteCustomTimetable(id, editToken), "Видаляємо розклад")
      .then(() => navigate(`/${initialTimetables[0] ?? "home"}`, { replace: true }))
      .catch((e) => Toast.error(e, errorMessage(e)));
  }

  function onRemoveItem(timetable: string) {
    setTimetablesToMerge([...timetablesToMerge.filter((t) => t !== timetable)]);
  }

  const nameField = (
    <label className={styles.name}>
      <span className={styles.legend}>Назва</span>
      <input
        value={name}
        maxLength={60}
        placeholder={timetablesToMerge.map(getTimetableName).join(" + ") || "Необов'язково"}
        onChange={(event) => setName(event.target.value)}
      />
    </label>
  );

  return (
    <Drawer
      title={editing ? "Редагувати розклад" : "Оберіть групи для злиття"}
      titleActions={
        editing && (
          <button
            type="button"
            className={styles.delete}
            title="Видалити розклад"
            aria-label="Видалити розклад"
            onClick={() => setConfirmDelete(true)}
          >
            <TrashIcon />
          </button>
        )
      }
      onClose={onClose}
      className={styles.modal}
    >
      {editing && nameField}
      <div className={styles.sources}>
        <span className={styles.legend}>Групи</span>
        <SourcePicker
          value={timetablesToMerge}
          locked={lockedTimetable}
          autoFocus={!editing && !isSheet}
          onAdd={addTimetableToMerge}
          onRemove={onRemoveItem}
        />
        {timetablesToMerge.length < minTimetables && (
          <span className={styles.hint}>Додайте ще хоча б одну групу або викладача</span>
        )}
        {isEdited && <span className={styles.hint}>Пари цього розкладу можна змінити на комп'ютері</span>}
      </div>
      {!editing && nameField}
      <div className={styles.actions}>
        <CloseButton className={styles.cancel}>Скасувати</CloseButton>
        <CloseButton
          className={styles.button}
          disabled={timetablesToMerge.length < minTimetables}
          onClick={onSaveClick}
        >
          {editing ? "Зберегти" : "Створити"}
        </CloseButton>
      </div>
      {editing && confirmDelete && (
        <ConfirmDialog
          title="Видалити розклад?"
          text="Посилання на нього перестане працювати для всіх."
          confirmLabel="Видалити"
          danger
          onConfirm={() => deleteTimetable(editing)}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </Drawer>
  );
};

export default CreateMergedModal;
