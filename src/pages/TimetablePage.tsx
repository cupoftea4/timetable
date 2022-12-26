import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import LoadingPage from './LoadingPage';
import headerStyles from '../components/HeaderPanel.module.scss';
import Timetable from '../components/Timetable';
import SavedMenu from '../components/SavedMenu';
import Toggle from '../components/Toggle';
import TimetableManager from '../utils/TimetableManager';
import { ExamsTimetableItem, TimetableItem } from '../utils/types';
import HomeIcon from '../assets/HomeIcon';
import styles from './TimetablePage.module.scss';
import { getNULPWeek } from '../utils/date';
import * as handler from '../utils/requestHandler';
import ExamsIcon from '../assets/ExamsIcon';
import FilledExamsIcon from '../assets/FilledExamsIcon';
import ExamsTimetable from '../components/ExamsTimetable';


const TimetablePage = () => {
  const group = useParams().group?.trim() ?? "";

  const isSecondNULPSubgroup = () => TimetableManager.getSubgroup(group) === 2;
  const isSecondNULPWeek = () => getNULPWeek() % 2 === 0;

  const [timetableGroup, setTimetableGroup] = useState<string | null>();
  const [timetable, setTimetable] = useState<TimetableItem[]>();
  const [examsTimetable, setExamsTimetable] = useState<ExamsTimetableItem[]>([]);
  const [isSecondSubgroup, setIsSecondSubgroup] = useState(isSecondNULPSubgroup); 
  const [isSecondWeek, setIsSecondWeek] = useState(isSecondNULPWeek);

  const [isExamsTimetable, setIsExamsTimetable] = useState(false);

  const time = TimetableManager.getCachedTime(group);

  const getTimetable = (group: string, exams: boolean, checkCache: boolean = true) => {
    const onCatch = (e: string) => {
      handler.handleError(e);
      setTimetableGroup(null);
    };
    if (exams) {
      return TimetableManager.getExamsTimetable(group, checkCache)
        .then(setExamsTimetable)
        .catch(onCatch);
    } else {
      return TimetableManager.getTimetable(group, checkCache)
        .then(data => {
          setTimetable(data);
          setIsSecondSubgroup(TimetableManager.getSubgroup(group) === 2);
        }).catch(onCatch);
    }
  };

  const initGroup = async (group: string) => {
    if (!TimetableManager.isInited()) await TimetableManager.init();
    if (!TimetableManager.ifGroupExists(group)) {
      handler.handleError(`Group ${group} doesn't exist`, handler.NONEXISTING_GROUP);
      setTimetableGroup(null);
      return;
    }  
    setTimetableGroup(group);
  };

  useEffect(
    () => {
      initGroup(group).then(() => {
        handler.handlePromise(getTimetable(group, isExamsTimetable));
      }).catch(handler.handleError);
    }, [group, isExamsTimetable]);

  const changeIsSecondSubgroup = (isSecond: boolean | ((isSecond: boolean) => boolean)) => {
    if (typeof isSecond === 'function') isSecond = isSecond(isSecondSubgroup);
    setIsSecondSubgroup(isSecond);
    TimetableManager.updateSubgroup(group, isSecond ? 2 : 1)
      ?.catch(e => handler.handleError(e, handler.UPDATE_SUBGROUP_ERROR));
  }

  const updateTimetable = (checkCache = false) => {
    handler.handlePromise(getTimetable(group, isExamsTimetable, checkCache));
  };

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
                {!isExamsTimetable &&
                    <>
                      <Toggle 
                        toggleState={[isSecondSubgroup, changeIsSecondSubgroup]} 
                        states={["I підгрупа", "II підгрупа"]} />
                      <Toggle 
                        toggleState={[isSecondWeek, setIsSecondWeek]} 
                        states={['По чисельнику', 'По знаменнику']} />
                    </>
                }
                <button 
                    className={styles.cr69} 
                    title={isExamsTimetable ? "Розклад пар" : "Розклад екзаменів"} 
                    onClick={() => setIsExamsTimetable(!isExamsTimetable)}
                >
                  {isExamsTimetable ? <FilledExamsIcon /> : <ExamsIcon />}
                </button>
              </span>
            </header>
            <main className={styles.container}>
              <section className={styles.timetable}>
                {!isExamsTimetable ?
                    <Timetable 
                      timetable={timetable} 
                      isSecondWeek={isSecondWeek} 
                      isSecondSubgroup={isSecondSubgroup} 
                    /> :
                    <ExamsTimetable exams={examsTimetable} /> 
                }
              </section>
            </main> 
            <footer className={styles.update}>
              <button onClick={() => updateTimetable()}>Оновити</button>
              {time && <p>Востаннє {new Date(time).toLocaleString()}</p>}
            </footer>
          </>       
        : <LoadingPage/>
      : <Navigate to="/"/>}
      
    </>
  )
};

export default TimetablePage;