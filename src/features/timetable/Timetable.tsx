import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import TimetableCell from './components/TimetableCell';
import { lessonsTimes, unique } from '@/utils/timetable';
import { getCurrentUADate, stringToDate } from '@/utils/date';
import { TimetableItem } from '@/utils/types';
import styles from './Timetable.module.scss';

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

  const timetableLessonsTimes = useMemo(() => 
    lessonsTimes.slice(0, maxLessonNumber), 
  [maxLessonNumber]);

  const days = useMemo(() => 
    [null, "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"].slice(0, maxDayNumber + 1), 
  [maxDayNumber]);

  const getCurrentLessonNumber = useCallback(() => {
    const curDate = getCurrentUADate();
    return timetableLessonsTimes.findIndex(time => curDate <= stringToDate(time.end));
  }, [timetableLessonsTimes]);

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

  const getLessonsByDayAndTime = useCallback((number: number, day: number) => {
    if (!timetable) return null;
    const result = timetable.filter(item => 
      item.day === day &&
      item.number === number &&
      (cellSubgroup || item.isSecondSubgroup === isSecondSubgroup || forBothSubgroups(item)) &&
      (item.isSecondWeek === isSecondWeek || forAllWeeks(item))
    );
    return result.length === 0 ? null : unique(result);
  }, [timetable, isSecondSubgroup, isSecondWeek, cellSubgroup]);

  const tableContent = useMemo(() => {
    console.log("Running scary useMemo");
    const table = timetableLessonsTimes.map((time, i) => 
      <tr key={time.start}>{
        days.map((day, j) =>
          day === null 
            ? <th key={time.start + day} style={{height: "5rem"}}>
                <span>{time.start}</span>
                <span>{i + 1}</span> 
                <span>{time.end}</span>
              </th> 
            : <TimetableCell
                isAfterEmpty={i !== 0 && getLessonsByDayAndTime(i, j) === null} 
                lessons={getLessonsByDayAndTime(i + 1, j)} 
                active={currentLessonNumber === i && currentDay === j} 
                key={time.start + day}
                cellSubgroup={cellSubgroup}
              />
        )
      }</tr> 
    );
    return table;
  }, [timetableLessonsTimes,timetable, days, getLessonsByDayAndTime, currentLessonNumber, currentDay, cellSubgroup]);


  return (
    <table className={styles.timetable}>
      <thead>
        <tr>
          {days.map((day, index) => <th key={index}>{day}</th>)}
        </tr>
      </thead>
      <tbody>
        {tableContent}
      </tbody>
     </table>
  )
};

export default Timetable;