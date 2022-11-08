import { memo, useMemo } from 'react';
import { TimetableItem } from '../utils/types';
import TimetableCell from './TimetableCell';
import styles from './Timetable.module.scss';

const LESSON_HOURS = 1;
const LESSON_MINUTES = 35;
const MINUTES_IN_HOUR = 60;

const Timetable = ({timetable}: {timetable: TimetableItem[]}) => {
  const maxLessonNumber = useMemo(() => 
    timetable?.reduce((max, item) => item.number > max ? item.number : max, 0) || 0, 
  [timetable]);
  const maxDayNumber = useMemo(() =>
    timetable?.reduce((max, item) => item.day > max ? item.day : max, 0) || 0,
  [timetable]);

  const lessonsTimes = useMemo(() => 
    ["8:30", "10:20", "12:10", "14:15", "16:00", "17:40"].slice(0, maxLessonNumber), 
  [maxLessonNumber]);

  const days = useMemo(() => 
    [null, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].slice(0, maxDayNumber + 1), 
  [maxDayNumber]);

  const getLessonEndTime = (startTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const minutes = (
        (startMinutes + LESSON_MINUTES) % MINUTES_IN_HOUR
      ).toLocaleString('en-US', {minimumIntegerDigits: 2});
    const hours = (
        startHours + 
        LESSON_HOURS + 
        Math.floor((startMinutes + LESSON_MINUTES) / MINUTES_IN_HOUR)
      )
    return `${hours}:${minutes}`;
  }

  const getLessonByDayAndTime = (number: number, day: number) => {
    if (timetable) {
      return timetable.find((item) => item.day === day && item.number === number) ?? null;
    }
    return null;
  }

  return (
      <table className={styles.timetable}>
        <thead>
          <tr>
            {days.map((day, index) => <th key={index}>{day}</th>)}
          </tr>
        </thead>
        <tbody>
          {
            lessonsTimes.map((time, i) => 
              <tr key={time}>{
                days.map((day, j) =>
                  day === null ?
                    <th key={time + day}>
                      <span>{time}</span>
                      <span>{i + 1}</span> 
                      <span>{getLessonEndTime(time)}</span>
                    </th> 
                    :
                    <TimetableCell lesson={getLessonByDayAndTime(i + 1, j)} key={time + day}/>
                )
              }</tr>  
            )
          }
        </tbody>
     </table>
  )
}

export default memo(Timetable);