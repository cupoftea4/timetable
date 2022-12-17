import { memo } from 'react';
import { useDelayedProp } from '../hooks/useDelayedProp';
import { TimetableItem } from '../utils/types';
import styles from './TimetableCell.module.scss';

type TimetableCellProps = {
  lesson: null | TimetableItem;
  active: boolean;
};

const ANIMATION_DURATION = 300;

const TimetableCell = ({lesson, active}: TimetableCellProps) => {
  const [innerLesson, shouldAppear] = useDelayedProp(lesson, ANIMATION_DURATION);

  return ( 
    <>
      {innerLesson !== null ? (
          <td className={`${!shouldAppear ? styles.hide : styles.show}`}>
            <div className={`${styles.spacer} ${styles[innerLesson.type]}`}/>
            <div className={`${styles.cell} ${active && styles.active}`} >
              <div className={styles.info}>
                <span>
                  <h4>{innerLesson.subject.replace('`', '’')}</h4> 
                  {innerLesson.lecturer}
                </span> 
                <span>  
                  {innerLesson.location.replaceAll(/,./g, '').trim()} 
                  {innerLesson.urls[0] && 
                    <a href={innerLesson.urls[0]} target="_blank" rel="noreferrer"
                    className={styles[innerLesson.type]}>Приєднатись</a>
                  }
                </span>
              </div>      
            </div>
          </td>
        ) : <td style={{minWidth: "12rem"}}></td>
      }    
    </>

  )
};

export default memo(TimetableCell);