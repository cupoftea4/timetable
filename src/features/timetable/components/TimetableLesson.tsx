import { type FC, memo, type ReactNode } from 'react';
import TimetableLessonInfo from './TimetableLessonInfo';
import { useDelayedProp } from '@/hooks/useDelayedProp';
import { generateId, lessonsTimes } from '@/utils/timetable';
import styles from './TimetableCell.module.scss';
import { classes } from '@/styles/utils';
import type { TimetableItem } from '@/types/timetable';

type OwnProps = {
  lessons: TimetableItem[] | null
  active: boolean
  isListView: boolean
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

const TimetableLesson: FC<OwnProps> = ({ isListView, lessons, active, cellSubgroup, isAfterEmpty }) => {
  const [innerLessons, shouldAppear] = useDelayedProp(lessons, ANIMATION_DURATION);
  const isMerged = Boolean(innerLessons && innerLessons.length > 1);

  return (
    <>
      {innerLessons !== null
        ? (
           <LessonContainer
            isList={isListView}
            className={classes(
              styles['cell-container'],
              active && styles.active,
              styles[`color-${innerLessons?.length}`],
              !shouldAppear && !lessons ? styles.hide : styles.show
            )}
            style={createStyleAttrFromLessons(innerLessons ?? [])}
           >
              <div
                className={classes(styles.spacer, innerLessons?.[0]?.type)}
                data-time={
                  `${lessonsTimes[innerLessons?.[0]?.number ?? 0 - 1]?.start}
                  -${lessonsTimes[innerLessons?.[0]?.number ?? 0]?.end}`
                }
                data-number={innerLessons?.[0]?.number}
              />
              <div className={styles.cells}>
                {innerLessons?.map((lesson) =>
                  <TimetableLessonInfo
                    key={generateId(lesson)}
                    lesson={lesson} cellSubgroup={cellSubgroup} isMerged={isMerged}
                />)}
              </div>
            </LessonContainer>
          )
        : !isListView &&
          <td className={classes(styles.empty, active && styles.active, isAfterEmpty && styles.border)}>
            <div></div>
          </td>
      }
    </>

  );
};

type ReactComponentProps = React.ButtonHTMLAttributes<HTMLElement> & { children: ReactNode };

const LessonContainer: FC<ReactComponentProps & { isList: boolean }> = ({ isList, children, ...props }) => {
  return (
    isList
      ? <li {...props}>{children}</li>
      : <td {...props}>{children}</td>
  );
};

export default memo(TimetableLesson);
