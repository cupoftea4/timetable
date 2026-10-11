import { type FC, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { classes } from "@/styles/utils";
import type { TimetableItem, TimetableType } from "@/types/timetable";
import { DEVELOP } from "@/utils/constants";
import { getCurrentUADate, isDateInWeek, stringToDate } from "@/utils/date";
import { generateSaturdayLessons, lessonsTimes, skeletonTimetable, unique } from "@/utils/timetable";
import TimetableLesson from "./components/TimetableLesson";
import styles from "./Timetable.module.scss";

type OwnProps = {
  timetable: TimetableItem[];
  isSecondSubgroup: boolean;
  isSecondWeek: boolean;
  hasCellSubgroups?: boolean;
  isLoading?: boolean;
  timetableType?: TimetableType;
  selectedWeek?: Date;
  scrollerRef: RefObject<HTMLElement | null>;
};

const SHORT_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const MINUTE = 60 * 1000;

const forBothSubgroups = (item: TimetableItem) => item.isFirstSubgroup && item.isSecondSubgroup;
const forAllWeeks = (item: TimetableItem) => item.isFirstWeek && item.isSecondWeek;

const Timetable: FC<OwnProps> = ({
  timetable: originalTimetable,
  isSecondSubgroup,
  isSecondWeek,
  hasCellSubgroups,
  isLoading,
  timetableType,
  selectedWeek,
  scrollerRef,
}) => {
  const isMobile = useIsMobile();
  const dayLists = useRef<(Element | null)[]>([]);
  const [visibleDay, setVisibleDay] = useState(0);

  const isPartTime = timetableType === "parttime";

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

      if (isPartTime && selectedWeek) {
        const result = timetable.filter(
          (item) =>
            item.date &&
            isDateInWeek(item.date, selectedWeek) &&
            item.day === day &&
            item.number === number &&
            (hasCellSubgroups || item.isSecondSubgroup === isSecondSubgroup || forBothSubgroups(item))
        );
        return result.length === 0 ? null : unique(result);
      }

      const result = timetable.filter(
        (item) =>
          item.day === day &&
          item.number === number &&
          (hasCellSubgroups || item.isSecondSubgroup === isSecondSubgroup || forBothSubgroups(item)) &&
          (item.isSecondWeek === isSecondWeek || forAllWeeks(item) || item.day === 6)
      );
      return result.length === 0 ? null : unique(result);
    },
    [timetable, isSecondSubgroup, isSecondWeek, hasCellSubgroups, isPartTime, selectedWeek]
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
                skeletonTimetable.lessons.has(`${j}-${i + 1}`) && "bg-white/15 animate-pulse"
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
    const lists = tableDays.filter(Boolean).map((day, i) => {
      const dayLessons = timetableLessonsTimes.map((_, j) => getLessonsByDayAndTime(j + 1, i + 1));
      const hasAnyLessons = dayLessons.some((lessons) => lessons !== null);

      return (
        <div
          key={day}
          ref={(list) => {
            dayLists.current[i] = list;
          }}
          className={classes(styles.list, "relative flex flex-col min-h-64")}
        >
          <h2 className="sr-only">{day}</h2>
          <ol className={classes(styles.list, "h-full")}>
            {!isLoading ? (
              hasAnyLessons ? (
                timetableLessonsTimes.map((time, j) => (
                  <TimetableLesson
                    isListView={true}
                    lessons={getLessonsByDayAndTime(j + 1, i + 1)}
                    active={currentLessonNumber === j && currentDay === i + 1}
                    key={time.start + day}
                    cellSubgroup={hasCellSubgroups}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm font-light opacity-60">Немає пар на цей день</p>
                </div>
              )
            ) : (
              Array.from({ length: 3 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: This is fine
                <div key={index} className="px-0.5">
                  <div className="rounded-xl h-[85.7px] w-full bg-white/15 animate-pulse mb-2" />
                </div>
              ))
            )}
          </ol>
        </div>
      );
    });
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: observes the day lists again when they are rendered anew
  useEffect(() => {
    if (!isMobile) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)?.target;
        if (visible) setVisibleDay(dayLists.current.indexOf(visible));
      },
      { root: scrollerRef.current, threshold: 0.6 }
    );
    for (const list of dayLists.current) if (list) observer.observe(list);
    return () => observer.disconnect();
  }, [isMobile, listsContent, scrollerRef]);

  return isMobile ? (
    <>
      <nav className={styles.days} aria-label="Дні тижня">
        {tableDays.filter(Boolean).map((day, i) => (
          <button
            key={day}
            type="button"
            title={day}
            aria-current={visibleDay === i}
            className={classes((currentDay || 7) === i + 1 && styles.today)}
            onClick={() =>
              dayLists.current[i]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
            }
          >
            {SHORT_DAYS[i]}
          </button>
        ))}
      </nav>
      <div className={classes(styles.timetable, styles.lists)}>{listsContent}</div>
    </>
  ) : (
    <table className={styles.timetable}>
      <thead>
        <tr>
          {tableDays.map((day) => (
            <th key={day}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>{tableContent}</tbody>
    </table>
  );
};

export default Timetable;
