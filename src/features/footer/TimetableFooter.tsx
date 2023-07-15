import { useParams } from 'react-router-dom';
import DownloadIcon from '@/assets/DownloadIcon';
import LoadingIcon from '@/assets/LoadingIcon';
import MergeIcon from '@/assets/MergeIcon';
import { classes } from '@/styles/utils';
import styles from './TimetableFooter.module.scss';
import { FC } from 'react';

type OwnProps = {
  loading: boolean;
  isExamsTimetable: boolean;
  isSecondSubgroup: boolean;
  showCreateMergedModal: () => void;
  updateTimetable: () => void;
  time?: number;
  icsFILE?: string;
}


const TimetableFooter: FC<OwnProps> = ({ 
  loading, isExamsTimetable, isSecondSubgroup, time, icsFILE,
  showCreateMergedModal, updateTimetable
}) => {
  const group = useParams().group?.trim() ?? "";

  return (
    <footer className={styles.bottom}>
      <span>
        <button 
          title='Об`єднати кілька розкладів в одну таблицю' 
          onClick={showCreateMergedModal} className={styles.merge}>
          <MergeIcon/>
        </button>
        <button 
          disabled={loading}
          className={classes(styles.update, loading && styles.loading)} title='Оновити дані' 
          onClick={() => updateTimetable()}
        >
          <LoadingIcon/>
        </button>
        <a className={styles.download} title='Експортувати розклад для Google Calendar' href={icsFILE} 
          download={isExamsTimetable ? `${group}-exams.ics` : `${group}-${isSecondSubgroup ? 2 : 1}.ics`}
        >
          <DownloadIcon/>
        </a> 
      </span>
      {time && <p>Last updated {new Date(time).toLocaleString()}</p>}
    </footer>
  )
}

export default TimetableFooter;