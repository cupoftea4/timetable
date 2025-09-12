import DownloadIcon from "@/assets/DownloadIcon";
import MergeIcon from "@/assets/MergeIcon";
import MoonIcon from "@/assets/MoonIcon";
import RefreshIcon from "@/assets/RefreshIcon";
import SunIcon from "@/assets/SunIcon";
import { classes } from "@/styles/utils";
import { isDarkMode } from "@/utils/general";
import { type FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./TimetableFooter.module.scss";

type OwnProps = {
  loading: boolean;
  isExamsTimetable: boolean;
  isSecondSubgroup: boolean;
  showCreateMergedModal: () => void;
  updateTimetable: () => void;
  time?: number;
  icsFILE?: string;
};

const TimetableFooter: FC<OwnProps> = ({
  loading,
  isExamsTimetable,
  isSecondSubgroup,
  time,
  icsFILE,
  showCreateMergedModal,
  updateTimetable,
}) => {
  const group = useParams().group?.trim() ?? "";

  const [isDarkTheme, setIsDarkTheme] = useState(isDarkMode());

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  }, [isDarkTheme]);

  addEventListener("storage", (event) => {
    if (event.key === "color-mode") {
      setIsDarkTheme(event.newValue === "dark");
    }
  });

  function setThemePreference(mode: string) {
    window.localStorage.setItem("color-mode", mode);
    setIsDarkTheme(mode === "dark");
  }

  return (
    <footer className={styles.bottom}>
      <span className={styles.container}>
        <button
          title="Змінити тему"
          className={classes(styles.theme, styles.button)}
          onClick={() => {
            setThemePreference(isDarkTheme ? "light" : "dark");
          }}
        >
          {isDarkTheme ? <MoonIcon /> : <SunIcon />}
        </button>
        <button
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
        >
          <DownloadIcon />
        </a>
      </span>
      {time && <p>Last updated {new Date(time).toLocaleString()}</p>}
    </footer>
  );
};

export default TimetableFooter;
