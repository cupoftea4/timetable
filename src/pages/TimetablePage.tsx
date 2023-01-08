import { FC, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import LoadingPage from './LoadingPage';
import headerStyles from '../components/HeaderPanel.module.scss';
import Timetable from '../components/Timetable';
import SavedMenu from '../components/SavedMenu';
import Toggle from '../components/Toggle';
import TimetableManager from '../utils/TimetableManager';
import { ExamsTimetableItem, TimetableItem, TimetableType } from '../utils/types';
import HomeIcon from '../assets/HomeIcon';
import styles from './TimetablePage.module.scss';
import { getCurrentUADate, getNULPWeek } from '../utils/date';
import * as handler from '../utils/requestHandler';
import ExamsTimetable from '../components/ExamsTimetable';

const tryToScrollToCurrentDay = (el: HTMLElement, timetable: TimetableItem[]) => { // yeah, naming! :)
  const width = el.getBoundingClientRect().width;
  const currentDay = getCurrentUADate().getDay() || 7; // 0 - Sunday
  const inTimetable = timetable?.some(({day}) => Math.max(day, 5) >= currentDay);
  if (inTimetable) {
      el.scrollTo((currentDay - 1) * width, 0);
  }
};

type OwnProps = {
  isExamsTimetable?: boolean;
}

const TimetablePage: FC<OwnProps> = ({isExamsTimetable = false}) => {
  const group = useParams().group?.trim() ?? "";

  const isSecondNULPSubgroup = () => TimetableManager.getSubgroup(group) === 2;
  const isSecondNULPWeek = () => getNULPWeek() % 2 === 0;

  const [timetableGroup, setTimetableGroup] = useState<string | null>();
  const [timetable, setTimetable] = useState<TimetableItem[]>();
  const [examsTimetable, setExamsTimetable] = useState<ExamsTimetableItem[]>();
  const [isSecondSubgroup, setIsSecondSubgroup] = useState(isSecondNULPSubgroup); 
  const [isSecondWeek, setIsSecondWeek] = useState(isSecondNULPWeek);
  const navigate = useNavigate();
  const timetableRef = useRef<HTMLElement>(null);

  const isLoading = isExamsTimetable ? !examsTimetable : !timetable;
  const time = TimetableManager.getCachedTime(group);
    
  const getTimetable = (group: string, exams: boolean, type?: TimetableType, checkCache: boolean = true) => {
    const onCatch = (e: string) => {
      handler.handleError(e);
      setTimetableGroup(null);
    };
    if (exams) return TimetableManager.getExamsTimetable(group, type, checkCache)
        .then(setExamsTimetable).catch(onCatch);

    return TimetableManager.getTimetable(group, type, checkCache).then(data => {
        setTimetable(data);
        setIsSecondSubgroup(TimetableManager.getSubgroup(group) === 2);
      }).catch(onCatch);
  };

  useEffect(
    () => {
      const type = TimetableManager.tryToGetType(group);
      if (!type) {
        handler.handleError(`Group ${group} doesn't exist`, handler.NONEXISTING_GROUP);
        setTimetableGroup(null);
        return;
      }  
      // selective group doesn't have exams timetable
      if (type === 'selective' && isExamsTimetable) navigate('/' + group);
      setTimetableGroup(group);
      handler.handlePromise(getTimetable(group, isExamsTimetable, type));
    }, [group, isExamsTimetable, navigate]);
  
  useEffect(() => {
    if (isExamsTimetable || !timetable) return;
    if (timetableRef.current) tryToScrollToCurrentDay(timetableRef.current, timetable);
  }, [isExamsTimetable, timetable]);

  const changeIsSecondSubgroup = (isSecond: boolean | ((isSecond: boolean) => boolean)) => {
    if (typeof isSecond === 'function') isSecond = isSecond(isSecondSubgroup);
    setIsSecondSubgroup(isSecond);
    TimetableManager.updateSubgroup(group, isSecond ? 2 : 1)
      ?.catch(e => handler.handleError(e, handler.UPDATE_SUBGROUP_ERROR));
  };

  const updateTimetable = (checkCache = false) => {
    handler.handlePromise(getTimetable(group, isExamsTimetable, undefined, checkCache));
  };

  const handleIsExamsTimetableChange = (isExams: boolean) => {
    navigate('/' + group + (isExams ? '/exams' : ''));
  };

  return (
    <>
      {timetableGroup !== null ? 
        !isLoading ?
          <>
            <header className={headerStyles.header}>
              <nav className={headerStyles['right-buttons']}> 
                <Link to="/"><HomeIcon className={headerStyles.home}/></Link>
                <SavedMenu likable={true}/>
                <h1>{timetableGroup}</h1>
                {
                  // selective or lecturer groups don't have exams timetable
                  TimetableManager.ifTimetableExists(group) !== 'selective' &&
                    <button
                      className={headerStyles.exams}
                      title={isExamsTimetable ? "Переключити на розклад пар" : "Переключити на розклад екзаменів"} 
                      onClick={() => handleIsExamsTimetableChange(!isExamsTimetable)}
                    >
                      {isExamsTimetable ? "Екзамени" : "Пари"}
                    </button>
                }
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
              </span>
            </header>
            <main className={styles.container}>
              <section className={styles.timetable} ref={timetableRef}>
                {!isExamsTimetable ?
                    <Timetable 
                      timetable={timetable ?? []} 
                      isSecondWeek={isSecondWeek} 
                      isSecondSubgroup={isSecondSubgroup} 
                    /> :
                    <ExamsTimetable exams={examsTimetable ?? []} /> 
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