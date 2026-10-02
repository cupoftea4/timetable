import type React from "react";
import type { FC } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "@/assets/HomeIcon";
import ShareIcon from "@/assets/ShareIcon";
import useGroupParam from "@/hooks/useGroupParam";
import usePageTitle from "@/hooks/usePageTitle";
import { useIsMobile } from "@/hooks/useWindowDimensions";
import Toggle from "@/shared/Toggle";
import { classes } from "@/styles/utils";
import type { CustomTimetable, HalfTerm } from "@/types/timetable";
import TimetableManager from "@/utils/data/TimetableManager";
import { getTimetableName, isMerged } from "@/utils/timetable";
import Toast from "@/utils/toasts";
import WeekNavigation from "../timetable/ui/WeekNavigation";
import SavedMenu from "./components/SavedMenu";
import TimetablePartials from "./components/TimetablePartials";
import TimetableViewSelect from "./components/TimetableViewSelect";
import generalStyles from "./HeaderPanel.module.scss";
import styles from "./TimetableHeader.module.scss";

type OwnProps = {
  loading: boolean;
  hasCellSubgroups: boolean;
  timetableType?: string;
  customTimetable?: CustomTimetable;
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
  hasCellSubgroups,
  customTimetable,
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
  const groupTitle = customTimetable?.name ?? (timetableType === "merged" ? "Мій розклад" : getTimetableName(group));
  usePageTitle(groupTitle);

  const isPartTime = timetableType === "parttime";
  const showWeekNavigation = isPartTime && availableWeeks && availableWeeks.length > 0 && selectedWeek && onWeekChange;

  const sources = isMerged(group) ? TimetableManager.cachedMergedTimetable?.timetables : customTimetable?.sourceNames;
  const examsGroup = sources
    ? sources.find((t) => {
        const type = TimetableManager.tryToGetType(t);
        return type === "timetable" || type === "lecturer";
      })
    : group;

  const share = () => {
    const url = `${window.location.origin}/${group}`;
    // The native share sheet is handy on phones, on desktop copying the link is more useful
    if (isMobile && navigator.share) return navigator.share({ title: groupTitle, url }).catch(() => {});
    navigator.clipboard.writeText(url).then(
      () => Toast.success("Посилання скопійовано"),
      (e) => Toast.error(e, "Не вдалося скопіювати посилання")
    );
  };

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
    <header className={classes(generalStyles.header, styles.header)}>
      <nav className={generalStyles["right-buttons"]}>
        <div className={"flex gap-1"}>
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
          {customTimetable && (
            <button
              type="button"
              className={classes("icon-button", "transition duration-300")}
              title="Поділитися розкладом"
              aria-label="Поділитися розкладом"
              onClick={share}
            >
              <ShareIcon />
            </button>
          )}
        </div>
        <div className={styles["title-group"]}>
          <h1 className={styles.title}>{groupTitle}</h1>
          {timetableType !== "selective" && timetableType !== "parttime" && (
            <TimetableViewSelect isExams={isExamsTimetable} onChange={handleIsExamsTimetableChange} />
          )}
        </div>
      </nav>
      {!isExamsTimetable && (
        <span className={styles.controls}>
          {showWeekNavigation ? (
            <WeekNavigation weeks={availableWeeks} selectedWeek={selectedWeek} onWeekChange={onWeekChange} />
          ) : (
            <>
              {!hasCellSubgroups && (
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
    </header>
  );
};

export default TimetableHeader;
