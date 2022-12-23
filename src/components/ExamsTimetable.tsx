import { FC } from 'react'
import { ExamsTimetableItem } from '../utils/types'

type OwnProps = {
  exams: ExamsTimetableItem[]
}

const ExamsTimetable: FC<OwnProps> = ({exams}) => {

  const compareDates = (a: ExamsTimetableItem, b: ExamsTimetableItem) => 
      a.date.getTime() - b.date.getTime();

  const isSameDay = (a: Date, b: Date) => 
      a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  return (
    <>
      {exams.sort(compareDates).map((exam, index) => (
        <div key={index} className={isSameDay(exam.date, new Date()) ? "active" : ""}>
          <h3>{exam.subject}</h3>
          <p>{exam.lecturer}</p>
          <p>{exam.date.toLocaleString()}</p>
        </div>
      ))}
    </>
  )
};

export default ExamsTimetable;