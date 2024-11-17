import useInputFocus from "@/hooks/useFocus";
import useOnClickOutside from "@/hooks/useOnOutsideClick";
import VirtualizedDataList from "@/shared/VirtualizedDataList";
import type { TimetableItem } from "@/types/timetable";
import type { RenderPromises } from "@/types/utils";
import TimetableManager from "@/utils/data/TimetableManager";
import { getAllTimetables, isMerged } from "@/utils/timetable";
import Toast from "@/utils/toasts";
import { type FC, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CreateMergedModal.module.scss";

const getSearchBarOptions = () => {
  return getAllTimetables().map((group) => ({ id: group, value: group }));
};

function getSavedTimetables() {
  return TimetableManager.getCachedTimetables()
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
      ({ value }) => !timetablesToMerge.includes(value) && !savedTimetables.includes(value)
    );
    timetables.unshift(
      ...savedTimetables
        .filter((group) => !timetablesToMerge.includes(group))
        .map((group) => ({ id: group, value: group }))
    );
    return timetables;
  }, [timetablesToMerge]);

  const ref = useOnClickOutside<HTMLDivElement>(onClose);
  const {
    ref: datalistRef,
    focus,
    isFocused,
  } = useInputFocus<HTMLDivElement>({
    initFocus: true,
  });
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
    <div className={styles.wrapper}>
      <div className={styles.modal} ref={ref}>
        <div className={styles.header}>
          <h2 className={styles.title}>Оберіть групи для злиття</h2>
        </div>
        <fieldset
          className={styles.fieldset}
          onClick={() => {
            focus();
          }}
        >
          <legend className={styles.legend}>Пошук</legend>
          <div className={styles.choice}>
            <span className={styles.selected}>
              {timetablesToMerge.map((timetable) => (
                <span
                  key={timetable}
                  onClick={() => {
                    onRemoveItem(timetable);
                  }}
                  className={styles.selectedItem}
                  data-content={timetable}
                />
              ))}
            </span>
            {timetablesToMerge.length < 5 && (
              <VirtualizedDataList
                autoFocus
                clearOnSelect
                containerRef={datalistRef}
                className={styles["search-bar"]}
                onSelect={(item) => {
                  addTimetableToMerge(item.value);
                }}
                options={options}
                ignoreSpecialCharacters
                isExpanded={isFocused}
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
