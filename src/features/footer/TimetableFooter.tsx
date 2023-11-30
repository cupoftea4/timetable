import { useState, type FC, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DownloadIcon from '@/assets/DownloadIcon';
import LoadingIcon from '@/assets/LoadingIcon';
import MergeIcon from '@/assets/MergeIcon';
import { classes } from '@/styles/utils';
import styles from './TimetableFooter.module.scss';
import { isDarkMode } from '@/utils/general';
import SunIcon from '@/assets/SunIcon';
import MoonIcon from '@/assets/MoonIcon';

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

  const [isDarkTheme, setIsDarkTheme] = useState(isDarkMode());

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkTheme]);

  addEventListener('storage', (event) => {
    if (event.key === 'color-mode') {
      setIsDarkTheme(event.newValue === 'dark');
    }
  });

  function setThemePreference(mode: string) {
    window.localStorage.setItem('color-mode', mode);
    setIsDarkTheme(mode === 'dark');
  }

  return (
    <footer className={styles.bottom}>
      <span className={styles.container}>
        <button
          title='Змінити тему'
          className={classes(styles.theme, styles.button)}
          onClick={() => { setThemePreference(isDarkTheme ? 'light' : 'dark'); }}
        >
          {isDarkTheme ? <MoonIcon /> : <SunIcon />}
        </button>
        <button
          title='Об`єднати кілька розкладів в одну таблицю'
          onClick={showCreateMergedModal} className={classes(styles.merge, styles.button)}
        >
          <MergeIcon />
        </button>
        <button
          disabled={loading}
          title='Оновити дані'
          className={classes(styles.update, loading && styles.loading, styles.button)}
          onClick={() => { updateTimetable(); }}
        >
          <LoadingIcon />
        </button>
        <a className={classes(styles.download, styles.button)}
          title='Експортувати розклад для Google Calendar' href={icsFILE}
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
