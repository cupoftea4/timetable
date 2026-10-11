import { CloseButton, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { type FC, Fragment, type ReactNode, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HistoryIcon from "@/assets/HistoryIcon";
import RemoveIcon from "@/assets/RemoveIcon";
import useGroupParam from "@/hooks/useGroupParam";
import { useIsTablet } from "@/hooks/useMediaQuery";
import { classes } from "@/styles/utils";
import TimetableManager from "@/utils/data/TimetableManager";
import { lazyPrefetched } from "@/utils/general";
import { getTimetableName, isMerged } from "@/utils/timetable";
import Toast from "@/utils/toasts";
import styles from "./SavedMenu.module.scss";

const MAX_SAVED_ITEMS = 5;

const Drawer = lazyPrefetched(() => import("@/shared/Drawer"));

type OwnProps = {
  timetableChanged?: boolean;
  /** Styles the button that opens the sheet on narrow screens, with a label under the icon */
  sheetButton?: { className?: string; label: ReactNode };
};

function getCachedGroups(): string[] {
  const cachedGroups = TimetableManager.cachedTimetables;
  const groups = cachedGroups.slice(Math.max(cachedGroups.length - MAX_SAVED_ITEMS, 0)).map((item) => item.group);
  const merged = TimetableManager.cachedMergedTimetable;
  if (merged) groups.push("my");
  return groups.reverse();
}

const SavedMenu: FC<OwnProps> = ({ timetableChanged, sheetButton }) => {
  const groupParam = useGroupParam();
  const [savedGroups, setSavedGroups] = useState<string[]>(getCachedGroups);
  // Hover's programmatic click can trigger :focus-visible; keep the outline for keyboard focus only.
  const [pointerFocus, setPointerFocus] = useState(false);
  const isSheet = useIsTablet();
  const [showSheet, setShowSheet] = useState(false);

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

  const list = (
    <ul className={classes(styles.list, isSheet && styles.sheetList)}>
      {savedGroups.map((group, index) => (
        <li key={group} className={classes(groupParam === group && styles.active)}>
          <CloseButton as={Link} to={`/${group}`} state={{ source: "saved" }} className={styles["list-item"]}>
            <span
              className={styles.name}
              title={
                isMerged(group)
                  ? TimetableManager.cachedMergedTimetable?.timetables?.join("+")
                  : getTimetableName(group)
              }
            >
              {getTimetableName(group)}
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
  );

  if (isSheet) {
    return (
      <>
        <button
          type="button"
          className={sheetButton?.className ?? classes("icon-button", "transition duration-300")}
          aria-label={sheetButton ? undefined : "Saved groups menu"}
          onClick={() => setShowSheet(true)}
        >
          <HistoryIcon />
          {sheetButton?.label}
        </button>
        {showSheet && (
          <Suspense fallback={null}>
            <Drawer title="Збережені" onClose={() => setShowSheet(false)}>
              {savedGroups.length === 0 && (
                <p className={styles.empty}>Немає збережених. Відкрийте будь-який розклад, щоб автоматично зберегти.</p>
              )}
              {list}
            </Drawer>
          </Suspense>
        )}
      </>
    );
  }

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
              {list}
            </div>
          </PopoverPanel>
        </nav>
      )}
    </Popover>
  );
};

export default SavedMenu;
