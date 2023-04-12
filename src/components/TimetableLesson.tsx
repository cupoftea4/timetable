import { FC, memo, useState } from 'react';
import { useDelayedProp } from '../hooks/useDelayedProp';
import { classes } from '../styles/utils';
import TimetableUtil from '../utils/TimetableUtil';
import { TimetableItem } from '../utils/types';
import styles from './TimetableCell.module.scss';
import TimetableLink from './TimetableLink';

type OwnProps = {
  lesson: TimetableItem;
  isMerged?: boolean;
  cellSubgroup?: boolean;
};

const ANIMATION_DURATION = 300;

const TimetableLesson: FC<OwnProps> = ({lesson, cellSubgroup, isMerged}) => {
  const isForBothSubgroups = lesson.isFirstSubgroup && lesson.isSecondSubgroup;
  const times = TimetableUtil.lessonsTimes[lesson.number - 1];
  const [innerLesson, shouldAppear] = useDelayedProp(lesson, ANIMATION_DURATION);
  const [onTop, setOnTop] = useState(0);

  return ( 
    <>
      <div className={classes(styles.spacer, innerLesson.type)} 
              data-time={`${times?.start}-${times?.end}`} data-number={innerLesson.number}/>
            <div className={classes(styles.cell, innerLesson.type, isMerged && styles.merged, !shouldAppear ? styles.hide : styles.show)} >
              <div className={styles.info}>
                {cellSubgroup && !isForBothSubgroups  && 
                  <span className={styles.subgroup}>
                    {innerLesson.isSecondSubgroup ? "II" : "I"} підгрупа
                  </span>}
                <span className={styles.title}>
                  <h2 className={styles.name}>{innerLesson.subject.replace('`', '’')}</h2> 
                  {innerLesson.lecturer.trim().replace(/,$/, '')}
                </span> 
                <span className={styles.extra}>  
                  {innerLesson.location.replaceAll(/,./g, '').trim()} 
                  <TimetableLink urls={innerLesson.urls} type={innerLesson.type} />
                </span>
              </div>      
            </div>
    </>

  )
};

export default memo(TimetableLesson);