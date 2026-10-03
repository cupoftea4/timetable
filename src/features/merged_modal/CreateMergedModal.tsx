import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import SourcePicker from "@/shared/SourcePicker";
import type { CustomTimetable } from "@/types/timetable";
import FallbackData from "@/utils/data/CachedData";
import TimetableManager from "@/utils/data/TimetableManager";
import { getTimetableName, isMerged } from "@/utils/timetable";
import Toast, { errorMessage } from "@/utils/toasts";
import styles from "./CreateMergedModal.module.scss";

type OwnProps = {
  defaultTimetables: string[];
  editing?: CustomTimetable & { editToken: string };
  onClose: () => void;
  onUpdated: () => void;
};

const CreateMergedModal: FC<OwnProps> = ({ defaultTimetables, editing, onClose, onUpdated }) => {
  const initialTimetables = defaultTimetables.filter((t) => !isMerged(t));
  const [timetablesToMerge, setTimetablesToMerge] = useState(initialTimetables);
  const [name, setName] = useState(editing?.name ?? "");
  const lockedTimetable = !editing && defaultTimetables.length === 1 ? defaultTimetables[0] : undefined;
  const isUntouched = timetablesToMerge.join() === initialTimetables.join() && name === (editing?.name ?? "");

  const navigate = useNavigate();

  function addTimetableToMerge(timetable: string) {
    if (timetablesToMerge.includes(timetable) || timetablesToMerge.length >= 5) return;
    setTimetablesToMerge([...timetablesToMerge, timetable]);
  }

  function onCreateClick() {
    if (timetablesToMerge.length < 2 || timetablesToMerge.length > 5) {
      Toast.warn("Виберіть від 2 до 5 груп");
      return;
    }
    const timetable = {
      name: name.trim() || timetablesToMerge.map(getTimetableName).join(" + ").slice(0, 60),
      sourceNames: timetablesToMerge,
    };
    onClose();
    const request = editing
      ? FallbackData.updateMergedTimetable(editing.id, editing.editToken, timetable).then(onUpdated)
      : TimetableManager.createMergedTimetable(timetable).then((group) => navigate(`/${group}`));
    Toast.promise(request, Toast.PENDING_MERGED).catch((e) => Toast.error(e, errorMessage(e)));
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
    <div
      className={styles.wrapper}
      role="dialog"
      aria-modal="true"
      aria-labelledby="merge-title"
      onKeyDownCapture={(event) => {
        if (event.key === "Escape" && isUntouched) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="merge-title" className={styles.title}>
            {editing ? "Редагувати розклад" : "Оберіть групи для злиття"}
          </h2>
          <button className={styles.close} type="button" onClick={onClose} aria-label="Закрити" />
        </div>
        {editing && nameField}
        <div className={styles.sources}>
          <span className={styles.legend}>Групи</span>
          <SourcePicker
            value={timetablesToMerge}
            locked={lockedTimetable}
            autoFocus={!editing}
            onAdd={addTimetableToMerge}
            onRemove={onRemoveItem}
          />
        </div>
        {!editing && nameField}
        <div className={styles.actions}>
          <button className={styles.button} onClick={onCreateClick} type="button">
            {editing ? "Зберегти" : "Створити"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMergedModal;
