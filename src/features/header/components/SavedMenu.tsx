import CheckMarkIcon from "@/assets/CheckMarkIcon";
import HistoryIcon from "@/assets/HistoryIcon";
import RemoveIcon from "@/assets/RemoveIcon";
import { classes } from "@/styles/utils";
import TimetableManager from "@/utils/data/TimetableManager";
import { getTimetableName, isMerged } from "@/utils/timetable";
import Toast from "@/utils/toasts";
import { type FC, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styles from "./SavedMenu.module.scss";

const MAX_SAVED_ITEMS = 5;

type OwnProps = {
  timetableChanged?: boolean;
};

const SavedMenu: FC<OwnProps> = ({ timetableChanged }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const groupParam = useParams().group?.trim();
  const [savedGroups, setSavedGroups] = useState<string[]>(getCachedGroups);
  const [selectedItem, setSelectedItem] = useState(0);
  const navigate = useNavigate();

  function getCachedGroups(): string[] {
    const cachedGroups = TimetableManager.getCachedTimetables();
    const groups = cachedGroups.slice(Math.max(cachedGroups.length - MAX_SAVED_ITEMS, 0)).map((item) => item.group);
    const merged = TimetableManager.cachedMergedTimetable;
    if (merged) groups.push("my");
    return groups.reverse();
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: I don't actually remember why but I don't want to break it
  useEffect(() => {
    setSavedGroups(getCachedGroups());
  }, [groupParam, timetableChanged]);

  const openMenu = () => {
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const deleteItem = (index: number) => {
    if (!savedGroups[index]) return;
    // biome-ignore lint/style/noNonNullAssertion: ideally, this should be fixed
    TimetableManager.deleteTimetable(savedGroups[index]!)
      .then(() => {
        setSavedGroups(getCachedGroups());
      })
      .catch((e) => {
        Toast.error(e, Toast.DELETE_TIMETABLE_ERROR);
      });
  };

  const arrowNavigation = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedItem((selectedItem + 1) % savedGroups.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedItem((selectedItem - 1) % savedGroups.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (savedGroups[selectedItem]) {
        // biome-ignore lint/style/noNonNullAssertion: ideally, this should be fixed
        navigate(`/${savedGroups[selectedItem]!}`, { state: { source: "saved-enter" } });
      }
    } else if (e.key === "Escape") {
      closeMenu();
    }
  };

  return (
    <button
      className={styles.saved}
      tabIndex={0}
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocusCapture={openMenu}
      onKeyDown={arrowNavigation}
      aria-expanded={isMenuOpen ? "true" : "false"}
      aria-controls="saved-menu"
      aria-label="Saved groups menu"
      type="button"
    >
      <HistoryIcon />
      {isMenuOpen && (
        <div
          className={classes(styles["saved-menu"], groupParam && styles.home)}
          id="saved-menu"
          aria-hidden={!isMenuOpen ? "true" : "false"}
        >
          <span className={styles.title}>
            {savedGroups.length !== 0
              ? "Збережені"
              : "Немає збережених. Відкрийте будь-який розклад, щоб автоматично зберегти."}
          </span>
          <ul>
            {savedGroups.map((group, index) => (
              <li key={index} className={selectedItem === index ? styles.selected : ""}>
                <Link
                  to={`/${group}`}
                  state={{ source: "saved" }}
                  className={styles["list-item"]}
                  onFocus={() => {
                    setSelectedItem(index);
                  }}
                  onClick={() => {
                    closeMenu();
                  }}
                >
                  <span
                    className={styles.name}
                    title={isMerged(group) ? TimetableManager.cachedMergedTimetable?.timetables?.join("+") : group}
                  >
                    {getTimetableName(group)}
                    {groupParam === group ? <CheckMarkIcon className={styles["check-mark"]} /> : null}
                  </span>
                </Link>
                <RemoveIcon
                  onClick={() => {
                    deleteItem(index);
                  }}
                  className={styles.remove}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </button>
  );
};

export default SavedMenu;
