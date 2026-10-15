import type React from "react";
import { type FC, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ArrowRightIcon from "@/assets/ArrowRightIcon";
import ExamIcon from "@/assets/ExamIcon";
import HomeIcon from "@/assets/HomeIcon";
import useExamsPublished from "@/hooks/useExamsPublished";
import useGroupParam from "@/hooks/useGroupParam";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import usePageTitle from "@/hooks/usePageTitle";
import Toggle from "@/shared/Toggle";
import { classes } from "@/styles/utils";
import type { CustomTimetable, HalfTerm, TimetableType } from "@/types/timetable";
import TimetableManager from "@/utils/data/TimetableManager";
import { getTimetableName, isMerged, isPartTimeType } from "@/utils/timetable";
import Toast from "@/utils/toasts";
import WeekNavigation from "../timetable/ui/WeekNavigation";
import SavedMenu from "./components/SavedMenu";
import ShareButton from "./components/ShareButton";
import ThemeButton from "./components/ThemeButton";
import TimetablePartials from "./components/TimetablePartials";
import generalStyles from "./HeaderPanel.module.scss";
import styles from "./TimetableHeader.module.scss";

type OwnProps = {
  loading: boolean;
  showSubgroupToggle: boolean;
  timetableType?: TimetableType;
  customTimetable?: CustomTimetable;
  editToken?: string;
  isExamsTimetable: boolean;
  partials: HalfTerm[];
  subgroupState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  weekState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  updatePartialTimetable: (partial: HalfTerm | 0) => void;
  availableWeeks?: Date[];
  selectedWeek?: Date;
  onWeekChange?: (week: Date) => void;
};

const TimetableHeader: FC<OwnProps> = ({
  timetableType,
  isExamsTimetable,
  showSubgroupToggle,
  customTimetable,
  editToken,
  partials,
  subgroupState,
  weekState,
  loading,
  updatePartialTimetable,
  availableWeeks,
  selectedWeek,
  onWeekChange,
}) => {
  const [isSecondSubgroup, setIsSecondSubgroup] = subgroupState;
  const [isSecondWeek, setIsSecondWeek] = weekState;
  const navigate = useNavigate();
  const { state }: { state: { examsFrom?: string } | null } = useLocation();
  const group = useGroupParam();
  const isMobile = useIsMobile();
  const isNarrow = useIsTablet();
  const examsPublished = useExamsPublished();
  const groupTitle = customTimetable?.name ?? (timetableType === "merged" ? "Мій розклад" : getTimetableName(group));
  usePageTitle(groupTitle);
  const titleRef = useRef<HTMLHeadingElement>(null);
  // On phones a title too long for one line wraps in a smaller font
  const [wrappedTitle, setWrappedTitle] = useState<string>();

  useLayoutEffect(() => {
    if (wrappedTitle === groupTitle) return;
    const wrapIfTooLong = () => {
      const title = titleRef.current;
      if (title && title.scrollWidth > title.clientWidth) setWrappedTitle(groupTitle);
    };
    wrapIfTooLong();
    void document.fonts.ready.then(wrapIfTooLong);
  }, [groupTitle, wrappedTitle]);

  const isPartTime = isPartTimeType(timetableType);
  const showWeekNavigation = isPartTime && availableWeeks && availableWeeks.length > 0 && selectedWeek && onWeekChange;

  const sources = isMerged(group) ? TimetableManager.cachedMergedTimetable?.timetables : customTimetable?.sourceNames;
  const examsGroup = sources
    ? sources.find((t) => {
        const type = TimetableManager.tryToGetType(t);
        return type === "timetable" || type === "lecturer";
      })
    : group;

  const handleIsExamsTimetableChange = (isExams: boolean) => {
    if (isExams) navigate(`/${examsGroup ?? group}/exams`, { state: { examsFrom: group } });
    else navigate(`/${state?.examsFrom ?? group}`);
  };

  const changeIsSecondSubgroup = (isSecond: boolean) => {
    setIsSecondSubgroup(isSecond);
    TimetableManager.updateSubgroup(group, isSecond ? 2 : 1)?.catch((e) => {
      Toast.error(e, Toast.UPDATE_SUBGROUP_ERROR);
    });
  };

  return (
    <header
      className={classes(
        generalStyles.header,
        styles.header,
        wrappedTitle === groupTitle && styles.wrapped,
        showWeekNavigation && styles.weekPicker
      )}
    >
      <nav className={classes(generalStyles["right-buttons"], styles.nav)}>
        <div className={classes("flex gap-1", styles.icons)}>
          {isNarrow ? (
            <ThemeButton />
          ) : (
            <>
              <Link
                state={{ force: true }}
                to="/home"
                aria-label="Home"
                type="button"
                className={classes("icon-button", "transition duration-300")}
              >
                <HomeIcon />
              </Link>
              <SavedMenu timetableChanged={loading} />
            </>
          )}
          {customTimetable && !isNarrow && (
            <ShareButton editToken={editToken} className={classes("icon-button", "transition duration-300")} />
          )}
        </div>
        <h1 ref={titleRef} className={styles.title}>
          {groupTitle}
          {isExamsTimetable && <span className={styles.mode}>Екзамени</span>}
        </h1>
      </nav>
      {!isExamsTimetable && (
        <span className={styles.controls}>
          {showWeekNavigation ? (
            <WeekNavigation weeks={availableWeeks} selectedWeek={selectedWeek} onWeekChange={onWeekChange} />
          ) : (
            <>
              {showSubgroupToggle && (
                <Toggle
                  toggleState={[isSecondSubgroup, changeIsSecondSubgroup]}
                  states={isMobile ? ["I підг.", "II підг."] : ["I підгрупа", "II підгрупа"]}
                />
              )}
              <Toggle
                toggleState={[isSecondWeek, setIsSecondWeek]}
                states={isMobile ? ["По чис.", "По знам."] : ["По чисельнику", "По знаменнику"]}
              />
            </>
          )}
          <TimetablePartials partials={partials} handlePartialClick={updatePartialTimetable} />
        </span>
      )}
      {examsGroup && timetableType !== "selective" && timetableType !== "postgraduate" && !isPartTime && (
        <span className={styles.actions}>
          <button
            type="button"
            className={classes(
              generalStyles.exams,
              isExamsTimetable && generalStyles.back,
              !isExamsTimetable && examsPublished && generalStyles.published
            )}
            title={
              isExamsTimetable
                ? "Повернутися до розкладу пар"
                : examsPublished
                  ? "Відкрити розклад екзаменів"
                  : "Відкрити розклад екзаменів (можливо, ще не опублікований)"
            }
            onClick={() => {
              handleIsExamsTimetableChange(!isExamsTimetable);
            }}
          >
            {isExamsTimetable ? (
              <>
                <ArrowRightIcon className={generalStyles.arrow} />
                {isMobile ? "Пари" : "Розклад пар"}
              </>
            ) : (
              <>
                <ExamIcon className={generalStyles["exam-icon"]} />
                {isMobile ? "Екзамени" : "Розклад екзаменів"}
                <ArrowRightIcon className={generalStyles.arrow} />
              </>
            )}
          </button>
        </span>
      )}
    </header>
  );
};

export default TimetableHeader;
