import HomeIcon from "@/assets/HomeIcon";
import usePageTitle from "@/hooks/usePageTitle";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import Toggle from "@/shared/Toggle";
import { classes } from "@/styles/utils";
import type { HalfTerm } from "@/types/timetable";
import { MOBILE_SCREEN_BREAKPOINT } from "@/utils/constants";
import TimetableManager from "@/utils/data/TimetableManager";
import { isMerged } from "@/utils/timetable";
import Toast from "@/utils/toasts";
import type { FC } from "react";
import type React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import generalStyles from "./HeaderPanel.module.scss";
import styles from "./TimetableHeader.module.scss";
import SavedMenu from "./components/SavedMenu";
import TimetablePartials from "./components/TimetablePartials";

type OwnProps = {
  loading: boolean;
  isLecturers: boolean;
  timetableType?: string;
  isExamsTimetable: boolean;
  partials: HalfTerm[];
  subgroupState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  weekState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  updatePartialTimetable: (partial: HalfTerm | 0) => void;
};

const TimetableHeader: FC<OwnProps> = ({
  timetableType,
  isExamsTimetable,
  isLecturers,
  partials,
  subgroupState,
  weekState,
  loading,
  updatePartialTimetable,
}) => {
  const [isSecondSubgroup, setIsSecondSubgroup] = subgroupState;
  const [isSecondWeek, setIsSecondWeek] = weekState;
  const navigate = useNavigate();
  const group = useParams().group?.trim() ?? "";
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_SCREEN_BREAKPOINT;
  const groupTitle = timetableType === "merged" ? "Мій розклад" : group;
  usePageTitle(groupTitle);

  const handleIsExamsTimetableChange = (isExams: boolean) => {
    const path =
      isMerged(group) && TimetableManager.cachedMergedTimetable
        ? (TimetableManager.cachedMergedTimetable.timetables?.find((t) => {
            const type = TimetableManager.tryToGetType(t);
            return type === "timetable" || type === "lecturer";
          }) ?? group)
        : group;
    navigate(`/${path}${isExams ? "/exams" : ""}`);
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
            to="/"
            aria-label="Home"
            type="button"
            className={classes("icon-button", "transition duration-300")}
          >
            <HomeIcon />
          </Link>
          <SavedMenu timetableChanged={loading} />
        </div>
        <h1 className={styles.title}>{groupTitle}</h1>
        {timetableType !== "selective" && (
          <button
            type="button"
            className={generalStyles.exams}
            title={isExamsTimetable ? "Переключити на розклад пар" : "Переключити на розклад екзаменів"}
            onClick={() => {
              handleIsExamsTimetableChange(!isExamsTimetable);
            }}
          >
            {!isExamsTimetable ? "Екзамени" : "Пари"}
          </button>
        )}
        {!isExamsTimetable && <TimetablePartials partials={partials} handlePartialClick={updatePartialTimetable} />}
      </nav>
      <span className={styles.params}>
        {!isExamsTimetable && (
          <>
            {!isLecturers && (
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
      </span>
    </header>
  );
};

export default TimetableHeader;
