import { CloseButton } from "@headlessui/react";
import { type FC, Fragment, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ChevronDownIcon from "@/assets/ChevronDownIcon";
import DownloadIcon from "@/assets/DownloadIcon";
import HomeIcon from "@/assets/HomeIcon";
import InstallIcon from "@/assets/InstallIcon";
import MergeIcon from "@/assets/MergeIcon";
import MoonIcon from "@/assets/MoonIcon";
import MoreIcon from "@/assets/MoreIcon";
import PencilIcon from "@/assets/PencilIcon";
import RefreshIcon from "@/assets/RefreshIcon";
import ShareIcon from "@/assets/ShareIcon";
import SunIcon from "@/assets/SunIcon";
import { DisableCatModeButton, useCatMode } from "@/context/catMode";
import useGroupParam from "@/hooks/useGroupParam";
import { useIsTablet } from "@/hooks/useMediaQuery";
import usePwaInstall, { promptInstall } from "@/hooks/usePwaInstall";
import { useTheme } from "@/hooks/useTheme";
import { classes } from "@/styles/utils";
import type { CustomTimetable } from "@/types/timetable";
import { lazyPrefetched } from "@/utils/general";
import { getTimetableName } from "@/utils/timetable";
import SavedMenu from "../header/components/SavedMenu";
import ShareButton from "../header/components/ShareButton";
import styles from "./TimetableFooter.module.scss";

const DAY = 24 * 60 * 60 * 1000;

const Drawer = lazyPrefetched(() => import("@/shared/Drawer"));

type OwnProps = {
  loading: boolean;
  isExamsTimetable: boolean;
  isSecondSubgroup: boolean;
  showCreateMergedModal: () => void;
  updateTimetable: () => void;
  time?: number;
  icsFILE?: string;
  customTimetable?: CustomTimetable;
  onEdit?: () => void;
  editTitle: string;
  editToken?: string;
  onCalendarExport: () => void;
};

const TimetableFooter: FC<OwnProps> = ({
  loading,
  isExamsTimetable,
  isSecondSubgroup,
  time,
  icsFILE,
  customTimetable,
  onEdit,
  editTitle,
  editToken,
  onCalendarExport,
  showCreateMergedModal,
  updateTimetable,
}) => {
  const group = useGroupParam();
  const { toggleTheme } = useTheme();
  const isNarrow = useIsTablet();
  const isOwner = Boolean(editToken);
  const catMode = useCatMode();
  const install = usePwaInstall();
  const [showMore, setShowMore] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const [isOffScreen, setIsOffScreen] = useState(false);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer || isNarrow) return;
    const observer = new IntersectionObserver((entries) =>
      setIsOffScreen(entries.every((entry) => !entry.isIntersecting))
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [isNarrow]);

  const calendarFile = isExamsTimetable ? `${group}-exams.ics` : `${group}-${isSecondSubgroup ? 2 : 1}.ics`;
  const customTimetableUpdatedAt = customTimetable && new Date(customTimetable.updatedAt);
  const customTimetableUpdatedAtText = customTimetableUpdatedAt
    ? customTimetableUpdatedAt.toDateString() === new Date().toDateString()
      ? customTimetableUpdatedAt.toLocaleTimeString()
      : customTimetableUpdatedAt.toLocaleDateString()
    : "";

  // On phones only worth the space when the data couldn't be refreshed for a while
  const updatedText = time && (!isNarrow || Date.now() - time > DAY) && `Оновлено ${new Date(time).toLocaleString()}`;
  const sources = customTimetable?.sourceNames.map((source, i) => (
    <Fragment key={source}>
      {i > 0 && ", "}
      <Link to={`/${source}`} className="underline">
        {getTimetableName(source)}
      </Link>
    </Fragment>
  ));

  return (
    <footer ref={footerRef} className={styles.bottom}>
      {!isNarrow && isOffScreen && (
        <button
          type="button"
          className={styles.toFooter}
          aria-label="До кнопок унизу"
          onClick={() => footerRef.current?.scrollIntoView({ behavior: "smooth" })}
        >
          <ChevronDownIcon />
        </button>
      )}
      <span className={styles.container}>
        {!isNarrow && (
          <button
            data-tooltip="Змінити тему"
            className={classes(styles.theme, styles.button)}
            onClick={toggleTheme}
            type="button"
          >
            <MoonIcon className={classes(styles.themeIcon, styles.moonIcon)} />
            <SunIcon className={classes(styles.themeIcon, styles.sunIcon)} />
            <span className={styles.label}>Тема</span>
          </button>
        )}
        {isNarrow && (
          <Link state={{ force: true }} to="/home" className={styles.button}>
            <HomeIcon />
            <span className={styles.label}>Головна</span>
          </Link>
        )}
        {!isNarrow && <DisableCatModeButton />}
        {!isNarrow && (
          <button
            type="button"
            data-tooltip="Об`єднати кілька розкладів в одну таблицю"
            onClick={showCreateMergedModal}
            className={classes(styles.merge, styles.button)}
          >
            <MergeIcon />
            <span className={styles.label}>Об'єднати</span>
          </button>
        )}
        {!isNarrow && (
          <button
            type="button"
            disabled={loading}
            className={classes(styles.update, styles.button, loading && styles.pending)}
            data-tooltip="Оновити дані"
            onClick={() => {
              updateTimetable();
            }}
          >
            <RefreshIcon isPending={loading} />
            <span className={styles.label}>Оновити</span>
          </button>
        )}
        {!isNarrow && (
          <a
            className={classes(styles.download, styles.button)}
            data-tooltip="Експортувати розклад для Google Calendar"
            href={icsFILE}
            download={calendarFile}
            onClick={onCalendarExport}
          >
            <DownloadIcon />
            <span className={styles.label}>Календар</span>
          </a>
        )}
        {onEdit && (
          <button type="button" className={styles.button} data-tooltip={editTitle} onClick={onEdit}>
            <PencilIcon />
            <span className={styles.label}>Змінити</span>
          </button>
        )}
        {!isNarrow && install === "prompt" && (
          <button type="button" className={styles.button} data-tooltip="Встановити застосунок" onClick={promptInstall}>
            <InstallIcon />
            <span className={styles.label}>Встановити</span>
          </button>
        )}
        {isNarrow && (
          <>
            <ShareButton
              editToken={editToken}
              className={styles.button}
              label={<span className={styles.label}>Поділитися</span>}
            />
            <button type="button" className={styles.button} onClick={() => setShowMore(true)}>
              <MoreIcon />
              <span className={styles.label}>Ще</span>
            </button>
            <SavedMenu
              timetableChanged={loading}
              sheetButton={{ className: styles.button, label: <span className={styles.label}>Збережені</span> }}
            />
          </>
        )}
      </span>
      {showMore && (
        <Suspense fallback={null}>
          <Drawer onClose={() => setShowMore(false)}>
            {customTimetable ? (
              <div className={styles.about}>
                <p>
                  {isOwner ? "Ваш розклад" : "Розклад"} з {sources}
                </p>
                <p className={styles.hint}>
                  {customTimetable.kind === "merged"
                    ? "Оновлюється автоматично"
                    : `Змінено вручну ${customTimetableUpdatedAtText}`}
                </p>
                {isOwner && (
                  <p className={styles.hint}>
                    Посилання для редагування — у «<ShareIcon />»
                  </p>
                )}
              </div>
            ) : (
              updatedText && <p className={classes(styles.about, styles.hint)}>{updatedText}</p>
            )}
            <ul className={styles.more}>
              <li>
                <button type="button" disabled={loading} onClick={() => updateTimetable()}>
                  <RefreshIcon isPending={loading} />
                  Оновити розклад
                </button>
              </li>
              <li>
                <CloseButton onClick={showCreateMergedModal}>
                  <MergeIcon />
                  Об'єднати з іншим розкладом
                </CloseButton>
              </li>
              <li>
                <CloseButton as="a" href={icsFILE} download={calendarFile} onClick={onCalendarExport}>
                  <DownloadIcon />
                  Додати в календар
                </CloseButton>
              </li>
              {install === "prompt" && (
                <li>
                  <CloseButton onClick={promptInstall}>
                    <InstallIcon />
                    Встановити застосунок
                  </CloseButton>
                </li>
              )}
              {install === "ios" && (
                <li className={styles.installHint}>
                  <InstallIcon />
                  Щоб встановити застосунок, у меню «Поділитися» виберіть «На екран „Додому“»
                </li>
              )}
              {catMode.enabled && (
                <li>
                  <CloseButton onClick={catMode.disable}>
                    <span className={styles.catIcon} aria-hidden="true" />
                    Вимкнути котячий режим
                  </CloseButton>
                </li>
              )}
            </ul>
          </Drawer>
        </Suspense>
      )}
      {isNarrow ? null : customTimetable ? (
        <p>
          {isOwner && (
            <span
              className={classes("underline decoration-dotted", styles.ownerHint)}
              data-tooltip="Посилання для редагування — у"
            >
              Ваш
            </span>
          )}
          {isOwner ? " розклад з " : "Розклад з "}
          {sources} ·{" "}
          {customTimetable.kind === "merged" ? (
            "оновлюється автоматично"
          ) : (
            <span data-tooltip={`Востаннє ${customTimetableUpdatedAtText}`}>змінено вручну</span>
          )}
        </p>
      ) : (
        updatedText && <p>{updatedText}</p>
      )}
    </footer>
  );
};

export default TimetableFooter;
