import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import LoadingPage from './LoadingPage';
import TimetableHeader from '@/features/header/TimetableHeader';
import ExamsTimetable from '@/features/timetable/ExamsTimetable';
import Timetable from '@/features/timetable/Timetable';
import TimetableFooter from '@/features/footer/TimetableFooter'
import CreateMergedModal from '@/features/merged_modal/CreateMergedModal';
import useTimetableISCFile from '@/features/footer/hooks/useTimetableISCFile';
import Toast from '@/utils/toasts';
import { optimisticRender } from '@/utils/general';
import TimetableManager from '@/utils/data/TimetableManager';
import { getCurrentUADate, getNULPWeek } from '@/utils/date';
import { ExamsTimetableItem, HalfTerm, TimetableItem, TimetableType } from '@/utils/types';
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
  const [showCreateMergedModal, setShowCreateMergedModal] = useState(false);
  
  const navigate = useNavigate();
  const timetableRef = useRef<HTMLElement>(null);

  const iscFile = useTimetableISCFile(
    (!isExamsTimetable && timetable) || (isExamsTimetable && examsTimetable), 
    isSecondSubgroup, isSecondWeek
  ); 

  const isLoading = isExamsTimetable ? !examsTimetable : !timetable;
  const time = TimetableManager.getCachedTime(group, isExamsTimetable);
  const timetableType = useMemo(() => TimetableManager.tryToGetType(group), [group]);
  const isLecturers = timetableType === 'lecturer';
  

  function onError(e: string, userError?: string) {
    Toast.error(e);
    setTimetableGroup(null);
  };

  useEffect(() => {
    if (!timetableType) {
      onError(`Group ${group} doesn't exist`, Toast.NONEXISTING_GROUP);
      return;
    } 
    if (timetableType === 'selective' && isExamsTimetable) navigate('/' + group);
    setTimetableGroup(group);
    setLoading(true);
    getTimetable(group, isExamsTimetable, timetableType)?.finally(() => setLoading(false));
    TimetableManager.updateLastOpenedTimetable(group);
  }, [group, isExamsTimetable, navigate, timetableType]);
  
  useEffect(() => {
    if (isExamsTimetable || !timetable) return;
    if (timetableRef.current) tryToScrollToCurrentDay(timetableRef.current, timetable);
  }, [isExamsTimetable, timetable]);

  function getTimetable(group: string, exams: boolean, type?: TimetableType, checkCache: boolean = true) {
    if (exams) 
      return optimisticRender(
        setExamsTimetable, onError, 
        TimetableManager.getExamsTimetable(group, type, checkCache)
      );

    const renderTimetable = (timetable: TimetableItem[], optimistic: boolean) => {
      setTimetable(t =>  JSON.stringify(t) !== JSON.stringify(timetable) ? timetable : t);
      setIsSecondSubgroup(TimetableManager.getSubgroup(group) === 2);
      if (!optimistic && type === 'timetable') TimetableManager.getPartials(group).then(setPartials);
    };
    try {
      return optimisticRender(
        renderTimetable, onError, 
        TimetableManager.getTimetable(group, type, checkCache)
      );
    } catch (e) {
      onError(Toast.NONEXISTING_TIMETABLE);
    }
  };

  const getPartialTimetable = (partial: HalfTerm | 0) => {
    if (partial === 0) return updateTimetable(true);
    Toast.promise(TimetableManager.getPartialTimetable(group, partial).then(setTimetable));
  };

  const updateTimetable = (checkCache = false) => {
    if (loading) return;
    setLoading(true);
    getTimetable(group, isExamsTimetable, timetableType, checkCache)
      ?.finally(() => setLoading(false));
  };

  return (
    <>
      {timetableGroup !== null ? 
        !isLoading ?
          <div className={styles.wrapper}>
            <TimetableHeader 
              isExamsTimetable={isExamsTimetable}
              timetableType={timetableType}
              isLecturers={isLecturers}
              partials={partials}
              subgroupState={[isSecondSubgroup, setIsSecondSubgroup]}
              weekState={[isSecondWeek, setIsSecondWeek]}
              updatePartialTimetable={getPartialTimetable}
              loading={loading}
             />
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
            <TimetableFooter 
              showCreateMergedModal={() => setShowCreateMergedModal(true)} 
              loading={loading} 
              updateTimetable={updateTimetable} 
              isExamsTimetable={isExamsTimetable} 
              isSecondSubgroup={isSecondSubgroup} 
              icsFILE={iscFile}
              time={time} 
            />
            {showCreateMergedModal &&
              <CreateMergedModal 
                defaultTimetable={group} 
                onClose={() => setShowCreateMergedModal(false)}
              />
            }
          </div>       
        : <LoadingPage/>
      : <Navigate to="/" state={{force: true}}/>}
    </>
  )
};

export default TimetablePage;