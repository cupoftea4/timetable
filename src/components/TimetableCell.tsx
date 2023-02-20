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
};

const ANIMATION_DURATION = 300;

const TimetableCell: FC<OwnProps> = ({lesson, active, cellSubgroup}) => {
  const [innerLesson, shouldAppear] = useDelayedProp(lesson, ANIMATION_DURATION);
  const isForBothSubgroups = innerLesson?.isFirstSubgroup && innerLesson?.isSecondSubgroup;
  const times = innerLesson && TimetableUtil.lessonsTimes[innerLesson.number]

  return ( 
    <>
      {innerLesson !== null ? (
          <td className={`${styles['timetable-td']} ${innerLesson.type} ${!shouldAppear ? styles.hide : styles.show} ${active && styles.active}`}>
            <div className={`${styles.spacer} ${innerLesson.type}`} 
              data-time={`${times?.start}-${times?.end}`} data-number={innerLesson.number}/>
            <div className={`${styles.cell} ${innerLesson.type}`} >
              <div className={styles.info}>
                {cellSubgroup && !isForBothSubgroups  && 
                  <span className={styles.subgroup}>
                    {innerLesson.isSecondSubgroup ? "II" : "I"} підгрупа
                  </span>}
                <span className={styles.title}>
                  <h4>{innerLesson.subject.replace('`', '’')}</h4> 
                  {innerLesson.lecturer.trim().replace(/,$/, '')}
                </span> 
                <span>  
                  {innerLesson.location.replaceAll(/,./g, '').trim()} 
                  <TimetableLink urls={innerLesson.urls} type={innerLesson.type} />
                </span>
              </div>      
            </div>
          </td>
        ) : <td className={`${styles.empty} ${active && styles.active}`}><div></div></td>
      }    
    </>

  )
};

export default memo(TimetableCell);