import { type FC, Fragment } from "react";
import { Link } from "react-router-dom";
import DownloadIcon from "@/assets/DownloadIcon";
import MergeIcon from "@/assets/MergeIcon";
import MoonIcon from "@/assets/MoonIcon";
import PencilIcon from "@/assets/PencilIcon";
import RefreshIcon from "@/assets/RefreshIcon";
import SunIcon from "@/assets/SunIcon";
import { DisableCatModeButton } from "@/context/catMode";
import useGroupParam from "@/hooks/useGroupParam";
import { useTheme } from "@/hooks/useTheme";
import { classes } from "@/styles/utils";
import type { CustomTimetable } from "@/types/timetable";
import styles from "./TimetableFooter.module.scss";

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
  showCreateMergedModal,
  updateTimetable,
}) => {
  const group = useGroupParam();
  const { toggleTheme } = useTheme();

  return (
    <footer className={styles.bottom}>
      <span className={styles.container}>
        <button
          title="Змінити тему"
          className={classes(styles.theme, styles.button)}
          onClick={toggleTheme}
          aria-label="Змінити тему"
          type="button"
        >
          <MoonIcon className={classes(styles.themeIcon, styles.moonIcon)} />
          <SunIcon className={classes(styles.themeIcon, styles.sunIcon)} />
        </button>
        <DisableCatModeButton />
        <button
          type="button"
          aria-label="Об`єднати кілька розкладів в одну таблицю"
          title="Об`єднати кілька розкладів в одну таблицю"
          onClick={showCreateMergedModal}
          className={classes(styles.merge, styles.button)}
        >
          <MergeIcon />
        </button>
        <button
          type="button"
          disabled={loading}
          className={classes(styles.update, styles.button, loading && styles.pending)}
          title="Оновити дані"
          aria-label="Оновити дані"
          onClick={() => {
            updateTimetable();
          }}
        >
          <RefreshIcon isPending={loading} />
        </button>
        <a
          className={classes(styles.download, styles.button)}
          title="Експортувати розклад для Google Calendar"
          href={icsFILE}
          download={isExamsTimetable ? `${group}-exams.ics` : `${group}-${isSecondSubgroup ? 2 : 1}.ics`}
          aria-label="Експортувати розклад для Google Calendar"
        >
          <DownloadIcon />
        </a>
        {onEdit && (
          <button type="button" className={styles.button} title={editTitle} aria-label={editTitle} onClick={onEdit}>
            <PencilIcon />
          </button>
        )}
      </span>
      {customTimetable ? (
        <p>
          Змінений розклад на основі{" "}
          {customTimetable.sourceNames.map((source, i) => (
            <Fragment key={source}>
              {i > 0 && ", "}
              <Link to={`/${source}`} className="underline">
                {source}
              </Link>
            </Fragment>
          ))}{" "}
          · оновлено {new Date(customTimetable.updatedAt).toLocaleDateString("uk-UA")}
        </p>
      ) : (
        time && <p>Last updated {new Date(time).toLocaleString()}</p>
      )}
    </footer>
  );
};

export default TimetableFooter;
