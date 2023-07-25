import { FC } from 'react'
import TimetableLink from './ui/TimetableLink';
import { LVIV_TIMEZONE } from '@/utils/date';
import { classes } from '@/styles/utils';
import styles from './ExamsTimetable.module.scss';
import type { ExamsTimetableItem } from '@/types/timetable';

type OwnProps = {
  exams: ExamsTimetableItem[]
}

const ExamsTimetable: FC<OwnProps> = ({exams}) => {

  const compareDates = (a: ExamsTimetableItem, b: ExamsTimetableItem) => 
      a.date.getTime() - b.date.getTime();

  const isSameDay = (a: Date, b: Date) => 
      a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  return (
    <div className={styles.exams}>
      {exams?.sort(compareDates).map((exam, index) => (
        <div key={index} className={classes(styles.exam, isSameDay(exam.date, new Date()) && styles.active)}>
          <div className={styles.top}>
            <p>{exam.date.toLocaleString("uk-UA", {timeZone: LVIV_TIMEZONE, weekday: "long", day: "numeric", month: "long"})}</p>
            <p>{exam.number} пара</p>
          </div>
          <h3>{exam.subject}</h3>
          <div className={styles.bottom}>
            <p>{exam.lecturer.trim().replace(/,$/, '')}</p>
            <TimetableLink urls={exam.urls} type={'lab'} />
          </div>
        </div>
      ))}
    </div>
  )
};

export default ExamsTimetable;