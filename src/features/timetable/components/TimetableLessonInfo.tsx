import { type FC, memo } from "react";
import { useParams } from "react-router-dom";
import { classes } from "@/styles/utils";
import type { TimetableItem } from "@/types/timetable";
import { hashCode } from "@/utils/general";
import { generateId, getDisplayType } from "@/utils/timetable";
import TimetableLink from "../ui/TimetableLink";
import styles from "./TimetableLesson.module.scss";

type OwnProps = {
  lesson: TimetableItem;
  isMerged?: boolean;
  cellSubgroup?: boolean;
};

const TimetableLessonInfo: FC<OwnProps> = ({ lesson, cellSubgroup, isMerged }) => {
  const { group = "" } = useParams();
  const doodleSeed = Math.abs(hashCode(`${group}|${generateId(lesson)}`));
  const doodle = ["face", "sleepy", "paw", "curled"][doodleSeed % 10];
  const doodleColor = ["lection", "practical", "lab"][Math.floor(doodleSeed / 10) % 3];
  const isForBothSubgroups = lesson.isFirstSubgroup && lesson.isSecondSubgroup;

  const cleanupInfoString = (str: string) => {
    return str
      .replaceAll(/Лекція|Практична|Лабораторна/giu, "")
      .trim()
      .replace(/,$/, "");
  };

  const lecturer = cleanupInfoString(lesson.lecturer);
  const location = cleanupInfoString(lesson.location);

  return (
    <div
      className={classes(styles.cell, isMerged && styles.merged, !lesson ? styles.hide : styles.show)}
      data-cat-doodle={doodle}
      data-cat-color={doodle ? doodleColor : undefined}
    >
      <div className={styles.info}>
        {cellSubgroup && !isForBothSubgroups && (
          <span className={styles.subgroup}>{lesson.isSecondSubgroup ? "II" : "I"} підгрупа</span>
        )}
        <span className={styles.title}>
          <h2 className={styles.name}>{lesson.subject.replace("`", "’")}</h2>
          {lecturer + (location && `, ${location}`)}
        </span>
        <span className={styles.extra}>
          {getDisplayType(lesson.type)}
          <TimetableLink urls={lesson.urls} type={lesson.type} />
        </span>
      </div>
    </div>
  );
};

export default memo(TimetableLessonInfo);
