import { TimetableItem } from '../utils/types';
import styles from './TimetableCell.module.scss';

const TimetableCell = ({lesson}: {lesson:  null | TimetableItem}) => {
  return (
    <>
      {lesson !== null ? (
          <td >
            <div className={`${styles.spacer} ${styles[lesson.type]}`}/>
            <div className={styles.cell}>
              <div className={styles.info}>
                <h4>{lesson.subject}</h4>  
                {lesson.location.trim()} 
                <a href={lesson.urls[0]} className={styles[lesson.type]}>Приєднатись</a>   
              </div>      
            </div>
          </td>
        ) : <td></td>
      }    
    </>

  )
}

export default TimetableCell;