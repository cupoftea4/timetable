import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { TimetableItem } from '../utils/types';
import TimetableCell from './TimetableCell';
import styles from './Timetable.module.scss';
import { getCurrentUADate, stringToDate } from '../utils/date';
import TimetableUtil from '../utils/TimetableUtil';

type OwnProps = {
  timetable: TimetableItem[];
  isSecondSubgroup: boolean;
  isSecondWeek: boolean;
  cellSubgroup?: boolean;
};

const MINUTE = 60 * 1000;

const Timetable: FC<OwnProps> = ({timetable, isSecondSubgroup, isSecondWeek, cellSubgroup}) => {
  const maxLessonNumber = useMemo(() => 
    timetable?.reduce((max, item) => item.number > max ? item.number : max, 0) || 0, 
  [timetable]);
  const maxDayNumber = useMemo(() =>
    timetable?.reduce((max, item) => item.day > max ? item.day : max, 0) || 0,
  [timetable]);

  const lessonsTimes = useMemo(() => 
    TimetableUtil.lessonsTimes.slice(0, maxLessonNumber), 
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

  const forBothSubgroups = (item: TimetableItem) => item.isFirstSubgroup && item.isSecondSubgroup;
  const forAllWeeks = (item: TimetableItem) => item.isFirstWeek && item.isSecondWeek;

  const getLessonByDayAndTime = (number: number, day: number) => {
    if (!timetable) return null;
    return timetable.find(item => 
      item.day === day &&
      item.number === number &&
      (cellSubgroup || item.isSecondSubgroup === isSecondSubgroup || forBothSubgroups(item)) &&
      (item.isSecondWeek === isSecondWeek || forAllWeeks(item))
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
                          key={time.start + day}
                          cellSubgroup={cellSubgroup}
                    />
                )
              }</tr>  
            )
          }
        </tbody>
     </table>
  )
};

export default Timetable;