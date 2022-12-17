import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import LoadingPage from './LoadingPage';
import headerStyles from '../components/HeaderPanel.module.scss';
import Timetable from '../components/Timetable';
import SavedMenu from '../components/SavedMenu';
import Toggle from '../components/Toggle';
import TimetableManager from '../utils/TimetableManager';
import { TimetableItem } from '../utils/types';
import HomeIcon from '../assets/HomeIcon';
import styles from './TimetablePage.module.scss';
import { getNULPWeek } from '../utils/date';

const TimetablePage = () => {
  const group = useParams().group?.toUpperCase().trim();

  const isSecondNULPSubgroup = () => TimetableManager.getSubgroup(group) === 2;
  const isSecondNULPWeek = () => getNULPWeek() % 2 === 0;

  const [timetableGroup, setTimetableGroup] = useState<string | null>();
  const [timetable, setTimetable] = useState<TimetableItem[]>();
  const [isSecondSubgroup, setIsSecondSubgroup] = useState(isSecondNULPSubgroup); 
  const [isSecondWeek, setIsSecondWeek] = useState(isSecondNULPWeek);

  useEffect(
    () => {
      if (group && TimetableManager.ifGroupExists(group)) {        
        setTimetableGroup(group.toUpperCase().trim());
        TimetableManager.getTimetable(group).then(
          (data) => {
            setTimetable(data);
            setIsSecondSubgroup(TimetableManager.getSubgroup(group) === 2);
          }
        ).catch((err) =>  {
          setTimetableGroup(null);
          console.error(err);
        });
      } else {
        setTimetableGroup(null);
      }
    }, [group]);

  const changeIsSecondSubgroup = (isSecond: boolean | ((isSecond: boolean) => boolean)) => {
    if (typeof isSecond === 'function') isSecond = isSecond(isSecondSubgroup);
    setIsSecondSubgroup(isSecond);
    TimetableManager.updateSubgroup(group, isSecond ? 2 : 1);
  }

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
                  toggleState={[isSecondSubgroup, changeIsSecondSubgroup]} 
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