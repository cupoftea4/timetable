import { type FC } from 'react';
import { useParams } from 'react-router-dom';
import DownloadIcon from '@/assets/DownloadIcon';
import LoadingIcon from '@/assets/LoadingIcon';
import MergeIcon from '@/assets/MergeIcon';
import { classes } from '@/styles/utils';
import styles from './TimetableFooter.module.scss';

type OwnProps = {
  loading: boolean
  isExamsTimetable: boolean
  isSecondSubgroup: boolean
  showCreateMergedModal: () => void
  updateTimetable: () => void
  time?: number
  icsFILE?: string
};

const TimetableFooter: FC<OwnProps> = ({
  loading, isExamsTimetable, isSecondSubgroup, time, icsFILE,
  showCreateMergedModal, updateTimetable
}) => {
  const group = useParams().group?.trim() ?? '';

  return (
    <footer className={styles.bottom}>
      <span className={styles.container}>
        <button
          title='Об`єднати кілька розкладів в одну таблицю'
          onClick={showCreateMergedModal} className={classes(styles.merge, styles.button)}>
          <MergeIcon/>
        </button>
        <button
          disabled={loading}
          className={classes(styles.update, loading && styles.loading, styles.button)} title='Оновити дані'
          onClick={() => { updateTimetable(); }}
        >
          <LoadingIcon/>
        </button>
        <a className={classes(styles.download, styles.button)}
          title='Експортувати розклад для Google Calendar' href={icsFILE}
          download={isExamsTimetable ? `${group}-exams.ics` : `${group}-${isSecondSubgroup ? 2 : 1}.ics`}
        >
          <DownloadIcon/>
        </a>
      </span>
      {time && <p>Last updated {new Date(time).toLocaleString()}</p>}
    </footer>
  );
};

export default TimetableFooter;
