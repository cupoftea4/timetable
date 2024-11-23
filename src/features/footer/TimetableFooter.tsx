import DownloadIcon from "@/assets/DownloadIcon";
import MergeIcon from "@/assets/MergeIcon";
import RefreshIcon from "@/assets/RefreshIcon";
import { classes } from "@/styles/utils";
import type { FC } from "react";
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

  return (
    <footer className={styles.bottom}>
      <span className={styles.container}>
        <button
          type="button"
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
