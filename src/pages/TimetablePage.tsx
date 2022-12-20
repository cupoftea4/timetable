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
import * as errors from '../utils/errorHandling';

const TimetablePage = () => {
  const group = useParams().group?.trim();

  const isSecondNULPSubgroup = () => TimetableManager.getSubgroup(group) === 2;
  const isSecondNULPWeek = () => getNULPWeek() % 2 === 0;

  const [timetableGroup, setTimetableGroup] = useState<string | null>();
  const [timetable, setTimetable] = useState<TimetableItem[]>();
  const [isSecondSubgroup, setIsSecondSubgroup] = useState(isSecondNULPSubgroup); 
  const [isSecondWeek, setIsSecondWeek] = useState(isSecondNULPWeek);

  useEffect(
    () => {
      if (!group) {
        setTimetableGroup(null);
        return;
      }
      
      if (!TimetableManager.ifGroupExists(group)) {
        errors.handleError(`Group ${group} doesn't exist`, errors.NONEXISTING_GROUP);
        setTimetableGroup(null);
        return;
      }  
      setTimetableGroup(group.toUpperCase().trim());
      TimetableManager.getTimetable(group).then(
          (data) => {
            setTimetable(data);
            setIsSecondSubgroup(TimetableManager.getSubgroup(group) === 2);
          })
        .catch((e) => {
          errors.handleError(e);
          setTimetableGroup(null);
        });
    }, [group]);

  const changeIsSecondSubgroup = (isSecond: boolean | ((isSecond: boolean) => boolean)) => {
    if (typeof isSecond === 'function') isSecond = isSecond(isSecondSubgroup);
    setIsSecondSubgroup(isSecond);
    TimetableManager.updateSubgroup(group, isSecond ? 2 : 1)
      ?.catch((e) => errors.handleError(e, errors.UPDATE_SUBGROUP_ERROR));
  }

  return (
    <>
      {timetableGroup !== null ? 
        timetable !== undefined  ?
          <>
            <header className={headerStyles.header}>
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
            <main className={styles.container}>
              <section className={styles.timetable}>
                <Timetable 
                  timetable={timetable} 
                  isSecondWeek={isSecondWeek} 
                  isSecondSubgroup={isSecondSubgroup} 
                />
              </section>
            </main> 
          </>       
        : <LoadingPage/>
      : <Navigate to="/"/>}
      
    </>
  )
};

export default TimetablePage;