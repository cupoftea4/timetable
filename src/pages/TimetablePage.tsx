import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import DownloadIcon from '../assets/DownloadIcon';
import HomeIcon from '../assets/HomeIcon';
import LoadingIcon from '../assets/LoadingIcon';
import ExamsTimetable from '../components/ExamsTimetable';
import headerStyles from '../components/HeaderPanel.module.scss';
import SavedMenu from '../components/SavedMenu';
import Timetable from '../components/Timetable';
import TimetablePartials from '../components/TimetablePartials';
import Toggle from '../components/Toggle';
import useWindowDimensions from '../hooks/useWindowDimensions';
import { MOBILE_SCREEN_BREAKPOINT } from '../utils/constants';
import { getCurrentUADate, getNULPWeek } from '../utils/date';
import ISCFile from '../utils/ICSFile';
import * as handler from '../utils/requestHandler';
import TimetableManager from '../utils/TimetableManager';
import { ExamsTimetableItem, HalfTerm, TimetableItem, TimetableType } from '../utils/types';
import { optimisticRender } from '../utils/utils';
import LoadingPage from './LoadingPage';
import styles from './TimetablePage.module.scss';

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
  const [partials, setPartials] = useState<HalfTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const navigate = useNavigate();
  const timetableRef = useRef<HTMLElement>(null);

  const isLoading = isExamsTimetable ? !examsTimetable : !timetable;
  const time = TimetableManager.getCachedTime(group, isExamsTimetable);
  const timetableType = useMemo(() => TimetableManager.tryToGetType(group), [group]);
  const isLecturers = timetableType === 'lecturer';
  const isMobile = width < MOBILE_SCREEN_BREAKPOINT;

  useEffect(() => {
    if (!timetableType) {
      handler.error(`Group ${group} doesn't exist`, handler.NONEXISTING_GROUP);
      setTimetableGroup(null);
      return;
    } 
    if (timetableType === 'selective' && isExamsTimetable) navigate('/' + group);
    setTimetableGroup(group);
    setLoading(true);
    getTimetable(group, isExamsTimetable, timetableType).finally(() => setLoading(false));
  }, [group, isExamsTimetable, navigate, timetableType]);
  
  useEffect(() => {
    if (isExamsTimetable || !timetable) return;
    if (timetableRef.current) tryToScrollToCurrentDay(timetableRef.current, timetable);
  }, [isExamsTimetable, timetable]);

  function getTimetable(group: string, exams: boolean, type?: TimetableType, checkCache: boolean = true) {
    const onError = (e: string) => {
      handler.error(e);
      setTimetableGroup(null);
    };
    if (exams) 
      return optimisticRender(
        setExamsTimetable, onError, 
        TimetableManager.getExamsTimetable(group, type, checkCache)
      );

    const renderTimetable = (timetable: TimetableItem[], optimistic: boolean) => {
      setTimetable(t => {
        JSON.stringify(t) !== JSON.stringify(timetable) && setTimetable(timetable); 
        return t ?? timetable;
      });
      setIsSecondSubgroup(TimetableManager.getSubgroup(group) === 2);
      if (!optimistic && type === 'timetable') TimetableManager.getPartials(group).then(setPartials);
    };
    
    return optimisticRender(
      renderTimetable, onError, 
      TimetableManager.getTimetable(group, type, checkCache)
    );
  };

  const changeIsSecondSubgroup = (isSecond: boolean | ((isSecond: boolean) => boolean)) => {
    if (typeof isSecond === 'function') isSecond = isSecond(isSecondSubgroup);
    setIsSecondSubgroup(isSecond);
    TimetableManager.updateSubgroup(group, isSecond ? 2 : 1)
      ?.catch(e => handler.error(e, handler.UPDATE_SUBGROUP_ERROR));
  };

  const updateTimetable = (checkCache = false) => {
    if (loading) return;
    setLoading(true);
    getTimetable(group, isExamsTimetable, undefined, checkCache)
      .finally(() => setLoading(false));
  };

  const handleIsExamsTimetableChange = (isExams: boolean) => {
    navigate('/' + group + (isExams ? '/exams' : ''));
  };

  const getPartialTimetable = (partial: HalfTerm | 0) => {
    if (partial === 0) return updateTimetable(true);
    handler.promise(TimetableManager.getPartialTimetable(group, partial).then(setTimetable));
  };

  const icsFILE = useMemo(() => {
    let fileContent;
    if (!isExamsTimetable && timetable) {
      fileContent= ISCFile.fromTimetable(timetable, isSecondSubgroup ? 2 : 1, isSecondWeek ? 2 : 1);     
    } else if (isExamsTimetable && examsTimetable) {
      fileContent = ISCFile.fromExamsTimetable(examsTimetable);
    } else return;
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    return url; 
  }, [isSecondSubgroup, isSecondWeek, timetable, examsTimetable, isExamsTimetable]);

  return (
    <>
      {timetableGroup !== null ? 
        !isLoading ?
          <div className={styles.wrapper}>
            <header className={`${headerStyles.header} ${styles.header}`}>
              <nav className={headerStyles['right-buttons']}> 
                <Link to="/" aria-label="Home"><HomeIcon /></Link>
                <SavedMenu />
                <h1 className={styles.title}>{timetableGroup}</h1>
                {
                  timetableType !== 'selective' &&
                    <button
                      className={headerStyles.exams}
                      title={isExamsTimetable ? "Переключити на розклад пар" : "Переключити на розклад екзаменів"} 
                      onClick={() => handleIsExamsTimetableChange(!isExamsTimetable)}
                    >
                      {!isExamsTimetable ? "Екзамени" : "Пари"}
                    </button>
                }
                {
                  !isExamsTimetable && 
                    <TimetablePartials partials={partials} handlePartialClick={getPartialTimetable} />
                }
              </nav>
              <span className={styles.params}>
                {!isExamsTimetable &&
                    <>
                      {!isLecturers && 
                      <Toggle 
                        toggleState={[isSecondSubgroup, changeIsSecondSubgroup]} 
                        states={isMobile ? ["I підг.", "II підг."] : ["I підгрупа", "II підгрупа"]} />}
                      <Toggle 
                        toggleState={[isSecondWeek, setIsSecondWeek]} 
                        states={isMobile ? ["По чис.", "По знам."] : ['По чисельнику', 'По знаменнику']} />
                    </>
                }
              </span>
            </header>
            <main className={styles.container}>
              <section className={styles.timetable} ref={timetableRef}>
                {!isExamsTimetable 
                  ? <Timetable 
                      timetable={timetable ?? []} 
                      isSecondWeek={isSecondWeek} 
                      isSecondSubgroup={isSecondSubgroup}
                      cellSubgroup={isLecturers} 
                    /> 
                  : examsTimetable?.length === 0 
                        ? <p>Розклад екзаменів пустий</p>
                        : <ExamsTimetable exams={examsTimetable ?? []} /> 
                }
              </section>
            </main> 
            <footer className={styles.bottom}>
              <span>
                <button 
                  disabled={loading}
                  className={`${styles.update} ${loading && styles.loading}`} title='Оновити дані' 
                  onClick={() => updateTimetable()}
                >
                  <LoadingIcon/>
                </button>
                <a className={styles.download} title='Експортувати розклад для Google Calendar' href={icsFILE} 
                  download={isExamsTimetable ? `${group}-exams.ics` : `${group}-${isSecondSubgroup ? 2 : 1}.ics`}
                ><DownloadIcon/></a> 
              </span>
              {time && <p>Last updated {new Date(time).toLocaleString()}</p>}
            </footer>
          </div>       
        : <LoadingPage/>
      : <Navigate to="/"/>}
    </>
  )
};

export default TimetablePage;