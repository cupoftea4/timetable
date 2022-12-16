import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import HomeIcon from '../assets/HomeIcon';
import SavedMenu from '../components/SavedMenu';
import TimetableManager from '../utils/TimetableManager';
import headerStyles from '../components/HeaderPanel.module.scss';
import { TimetableItem } from '../utils/types';
import LoadingPage from './LoadingPage';
import Timetable from '../components/Timetable';
import styles from './TimetablePage.module.scss';
import Toggle from '../components/Toggle';

const TimetablePage = () => {
  const group = useParams().group?.toUpperCase().trim();
  const [timetableGroup, setTimetableGroup] = useState<string | null>();
  const [timetable, setTimetable] = useState<TimetableItem[]>();
  const [isSecondSubgroup, setIsSecondSubgroup] = useState(false); 
  const [isSecondWeek, setIsSecondWeek] = useState(false);

  // useEffect(() => {
  //   if (timetableGroup) {
  //     console.log(TimetableManager.getCachedTimetables());
  //   }
  // }, [timetableGroup]);

  useEffect(
    () => {
      if (group && TimetableManager.ifGroupExists(group)) {        
        setTimetableGroup(group.toUpperCase().trim());
        TimetableManager.getTimetable(group).then(
          (data) => {
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
              <nav className={headerStyles['nav-buttons']}> 
                <Link to="/"><HomeIcon className={headerStyles.home}/></Link>
                <SavedMenu likable={true}/>
                <h1>{timetableGroup}</h1>
              </nav>
              <span className={styles.params}>
                <Toggle 
                  toggleState={[isSecondSubgroup, setIsSecondSubgroup]} 
                  states={["I підгрупа", "II підгрупа"]} />
                <Toggle 
                  toggleState={[isSecondWeek, setIsSecondWeek]} 
                  states={['По чисельнику', 'По знаменнику']} />
              </span>
            </header>
            <main>
              <Timetable 
                timetable={timetable} 
                isSecondWeek={isSecondWeek} 
                isSecondSubgroup={isSecondSubgroup} 
              />
            </main> 
          </>       
        : <LoadingPage/>
      : <Navigate to="/"/>}
    </>
  )
};

export default TimetablePage;