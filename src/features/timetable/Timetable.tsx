import useWindowDimensions from "@/hooks/useWindowDimensions";
import { classes } from "@/styles/utils";
import type { TimetableItem } from "@/types/timetable";
import { DEVELOP, TIMETABLE_SCREEN_BREAKPOINT } from "@/utils/constants";
import { getCurrentUADate, stringToDate } from "@/utils/date";
import { generateSaturdayLessons, lessonsTimes, skeletonTimetable, unique } from "@/utils/timetable";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./Timetable.module.scss";
import TimetableLesson from "./components/TimetableLesson";

type OwnProps = {
  timetable: TimetableItem[];
  isSecondSubgroup: boolean;
  isSecondWeek: boolean;
  hasCellSubgroups?: boolean;
  isLoading?: boolean;
};

const MINUTE = 60 * 1000;

const forBothSubgroups = (item: TimetableItem) => item.isFirstSubgroup && item.isSecondSubgroup;
const forAllWeeks = (item: TimetableItem) => item.isFirstWeek && item.isSecondWeek;

const Timetable: FC<OwnProps> = ({
  timetable: originalTimetable,
  isSecondSubgroup,
  isSecondWeek,
  hasCellSubgroups,
  isLoading,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < TIMETABLE_SCREEN_BREAKPOINT;

  const timetable = useMemo(() => {
    return [...originalTimetable, ...generateSaturdayLessons(originalTimetable)];
  }, [originalTimetable]);

  const maxLessonNumber = useMemo(
    () => timetable?.reduce((max, item) => (item.number > max ? item.number : max), 0) || 0,
    [timetable]
  );
  const maxDayNumber = useMemo(
    () => timetable?.reduce((max, item) => (item.day > max ? item.day : max), 0) || 0,
    [timetable]
  );

  const timetableLessonsTimes = useMemo(() => lessonsTimes.slice(0, maxLessonNumber), [maxLessonNumber]);

  const days = useMemo(
    () =>
      [null, "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"].slice(0, maxDayNumber + 1),
    [maxDayNumber]
  );

  const tableDays = isLoading ? skeletonTimetable.days : days;
  const tableLessonsTimes = isLoading ? skeletonTimetable.lessonsTimes : timetableLessonsTimes;

  const getCurrentLessonNumber = useCallback(() => {
    const curDate = getCurrentUADate();
    return timetableLessonsTimes.findIndex((time) => curDate <= stringToDate(time.end));
  }, [timetableLessonsTimes]);

  const currentDay = getCurrentUADate().getDay();
  const [currentLessonNumber, setCurrentLessonNumber] = useState(getCurrentLessonNumber());

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentLessonNumber(getCurrentLessonNumber());
    }, MINUTE);
    return () => {
      clearInterval(id);
    };
  }, [getCurrentLessonNumber]);

  const getLessonsByDayAndTime = useCallback(
    (number: number, day: number) => {
      if (!timetable) return null;
      const result = timetable.filter(
        (item) =>
          item.day === day &&
          item.number === number &&
          (hasCellSubgroups || item.isSecondSubgroup === isSecondSubgroup || forBothSubgroups(item)) &&
          (item.isSecondWeek === isSecondWeek || forAllWeeks(item) || item.day === 6)
      );
      return result.length === 0 ? null : unique(result);
    },
    [timetable, isSecondSubgroup, isSecondWeek, hasCellSubgroups]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: I have no idea why
  const tableContent = useMemo(() => {
    if (isMobile) return null;
    if (DEVELOP) console.log("Running scary useMemo");
    const table = tableLessonsTimes.map((time, i) => (
      <tr key={time.start}>
        {tableDays.map((day, j) =>
          day === null ? (
            <th key={time.start} style={{ height: "5rem" }}>
              <span className={classes(styles.metadata, styles.start)}>{time.start}</span>
              <span className={classes(styles.metadata, styles.number)}>{i + 1}</span>
              <span className={classes(styles.metadata, styles.end)}>{time.end}</span>
            </th>
          ) : !isLoading ? (
            <TimetableLesson
              isListView={false}
              isAfterEmpty={i !== 0 && getLessonsByDayAndTime(i, j) === null}
              lessons={getLessonsByDayAndTime(i + 1, j)}
              active={currentLessonNumber === i && currentDay === j}
              key={time.start + day}
              cellSubgroup={hasCellSubgroups}
            />
          ) : (
            <td
              key={time.start + day}
              className={classes(
                "h-10 w-60",
                skeletonTimetable.lessons.has(`${j}-${i + 1}`) && "bg-neutral-500 animate-pulse"
              )}
            />
          )
        )}
      </tr>
    ));
    return table;
  }, [
    isMobile,
    timetableLessonsTimes,
    timetable,
    days,
    getLessonsByDayAndTime,
    currentLessonNumber,
    currentDay,
    hasCellSubgroups,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: I have no idea why
  const listsContent = useMemo(() => {
    if (!isMobile) return null;
    if (DEVELOP) console.log("Running scary useMemo");
    const lists = tableDays.filter(Boolean).map((day, i) => (
      <div key={i} className={styles.list}>
        <h3 className={styles["day-title"]}>{day}</h3>
        <ol className={styles.list}>
          {!isLoading
            ? timetableLessonsTimes.map((time, j) => (
                <TimetableLesson
                  isListView={true}
                  lessons={getLessonsByDayAndTime(j + 1, i + 1)}
                  active={currentLessonNumber === j && currentDay === i + 1}
                  key={time.start + day}
                  cellSubgroup={hasCellSubgroups}
                />
              ))
            : Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="px-0.5">
                  <div className="rounded-xl h-[85.7px] w-full bg-neutral-500 animate-pulse mb-2" />
                </div>
              ))}
        </ol>
      </div>
    ));
    return lists;
  }, [
    isMobile,
    timetableLessonsTimes,
    timetable,
    days,
    getLessonsByDayAndTime,
    currentLessonNumber,
    currentDay,
    hasCellSubgroups,
  ]);

  return isMobile ? (
    <div className={classes(styles.timetable, styles.lists)}>{listsContent}</div>
  ) : (
    <table className={styles.timetable}>
      <thead>
        <tr>
          {tableDays.map((day, index) => (
            <th key={index}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>{tableContent}</tbody>
    </table>
  );
};

export default Timetable;
