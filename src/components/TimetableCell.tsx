import { FC, memo } from 'react';
import { useDelayedProp } from '../hooks/useDelayedProp';
import TimetableUtil from '../utils/TimetableUtil';
import { TimetableItem } from '../utils/types';
import styles from './TimetableCell.module.scss';
import TimetableLink from './TimetableLink';

type OwnProps = {
  lesson: null | TimetableItem;
  active: boolean;
  cellSubgroup?: boolean;
  isAfterEmpty?:boolean;
};

const ANIMATION_DURATION = 300;

const TimetableCell: FC<OwnProps> = ({lesson, active, cellSubgroup, isAfterEmpty}) => {
  const [innerLesson, shouldAppear] = useDelayedProp(lesson, ANIMATION_DURATION);
  const isForBothSubgroups = innerLesson?.isFirstSubgroup && innerLesson?.isSecondSubgroup;
  const times = innerLesson && TimetableUtil.lessonsTimes[innerLesson.number - 1]

  return ( 
    <>
      {innerLesson !== null ? (
          <td className={`
              ${styles['timetable-td']} 
              ${innerLesson.type} 
              ${!shouldAppear ? styles.hide : styles.show} 
              ${active && styles.active}`
            }>
            <div className={`${styles.spacer} ${innerLesson.type}`} 
              data-time={`${times?.start}-${times?.end}`} data-number={innerLesson.number}/>
            <div className={`${styles.cell} ${innerLesson.type}`} >
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
          </td>
        ) : <td className={`${styles.empty} ${active && styles.active} ${isAfterEmpty && styles.border}`}><div></div></td>
      }    
    </>

  )
};

export default memo(TimetableCell);