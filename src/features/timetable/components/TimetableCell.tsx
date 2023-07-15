import { FC, memo } from 'react';
import TimetableLesson from './TimetableLesson';
import { useDelayedProp } from '@/hooks/useDelayedProp';
import { TimetableItem } from '@/utils/types';
import { generateId } from '@/utils/timetable';
import styles from './TimetableCell.module.scss';
import { classes } from '@/styles/utils';

type OwnProps = {
  lessons: TimetableItem[] | null;
  active: boolean;
  cellSubgroup?: boolean;
  isAfterEmpty?:boolean;
};

const ANIMATION_DURATION = 300;

const TimetableCell: FC<OwnProps> = ({lessons, active, cellSubgroup, isAfterEmpty}) => {
  const [innerLessons, shouldAppear] = useDelayedProp(lessons, ANIMATION_DURATION);
  const isMerged = Boolean(innerLessons && innerLessons.length > 1);

  return ( 
    <>
      {innerLessons !== null ? (
          <td className={
            classes(
              styles['timetable-td'], 
              innerLessons[0]?.type, 
              active && styles.active,
              !shouldAppear && !lessons ? styles.hide : styles.show, 
            )
          }>
            {
              innerLessons.map((lesson) =>
                <TimetableLesson 
                  key={generateId(lesson)} 
                  lesson={lesson} cellSubgroup={cellSubgroup} isMerged={isMerged} 
                />
              )
            }
          </td>
        ) : <td className={classes(styles.empty, active && styles.active, isAfterEmpty && styles.border)}><div></div></td>
      }    
    </>

  )
};

export default memo(TimetableCell);