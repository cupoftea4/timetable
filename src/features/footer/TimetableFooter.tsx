import { type FC, Fragment } from "react";
import { Link } from "react-router-dom";
import DownloadIcon from "@/assets/DownloadIcon";
import FileDownIcon from "@/assets/FileDownIcon";
import MergeIcon from "@/assets/MergeIcon";
import MoonIcon from "@/assets/MoonIcon";
import RefreshIcon from "@/assets/RefreshIcon";
import SunIcon from "@/assets/SunIcon";
import { DisableCatModeButton } from "@/context/catMode";
import useGroupParam from "@/hooks/useGroupParam";
import { useTheme } from "@/hooks/useTheme";
import { classes } from "@/styles/utils";
import type { CustomTimetable } from "@/types/timetable";
import { downloadJSON5 } from "@/utils/customTimetable";
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
};

const TimetableFooter: FC<OwnProps> = ({
  loading,
  isExamsTimetable,
  isSecondSubgroup,
  time,
  icsFILE,
  customTimetable,
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
        {customTimetable && (
          <button
            type="button"
            className={styles.button}
            title="Експортувати розклад у JSON5 для редагування"
            aria-label="Експортувати розклад у JSON5 для редагування"
            onClick={() => downloadJSON5(customTimetable)}
          >
            <FileDownIcon />
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
