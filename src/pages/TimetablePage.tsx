import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import HomeIcon from '../assets/HomeIcon';
import SavedMenu from '../components/SavedMenu';
import TimetableManager from '../utils/TimetableManager';
import styles from '../components/HeaderPanel.module.scss';
import { TimetableItem } from '../utils/types';
import LoadingPage from './LoadingPage';
import Timetable from '../components/Timetable';
import './TimetablePage.module.scss';

const TimetablePage = () => {
  const group = useParams().group?.toUpperCase().trim();
  const [timetableGroup, setTimetableGroup] = useState<string | null>();
  const [timetable, setTimetable] = useState<TimetableItem[]>();

  useEffect(() => {
    if (timetableGroup) {
      console.log(TimetableManager.getCachedTimetables());
    }
  }, [timetableGroup]);

  useEffect(
    () => {
      if (group && TimetableManager.ifGroupExists(group)) {        
        setTimetableGroup(group.toUpperCase().trim());
        TimetableManager.getTimetable(group).then(
          (data) => {
            // console.log(sortByTime(sortByDay(data)));
            setTimetable(data);
          }
        ).catch((err) =>  {
          setTimetableGroup(null);
          console.error(err);
        });
      } else {
        setTimetableGroup(null);
      }
    }, [group]);


  
  return (
    <>
      {timetableGroup !== null ? 
        timetable !== undefined ?
          <>
            <header>
              <nav className={styles['nav-buttons']}> 
                <Link to="/"><HomeIcon className={styles.home}/></Link>
                <SavedMenu likable={true}/>
                <h1>{timetableGroup}</h1>
              </nav>
            </header>
            <main>
              <Timetable timetable={timetable}/>
            </main> 
          </>       
        : <LoadingPage/>
      : <Navigate to="/"/>}
    </>
  )
}

export default TimetablePage;