import { CloseButton, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { type FC, Fragment, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CheckMarkIcon from "@/assets/CheckMarkIcon";
import HistoryIcon from "@/assets/HistoryIcon";
import RemoveIcon from "@/assets/RemoveIcon";
import { classes } from "@/styles/utils";
import TimetableManager from "@/utils/data/TimetableManager";
import { getTimetableName, isMerged } from "@/utils/timetable";
import Toast from "@/utils/toasts";
import styles from "./SavedMenu.module.scss";

const MAX_SAVED_ITEMS = 5;

type OwnProps = {
  timetableChanged?: boolean;
};

function getCachedGroups(): string[] {
  const cachedGroups = TimetableManager.cachedTimetables;
  const groups = cachedGroups.slice(Math.max(cachedGroups.length - MAX_SAVED_ITEMS, 0)).map((item) => item.group);
  const merged = TimetableManager.cachedMergedTimetable;
  if (merged) groups.push("my");
  return groups.reverse();
}

const SavedMenu: FC<OwnProps> = ({ timetableChanged }) => {
  const groupParam = useParams().group?.trim();
  const [savedGroups, setSavedGroups] = useState<string[]>(getCachedGroups);
  // Hover's programmatic click can trigger :focus-visible; keep the outline for keyboard focus only.
  const [pointerFocus, setPointerFocus] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: route and load changes refresh the external cache
  useEffect(() => {
    setSavedGroups(getCachedGroups());
  }, [groupParam, timetableChanged]);

  const deleteItem = (index: number) => {
    const group = savedGroups[index];
    if (!group) return;
    TimetableManager.deleteTimetable(group)
      .then(() => {
        setSavedGroups(getCachedGroups());
      })
      .catch((e) => {
        Toast.error(e, Toast.DELETE_TIMETABLE_ERROR);
      });
  };

  return (
    <Popover as={Fragment}>
      {({ open, close }) => (
        <nav
          className={styles.saved}
          aria-label="Saved groups"
          onKeyDownCapture={() => setPointerFocus(false)}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") {
              setPointerFocus(true);
              close();
            }
          }}
        >
          <PopoverButton
            className={classes("icon-button", "transition duration-300", pointerFocus && styles.pointerFocus)}
            aria-label="Saved groups menu"
            onBlur={() => setPointerFocus(false)}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse" && !open) {
                setPointerFocus(true);
                event.currentTarget.click();
              }
            }}
          >
            <HistoryIcon />
          </PopoverButton>
          <PopoverPanel anchor={{ to: "bottom", padding: 16 }} className={styles["saved-menu-wrapper"]}>
            <div className={styles["saved-menu"]}>
              <span className={styles.title}>
                {savedGroups.length !== 0
                  ? "Збережені"
                  : "Немає збережених. Відкрийте будь-який розклад, щоб автоматично зберегти."}
              </span>
              <ul>
                {savedGroups.map((group, index) => (
                  <li key={group}>
                    <CloseButton as={Link} to={`/${group}`} state={{ source: "saved" }} className={styles["list-item"]}>
                      <span
                        className={styles.name}
                        title={isMerged(group) ? TimetableManager.cachedMergedTimetable?.timetables?.join("+") : group}
                      >
                        {getTimetableName(group)}
                        {groupParam === group ? <CheckMarkIcon className={styles["check-mark"]} /> : null}
                      </span>
                    </CloseButton>
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`Видалити ${getTimetableName(group)}`}
                      title={`Видалити ${getTimetableName(group)}`}
                      onClick={() => deleteItem(index)}
                    >
                      <RemoveIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </PopoverPanel>
        </nav>
      )}
    </Popover>
  );
};

export default SavedMenu;
