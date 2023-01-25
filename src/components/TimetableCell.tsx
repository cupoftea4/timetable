import { FC, memo } from 'react';
import { useDelayedProp } from '../hooks/useDelayedProp';
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

  return ( 
    <>
      {innerLesson !== null ? (
          <td className={`${styles['timetable-td']} ${!shouldAppear ? styles.hide : styles.show} ${active && styles.active}`}>
            <div className={`${styles.spacer} ${styles[innerLesson.type]}`}/>
            <div className={`${styles.cell}`} >
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
        ) : <td style={{minWidth: "12rem"}} className={`${active && styles.active}`}></td>
      }    
    </>

  )
};

export default memo(TimetableCell);