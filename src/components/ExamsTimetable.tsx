import { FC } from 'react'
import { ExamsTimetableItem } from '../utils/types';
import styles from './ExamsTimetable.module.scss';

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
        <div key={index} className={`${isSameDay(exam.date, new Date()) && styles.active}`}>
          <div>
            <p>{exam.date.toLocaleString("uk-UA", {weekday: "long", day: "numeric", month: "long"})}</p>
            <p>{exam.number} пара</p>
          </div>
          <h3>{exam.subject}</h3>
          <div>
            <p>{exam.lecturer}</p>
            {exam.urls[0] ?
              <a href={exam.urls[0]} target="_blank" rel="noreferrer">Посилання</a>
            : null}
          </div>
        </div>
      ))}
    </div>
  )
};

export default ExamsTimetable;