import { type TimetableItem } from '@/types/timetable';
import { type FC } from 'react';
import { generateId, lessonsTimes } from '@/utils/timetable';
import TimetableLesson from './TimetableLesson';
import { classes } from '@/styles/utils';
import { useDelayedProp } from '@/hooks/useDelayedProp';
import styles from './TimetableCell.module.scss';

type OwnProps = {
  lessons: TimetableItem[] | null
  active: boolean
  cellSubgroup?: boolean
  isAfterEmpty?: boolean
};

const ANIMATION_DURATION = 300;

const colors: Record<TimetableItem['type'], string> = {
  lection: 'var(--lect-clr)',
  practical: 'var(--pract-clr)',
  lab: 'var(--lab-clr)',
  consultation: 'var(--consult-clr)'
};

function createStyleAttrFromLessons (lessons: TimetableItem[]) {
  const propertyObject = lessons.reduce<Record<string, string>>((acc, lesson, index) => {
    acc[`--color-${index + 1}`] = colors[lesson.type];
    return acc;
  }, {});
  return propertyObject;
}

const TimetableListItem: FC<OwnProps> = ({ lessons, active, cellSubgroup }) => {
  const [innerLessons, shouldAppear] = useDelayedProp(lessons, ANIMATION_DURATION);
  const isMerged = Boolean(innerLessons && innerLessons.length > 1);

  return (
    innerLessons &&
    <li
      className={
        classes(
          styles['cell-container'],
          active && styles.active,
          styles[`color-${innerLessons.length}`],
          !shouldAppear && !lessons ? styles.hide : styles.show
        )
      }
      style={createStyleAttrFromLessons(innerLessons)}
    >
      <div
        className={classes(styles.spacer, innerLessons[0]?.type)}
        data-time={
          `${lessonsTimes[innerLessons[0]?.number ?? 0 - 1]?.start}
          -${lessonsTimes[innerLessons[0]?.number ?? 0]?.end}`
        }
        data-number={innerLessons[0]?.number}
      />
      <div className={styles.cells}>
        {innerLessons.map((lesson) =>
          <TimetableLesson
            key={generateId(lesson)}
            lesson={lesson} cellSubgroup={cellSubgroup} isMerged={isMerged}
        />)}
      </div>
    </li>
  );
};

export default TimetableListItem;
