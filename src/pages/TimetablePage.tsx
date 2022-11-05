import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import HomeIcon from '../assets/HomeIcon';
import SavedMenu from '../components/SavedMenu';
import TimetableManager from '../utils/TimetableManager';
import styles from '../components/HeaderPanel.module.scss';
// import { TimetableItem } from '../utils/types';

const TimetablePage = () => {
  const { group } = useParams();
  const [timetableGroup, setTimetableGroup] = useState<string | null>();
  // const [timetable, setTimetable] = useState<TimetableItem[]>();

  useEffect(() => {
    if (timetableGroup) {
      console.log(TimetableManager.getCachedTimetables());
    }
  }, [timetableGroup]);

  useEffect(
    () => {
      if (group && TimetableManager.ifGroupExists(group)) {        
        TimetableManager.getTimetable(group).then(
          (timetable) => {
            // setTimetable(timetable);
            setTimetableGroup(group.toUpperCase().trim());
          }
        ).catch((err) =>  {
          setTimetableGroup(null);
          console.error(err)
        });
      } else {
        setTimetableGroup(null);
      }
    }, [group]);

    // const getTimetableGroup = async () => {
    //   setTimetableGroup(TimetableManager.getCachedGroups().find(
    //     (gr: string) => gr.toLowerCase().trim() === group?.toLowerCase()) ?? null
    //   );
    //   TimetableManager.getTimetable(group).catch(console.error);
    // }

  
  return (
    <>
      {timetableGroup !== null ? 
        <>
          <header>
            <nav className={styles['nav-buttons']}>
              <Link to="/"><HomeIcon className={styles.home}/></Link>
              <SavedMenu likable={true}/>
              <h1>{timetableGroup}</h1>
            </nav>
          </header>
          <main>
            sd
          </main> 
        </>
      : <Navigate to="/"/>}
    </>
  )
}

export default TimetablePage;