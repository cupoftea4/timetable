import { type FC, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useTimetableISCFile from "@/features/footer/hooks/useTimetableISCFile";
import TimetableFooter from "@/features/footer/TimetableFooter";
import TimetableHeader from "@/features/header/TimetableHeader";
import CreateMergedModal from "@/features/merged_modal/CreateMergedModal";
import ExamsTimetable from "@/features/timetable/ExamsTimetable";
import Timetable from "@/features/timetable/Timetable";
import useGTagTimetableEvents from "@/hooks/useGTagTimetableEvents";
import type { ExamsTimetableItem, HalfTerm, Semester, TimetableItem, TimetableType } from "@/types/timetable";
import type { RenderPromises } from "@/types/utils";
import { getCurrentSemester } from "@/utils/data/LPNUData";
import TimetableManager from "@/utils/data/TimetableManager";
import { getAvailableWeeks, getCurrentUADate, getCurrentWeek, getNULPWeek } from "@/utils/date";
import { optimisticRender } from "@/utils/general";
import Toast from "@/utils/toasts";
import styles from "./TimetablePage.module.scss";

const tryToScrollToCurrentDay = (el: HTMLElement, timetable: TimetableItem[]) => {
  // yeah, naming! :)
  const width = el.getBoundingClientRect().width;
  const currentDay = getCurrentUADate().getDay() || 7; // 0 - Sunday
  const inTimetable = timetable?.some(({ day }) => Math.max(day, 5) >= currentDay);
  if (inTimetable) {
    el.scrollTo((currentDay - 1) * width, 0);
  }
};

type OwnProps = {
  isExamsTimetable?: boolean;
};

const TimetablePage: FC<OwnProps> = ({ isExamsTimetable = false }) => {
  const group = useParams().group?.trim() ?? "";
  const isSecondNULPSubgroup = () => TimetableManager.getSubgroup(group) === 2;
  const isSecondNULPWeek = () => getNULPWeek() % 2 === 0;
  const [timetable, setTimetable] = useState<TimetableItem[]>();
  const [examsTimetable, setExamsTimetable] = useState<ExamsTimetableItem[]>();
  const [isSecondSubgroup, setIsSecondSubgroup] = useState(isSecondNULPSubgroup);
  const [isSecondWeek, setIsSecondWeek] = useState(isSecondNULPWeek);
  const [partials, setPartials] = useState<HalfTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMergedModal, setShowCreateMergedModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<Date | undefined>();
  const [semester, setSemester] = useState<Semester>();

  const navigate = useNavigate();
  const timetableRef = useRef<HTMLElement>(null);

  const iscFile = useTimetableISCFile(
    (!isExamsTimetable && timetable) || (isExamsTimetable && examsTimetable),
    isSecondSubgroup,
    isSecondWeek
  );

  const isLoading = isExamsTimetable ? !examsTimetable : !timetable;
  const time = TimetableManager.getCachedTime(group, isExamsTimetable);
  const timetableType = useMemo(() => TimetableManager.tryToGetType(group), [group]);
  const isLecturers = timetableType === "lecturer";

  useEffect(() => {
    void getCurrentSemester().then(setSemester);
  }, []);

  const availableWeeks = useMemo(() => {
    if (timetableType === "parttime" && timetable) {
      const weeks = getAvailableWeeks(timetable);

      if (weeks.length > 0 && !selectedWeek) {
        const currentWeek = getCurrentWeek(weeks);
        if (currentWeek) {
          setSelectedWeek(currentWeek);
        }
      }

      return weeks;
    }
    return [];
  }, [timetableType, timetable, selectedWeek]);

  const { state }: { state: { source: string; isCustom?: boolean } | null } = useLocation();
  const { source, isCustom } = state ?? {};

  useGTagTimetableEvents(group, source ?? "url", isCustom);

  function onError(e: string, userError?: string) {
    if (isExamsTimetable) {
      Toast.error(e, userError ?? Toast.NO_EXAMS);
      navigate(`/${group}`, { state: { source: "no-exams" } });
      return;
    }
    Toast.error(e, userError);
    navigate("/home");
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: I don't actually remember why but I don't want to break it
  useEffect(() => {
    if (!timetableType) {
      onError(`Group ${group} doesn't exist`, Toast.NONEXISTING_GROUP);
      return;
    }
    if (timetableType === "selective" && isExamsTimetable)
      navigate(`/${group}`, { state: { source: "no-selective-exams" } });
    setLoading(true);
    setSelectedWeek(undefined);
    getTimetable(group, isExamsTimetable, timetableType)?.finally(() => {
      setLoading(false);
    });
    TimetableManager.updateLastOpenedTimetable(group, isExamsTimetable ? "exams" : "timetable");
  }, [group, isExamsTimetable, navigate, timetableType]);

  useEffect(() => {
    if (isExamsTimetable || !timetable) return;
    if (timetableRef.current) tryToScrollToCurrentDay(timetableRef.current, timetable);
  }, [isExamsTimetable, timetable]);

  function getTimetable(group: string, exams: boolean, type?: TimetableType, checkCache = true) {
    if (exams) {
      return optimisticRender(setExamsTimetable, onError, TimetableManager.getExamsTimetable(group, type, checkCache));
    }

    const renderTimetable = (timetable: TimetableItem[], optimistic: boolean) => {
      setTimetable((t) => (JSON.stringify(t) !== JSON.stringify(timetable) ? timetable : t));
      setIsSecondSubgroup(TimetableManager.getSubgroup(group) === 2);
      if (!optimistic && type === "timetable") TimetableManager.getPartials(group).then(setPartials);
    };
    try {
      return optimisticRender(renderTimetable, onError, TimetableManager.getTimetable(group, type, checkCache));
    } catch (_e) {
      console.error(_e);
      onError(Toast.NONEXISTING_TIMETABLE);
    }
  }

  const getPartialTimetable = (partial: HalfTerm | 0) => {
    if (partial === 0) {
      updateTimetable(true);
      return;
    }
    // TODO: remove partial timetables or fix them
    // Toast.promise(TimetableManager.getPartialTimetable(group, partial).then(setTimetable));
  };

  const updateTimetable = (checkCache = false) => {
    if (loading) return;
    setLoading(true);
    getTimetable(group, isExamsTimetable, timetableType, checkCache)?.finally(() => {
      setLoading(false);
    });
  };

  function renderTimetableFromPromises(promises: RenderPromises<TimetableItem[]>) {
    optimisticRender(
      (timetable: TimetableItem[]) => {
        setTimetable(timetable);
      },
      onError,
      promises
    );
  }

  return (
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
        availableWeeks={availableWeeks}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
      />
      <main className={styles.container}>
        <div className={styles.timetableWrapper}>
          <section className={styles.timetable} ref={timetableRef}>
            {!isExamsTimetable ? (
              <Timetable
                timetable={timetable ?? []}
                isSecondWeek={isSecondWeek}
                isSecondSubgroup={isSecondSubgroup}
                hasCellSubgroups={isLecturers}
                isLoading={isLoading}
                timetableType={timetableType}
                selectedWeek={selectedWeek}
              />
            ) : examsTimetable?.length === 0 ? (
              <p>Розклад екзаменів пустий</p>
            ) : (
              <ExamsTimetable exams={examsTimetable ?? []} isLoading={isLoading} />
            )}
          </section>
          {semester && <p className={styles.semester}>{semester}-й семестр</p>}
        </div>
      </main>
      <TimetableFooter
        showCreateMergedModal={() => {
          setShowCreateMergedModal(true);
        }}
        loading={loading}
        updateTimetable={updateTimetable}
        isExamsTimetable={isExamsTimetable}
        isSecondSubgroup={isSecondSubgroup}
        icsFILE={iscFile}
        time={time}
      />
      {showCreateMergedModal && (
        <CreateMergedModal
          defaultTimetable={group}
          onClose={() => {
            setShowCreateMergedModal(false);
          }}
          showTimetable={renderTimetableFromPromises}
        />
      )}
    </div>
  );
};

export default TimetablePage;
