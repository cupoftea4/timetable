import { classes } from "@/styles/utils";
import type { ExamsTimetableItem } from "@/types/timetable";
import { LVIV_TIMEZONE } from "@/utils/date";
import { lessonsTimes } from "@/utils/timetable";
import type { FC } from "react";
import styles from "./ExamsTimetable.module.scss";
import TimetableLink from "./ui/TimetableLink";

type OwnProps = {
  exams: ExamsTimetableItem[];
  isLoading: boolean;
};

const ExamsTimetable: FC<OwnProps> = ({ exams, isLoading }) => {
  const compareDates = (a: ExamsTimetableItem, b: ExamsTimetableItem) => a.date.getTime() - b.date.getTime();

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  return (
    <div className={styles.exams}>
      {!isLoading
        ? exams?.sort(compareDates).map((exam, index) => (
            <div key={index} className={classes(styles.exam, isSameDay(exam.date, new Date()) && styles.active)}>
              <div className={styles.top}>
                <p>
                  {exam.date.toLocaleString("uk-UA", {
                    timeZone: LVIV_TIMEZONE,
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p>
                  {exam.number} пара ({lessonsTimes[exam.number - 1]?.start})
                </p>
              </div>
              <h3>{exam.subject}</h3>
              <div className={styles.bottom}>
                <p>{exam.lecturer.trim().replace(/,$/, "")}</p>
                <TimetableLink urls={exam.urls} type={"lab"} />
              </div>
            </div>
          ))
        : Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={classes(styles.exam, "h-[106px] bg-neutral-500 !animate-pulse")} />
          ))}
    </div>
  );
};

export default ExamsTimetable;
