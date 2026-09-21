import { type FC, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import VirtualizedDataList from "@/shared/VirtualizedDataList";
import type { TimetableItem } from "@/types/timetable";
import type { RenderPromises } from "@/types/utils";
import TimetableManager from "@/utils/data/TimetableManager";
import { getAllTimetables, getTimetableName, isMerged } from "@/utils/timetable";
import Toast from "@/utils/toasts";
import styles from "./CreateMergedModal.module.scss";

const getSearchBarOptions = () => {
  return getAllTimetables().map((group) => ({ id: group, value: getTimetableName(group) }));
};

function getSavedTimetables() {
  return TimetableManager.cachedTimetables
    .filter((group) => !isMerged(group.group))
    .map((timetable) => timetable.group);
}

type OwnProps = {
  defaultTimetable?: string;
  onClose: () => void;
  showTimetable: (promises: RenderPromises<TimetableItem[]>) => void;
};

const CreateMergedModal: FC<OwnProps> = ({ defaultTimetable, onClose, showTimetable }) => {
  const [timetablesToMerge, setTimetablesToMerge] = useState<string[]>(
    defaultTimetable && !isMerged(defaultTimetable) ? [defaultTimetable] : []
  );

  const options = useMemo(() => {
    const savedTimetables = getSavedTimetables();
    const timetables = getSearchBarOptions().filter(
      ({ id }) => !timetablesToMerge.includes(id) && !savedTimetables.includes(id)
    );
    timetables.unshift(
      ...savedTimetables
        .filter((group) => !timetablesToMerge.includes(group))
        .map((group) => ({ id: group, value: getTimetableName(group) }))
    );
    return timetables;
  }, [timetablesToMerge]);

  const navigate = useNavigate();

  function addTimetableToMerge(timetable: string) {
    if (timetablesToMerge.includes(timetable) || timetablesToMerge.length >= 4) return;
    setTimetablesToMerge([...timetablesToMerge, timetable]);
  }

  function onCreateClick() {
    if (timetablesToMerge.length < 2 || timetablesToMerge.length > 5) {
      Toast.warn("Виберіть від 2 до 5 груп");
      return;
    }
    onClose();
    const promises = TimetableManager.getMergedTimetable(timetablesToMerge);
    if (location.pathname.includes("/my")) showTimetable(promises);
    Toast.promise(
      Promise.all(promises).finally(() => {
        navigate("/my");
      }),
      Toast.PENDING_MERGED
    );
  }

  function onRemoveItem(timetable: string) {
    setTimetablesToMerge([...timetablesToMerge.filter((t) => t !== timetable)]);
  }

  return (
    <div
      className={styles.wrapper}
      role="dialog"
      aria-modal="true"
      aria-labelledby="merge-title"
      onKeyDownCapture={(event) => {
        if (event.key === "Escape" && timetablesToMerge.every((timetable) => timetable === defaultTimetable)) {
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
            Оберіть групи для злиття
          </h2>
          <button className={styles.close} type="button" onClick={onClose} aria-label="Закрити" />
        </div>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Пошук</legend>
          <div className={styles.choice}>
            <span className={styles.selected}>
              {timetablesToMerge.map((timetable, index) => (
                <button
                  key={timetable}
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    onRemoveItem(timetable);
                  }}
                  className={styles.selectedItem}
                  data-content={getTimetableName(timetable)}
                  aria-label={
                    index === 0
                      ? `Основна група ${getTimetableName(timetable)}`
                      : `Видалити ${getTimetableName(timetable)}`
                  }
                />
              ))}
            </span>
            {timetablesToMerge.length < 5 && (
              <VirtualizedDataList
                autoFocus
                clearOnSelect
                label="Додати групу"
                placeholder="Назва групи..."
                className={styles["search-bar"]}
                optionsClassName={styles.options}
                onSelect={(item) => {
                  addTimetableToMerge(item.id);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Backspace" || event.currentTarget.value) return;
                  setTimetablesToMerge((timetables) => (timetables.length > 1 ? timetables.slice(0, -1) : timetables));
                }}
                options={options}
                ignoreSpecialCharacters
              />
            )}
          </div>
        </fieldset>
        <button className={styles.button} onClick={onCreateClick} type="button">
          Створити
        </button>
      </div>
    </div>
  );
};

export default CreateMergedModal;
