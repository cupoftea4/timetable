import { type FC, lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useTimetableISCFile from "@/features/footer/hooks/useTimetableISCFile";
import TimetableFooter from "@/features/footer/TimetableFooter";
import TimetableHeader from "@/features/header/TimetableHeader";
import ExamsTimetable from "@/features/timetable/ExamsTimetable";
import Timetable from "@/features/timetable/Timetable";
import useGroupParam from "@/hooks/useGroupParam";
import useGTagTimetableEvents from "@/hooks/useGTagTimetableEvents";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import { classes } from "@/styles/utils";
import type {
  CustomTimetable,
  CustomTimetableDraft,
  ExamsTimetableItem,
  HalfTerm,
  Semester,
  TimetableItem,
  TimetableType,
} from "@/types/timetable";
import type { RenderPromises } from "@/types/utils";
import { TIMETABLE_SCREEN_BREAKPOINT } from "@/utils/constants";
import { getDefaultCustomName, toCustomLessons, toTimetableItems } from "@/utils/customTimetable";
import { getCurrentSemester } from "@/utils/data/LPNUData";
import TimetableManager from "@/utils/data/TimetableManager";
import { getAvailableWeeks, getCurrentUADate, getCurrentWeek, isSecondNULPWeek } from "@/utils/date";
import { optimisticRender } from "@/utils/general";
import { CUSTOM_PREFIX } from "@/utils/timetable";
import Toast from "@/utils/toasts";
import styles from "./TimetablePage.module.scss";

const CreateMergedModal = lazy(() => import("@/features/merged_modal/CreateMergedModal"));
const TimetableEditor = lazy(() => import("@/features/editor/TimetableEditor"));

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

type LocationState = { source?: string; isCustom?: boolean; editFromView?: boolean };

const TimetablePage: FC<OwnProps> = ({ isExamsTimetable = false }) => {
  const group = useGroupParam();
  const isSecondNULPSubgroup = () => TimetableManager.getSubgroup(group) === 2;
  const [timetable, setTimetable] = useState<TimetableItem[]>();
  const [examsTimetable, setExamsTimetable] = useState<ExamsTimetableItem[]>();
  const [customTimetable, setCustomTimetable] = useState<CustomTimetable>();
  const [isSecondSubgroup, setIsSecondSubgroup] = useState(isSecondNULPSubgroup);
  const [isSecondWeek, setIsSecondWeek] = useState(isSecondNULPWeek);
  const [partials, setPartials] = useState<HalfTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMergedModal, setShowCreateMergedModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<Date | undefined>();
  const [semester, setSemester] = useState<Semester>();
  const { state, search }: { state: LocationState | null; search: string } = useLocation();
  const isEditing = new URLSearchParams(search).has("edit");
  const isDesktop = useWindowDimensions().width >= TIMETABLE_SCREEN_BREAKPOINT;
  // Starting from the saved draft avoids flashing the timetable before the editor on reload
  const [editor, setEditor] = useState(() =>
    isEditing && isDesktop ? TimetableManager.getCustomDraft(group) : undefined
  );

  const navigate = useNavigate();
  const timetableRef = useRef<HTMLElement>(null);

  const iscFile = useTimetableISCFile(
    (!isExamsTimetable && timetable) || (isExamsTimetable && examsTimetable),
    isSecondSubgroup
  );

  const isLoading = isExamsTimetable ? !examsTimetable : !timetable;
  const time = TimetableManager.getCachedTime(group, isExamsTimetable);
  const timetableType = useMemo(() => TimetableManager.tryToGetType(group), [group]);
  const hasCellSubgroups = timetableType === "lecturer" || customTimetable?.subgroupToggle === false;
  const editToken = customTimetable && TimetableManager.getCustomEditToken(customTimetable.id);
  const isEditable = isDesktop && !isExamsTimetable && timetableType !== "parttime";
  const canEdit = isEditable && Boolean(timetable);
  const editTitle = editToken
    ? "Редагувати розклад"
    : customTimetable
      ? "Створити копію розкладу для редагування"
      : "Створити змінену версію розкладу";

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
    if (type === "custom") {
      const renderCustomTimetable = (timetable: CustomTimetable, optimistic: boolean) => {
        setCustomTimetable(timetable);
        renderTimetable(toTimetableItems(timetable.lessons), optimistic);
      };
      const onCustomError = (e: string) => onError(e, e === Toast.NONEXISTING_TIMETABLE ? e : undefined);
      return optimisticRender(renderCustomTimetable, onCustomError, TimetableManager.getCustomTimetable(group));
    }
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

  function createEditor(): CustomTimetableDraft {
    if (customTimetable) {
      const { id, name, subgroupToggle, lessons, sourceNames } = customTimetable;
      const start = { name: editToken ? name : `${name.slice(0, 52)} (копія)`, subgroupToggle, lessons };
      const saved = editToken ? { id, editToken } : undefined;
      return { group, timetable: start, draft: start, sourceNames, saved };
    }
    const sourceNames =
      timetableType === "merged" ? (TimetableManager.cachedMergedTimetable?.timetables ?? []) : [group];
    const start = {
      name: getDefaultCustomName(sourceNames),
      subgroupToggle: timetableType !== "lecturer",
      lessons: toCustomLessons(timetable ?? []),
    };
    return { group, timetable: start, draft: start, sourceNames };
  }

  // Edit mode lives in the url (?edit), so going back leaves it and a reload keeps it. The draft is kept
  // until cancel, save or delete, so reopening the editor continues it.
  useEffect(() => {
    if (!isEditing || !isEditable) setEditor(undefined);
    else if (!editor) setEditor(TimetableManager.getCustomDraft(group) ?? (timetable && createEditor()));
  });

  function exitEditMode() {
    // Return to the entry the editor was opened from instead of stacking another one on top
    if (state?.editFromView) navigate(-1);
    else navigate({ search: "" }, { replace: true, state });
  }

  function closeEditor() {
    TimetableManager.saveCustomDraft(null);
    exitEditMode();
  }

  async function onEditorSaved(saved: CustomTimetable) {
    // A new custom timetable keeps the subgroup selected in the one it was made from
    await TimetableManager.saveCustomLocally(CUSTOM_PREFIX + saved.id, saved, isSecondSubgroup ? 2 : 1);
    if (group === CUSTOM_PREFIX + saved.id) {
      closeEditor();
      updateTimetable();
      return;
    }
    TimetableManager.saveCustomDraft(null);
    navigate(`/${CUSTOM_PREFIX}${saved.id}`, { replace: true });
  }

  function renderTimetableFromPromises(promises: RenderPromises<TimetableItem[]>) {
    optimisticRender(
      (timetable: TimetableItem[]) => {
        setTimetable(timetable);
      },
      onError,
      promises
    );
  }

  if (isEditing && !isDesktop) {
    return (
      <div className={classes(styles.wrapper, styles.editNotice)}>
        <h2>Редагування доступне лише на широкому екрані</h2>
        <p>Відкрийте цей розклад на комп'ютері або розширте вікно браузера.</p>
        <button type="button" onClick={exitEditMode}>
          Повернутися до розкладу
        </button>
      </div>
    );
  }

  if (isEditing && editor) {
    return (
      <div className={styles.wrapper}>
        <Suspense fallback={null}>
          <TimetableEditor
            {...editor}
            subgroup={isSecondSubgroup ? 2 : 1}
            onCancel={closeEditor}
            onSaved={onEditorSaved}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <TimetableHeader
        isExamsTimetable={isExamsTimetable}
        timetableType={timetableType}
        hasCellSubgroups={hasCellSubgroups}
        customTimetable={customTimetable}
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
                hasCellSubgroups={hasCellSubgroups}
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
        customTimetable={customTimetable}
        onEdit={canEdit ? () => navigate({ search: "?edit" }, { state: { ...state, editFromView: true } }) : undefined}
        editTitle={editTitle}
      />
      {showCreateMergedModal && (
        <Suspense fallback={null}>
          <CreateMergedModal
            defaultTimetable={group}
            onClose={() => {
              setShowCreateMergedModal(false);
            }}
            showTimetable={renderTimetableFromPromises}
          />
        </Suspense>
      )}
    </div>
  );
};

// A fresh page per timetable, so state and late responses from the previous one don't leak into it
const TimetablePageRoute: FC<OwnProps> = (props) => <TimetablePage key={useGroupParam()} {...props} />;

export default TimetablePageRoute;
