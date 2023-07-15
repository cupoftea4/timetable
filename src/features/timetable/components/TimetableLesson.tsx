import { FC, memo } from 'react';
import TimetableLink from '../ui/TimetableLink';
import { lessonsTimes } from '@/utils/timetable';
import { classes } from '@/styles/utils';
import styles from './TimetableCell.module.scss';
import type { TimetableItem } from '@/types/timetable';

type OwnProps = {
  lesson: TimetableItem;
  isMerged?: boolean;
  cellSubgroup?: boolean;
};


const TimetableLesson: FC<OwnProps> = ({lesson, cellSubgroup, isMerged}) => {
  const isForBothSubgroups = lesson.isFirstSubgroup && lesson.isSecondSubgroup;
  const times = lessonsTimes[lesson.number - 1];

  return ( 
    <>
      <div className={classes(styles.spacer, lesson.type)} 
        data-time={`${times?.start}-${times?.end}`} data-number={lesson.number}/>
      <div className={classes(styles.cell, lesson.type, isMerged && styles.merged, !lesson ? styles.hide : styles.show)} >
        <div className={styles.info}>
          {cellSubgroup && !isForBothSubgroups  && 
            <span className={styles.subgroup}>
              {lesson.isSecondSubgroup ? "II" : "I"} підгрупа
            </span>}
          <span className={styles.title}>
            <h2 className={styles.name}>{lesson.subject.replace('`', '’')}</h2> 
            {lesson.lecturer.trim().replace(/,$/, '')}
          </span> 
          <span className={styles.extra}>  
            {lesson.location.replaceAll(/,./g, '').trim()} 
            <TimetableLink urls={lesson.urls} type={lesson.type} />
          </span>
        </div>      
      </div>
    </>

  )
};

export default memo(TimetableLesson);