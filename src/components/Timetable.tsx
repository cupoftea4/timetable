import { useCallback, useEffect, useMemo, useState } from 'react';
import { TimetableItem } from '../utils/types';
import TimetableCell from './TimetableCell';
import styles from './Timetable.module.scss';
import { getCurrentUADate, stringToDate } from '../utils/date';

type TimetableProps = {
  timetable: TimetableItem[];
  isSecondSubgroup: boolean;
  isSecondWeek: boolean;
};

const MINUTE = 60 * 1000;

const Timetable = ({timetable, isSecondSubgroup, isSecondWeek}: TimetableProps) => {
  const maxLessonNumber = useMemo(() => 
    timetable?.reduce((max, item) => item.number > max ? item.number : max, 0) || 0, 
  [timetable]);
  const maxDayNumber = useMemo(() =>
    timetable?.reduce((max, item) => item.day > max ? item.day : max, 0) || 0,
  [timetable]);

  const lessonsTimes = useMemo(() => [ 
      {start:  "8:30", end: "10:05"},
      {start: "10:20", end: "11:55"},
      {start: "12:10", end: "13:45"},
      {start: "14:15", end: "15:50"},
      {start: "16:00", end: "17:35"},
      {start: "17:40", end: "19:15"},
      {start: "19:20", end: "20:55"},
      {start: "21:00", end: "22:35"}
    ].slice(0, maxLessonNumber), 
  [maxLessonNumber]);

  const days = useMemo(() => 
    [null, "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"].slice(0, maxDayNumber + 1), 
  [maxDayNumber]);

  const getCurrentLessonNumber = useCallback(() => {
    const curDate = getCurrentUADate();
    return lessonsTimes.findIndex(time => curDate <= stringToDate(time.end));
  }, [lessonsTimes]);

  const currentDay =  getCurrentUADate().getDay();
  const [currentLessonNumber, setCurrentLessonNumber] = useState(getCurrentLessonNumber());

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentLessonNumber(getCurrentLessonNumber());
    }, MINUTE);
    return () => clearInterval(id);
  }, [getCurrentLessonNumber]);

  const getLessonByDayAndTime = (number: number, day: number) => {
    if (!timetable) return null;
    return timetable.find(item => 
      item.day === day &&
      item.number === number &&
      ((item.isSecondSubgroup === isSecondSubgroup && item.isFirstSubgroup === !isSecondSubgroup) ||
        (item.isFirstSubgroup && item.isSecondSubgroup)) &&
      ((item.isSecondWeek === isSecondWeek && item.isFirstWeek === !isSecondWeek) ||
        (item.isFirstWeek && item.isSecondWeek))
    ) ?? null;
  };

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
              <tr key={time.start}>{
                days.map((day, j) =>
                  day === null 
                    ? <th key={time.start + day} style={{height: "5rem"}}>
                        <span>{time.start}</span>
                        <span>{i + 1}</span> 
                        <span>{time.end}</span>
                      </th> 
                    : <TimetableCell 
                          lesson={getLessonByDayAndTime(i + 1, j)} 
                          active={currentLessonNumber === i && currentDay === j} 
                          key={time.start + day}/>
                )
              }</tr>  
            )
          }
        </tbody>
     </table>
  )
};

export default Timetable;