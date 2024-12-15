import BugIcon from "@/assets/BugIcon";
import HeartIcon from "@/assets/HeartIcon";
import catImage from "@/assets/cat.svg";
import { DatalistFocusProvider } from "@/context/datalistFocus";
import HeaderPanel from "@/features/header/HomeHeader";
import TimetablesSelection from "@/features/home/TimetablesSelection";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import List from "@/shared/List";
import { classes } from "@/styles/utils";
import type { TimetableType } from "@/types/timetable";
import { BUG_REPORT_LINK, DONATION_LINK, TABLET_SCREEN_BREAKPOINT } from "@/utils/constants";
import TimetableManager from "@/utils/data/TimetableManager";
import Toast from "@/utils/toasts";
import { type FC, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styles from "./HomePage.module.scss";

type OwnProps = {
  timetableType: TimetableType;
};

const HomePage: FC<OwnProps> = ({ timetableType }) => {
  const [firstLayer, setFirstLayer] = useState<string[]>([]); // institutes/alphabet
  const [secondLayer, setSecondLayer] = useState<string[]>([]); // majors/departments/selective
  const [thirdLayer, setThirdLayer] = useState<string[]>([]); // groups/lecturers
  const [selectedFirst, setSelectedFirst] = useState<string | null>(null);
  const [selectedSecond, setSelectedSecond] = useState<string | null>(null);

  const { state }: { state: { force: boolean } | null } = useLocation();
  const { force } = state ?? {};

  const { width } = useWindowDimensions();
  const navigate = useNavigate();
  const isTablet = width < TABLET_SCREEN_BREAKPOINT;
  const showFirstLayer = !isTablet || !selectedSecond;
  const showSecondLayer = showFirstLayer && secondLayer.length > 0;
  const showThirdLayer = Boolean(selectedSecond);

  const [searchParams, setSearchParams] = useSearchParams();

  const updateSecondLayer = useCallback(
    (query: string) => {
      TimetableManager.updateLastOpenedInstitute(query);
      Toast.promise(TimetableManager.getSecondLayerByType(timetableType, query), "Fetching groups...")
        .then(setSecondLayer)
        .catch(Toast.error);
    },
    [timetableType]
  );

  const updateThirdLayer = useCallback(
    (major: string) => {
      Toast.promise(TimetableManager.getThirdLayerByType(timetableType, major), "Fetching timetables...")
        .then(setThirdLayer)
        .catch(Toast.error);
    },
    [timetableType]
  );

  // Initial fetch
  useEffect(() => {
    if (!force && timetableType === "timetable" && searchParams.size === 0) {
      TimetableManager.getLastOpenedTimetable().then((t) => {
        t && navigate(t);
      });
    }

    Toast.promise(TimetableManager.getFirstLayerSelectionByType(timetableType), "Fetching institutes...")
      .then(setFirstLayer)
      .catch(Toast.error);

    // BUG: In strict mode it kinda ruins nonexisting group error toast
    return () => {
      Toast.hideAllMessages();
    };
  }, [timetableType, force, navigate, searchParams]);

  // On first layer change
  useEffect(() => {
    if (!selectedFirst) return;
    updateSecondLayer(selectedFirst);
  }, [selectedFirst, updateSecondLayer]);

  // On second layer change
  useEffect(() => {
    if (!selectedSecond) {
      setThirdLayer([]);
      return;
    }
    updateThirdLayer(selectedSecond);
  }, [selectedSecond, updateThirdLayer]);

  useEffect(() => {
    const selectedMajor = searchParams.get("major") || "";
    const selectedInstitute = searchParams.get("institute") || "";

    if (selectedInstitute && !selectedMajor) {
      setSelectedSecond(null);
      setThirdLayer([]);
    }
    if (secondLayer.includes(selectedMajor)) {
      setSelectedSecond(selectedMajor);
    }
    if (firstLayer.includes(selectedInstitute)) {
      setSelectedFirst(selectedInstitute);
    }
  }, [secondLayer, searchParams, firstLayer]);

  const handleFirstChange = useCallback(
    (institute: string | null) => {
      setSearchParams(institute ? { institute } : {});
    },
    [setSearchParams]
  );

  const handleSecondChange = useCallback(
    (major: string | null) => {
      setSearchParams(major ? { institute: selectedFirst ?? "", major } : { institute: selectedFirst ?? "" });
    },
    [setSearchParams, selectedFirst]
  );

  return (
    <DatalistFocusProvider>
      <div className={styles.wrapper}>
        <HeaderPanel timetableType={timetableType} className={styles.header} />
        <main className={styles.container}>
          <section
            className={classes(styles.selection, isTablet && selectedSecond && styles["one-column"])}
            data-attr={`${timetableType}-groups`}
          >
            {showFirstLayer && <List items={firstLayer} selectedState={[selectedFirst, handleFirstChange]} />}
            {showSecondLayer && <List items={secondLayer} selectedState={[selectedSecond, handleSecondChange]} />}
            {showThirdLayer ? (
              <TimetablesSelection timetables={thirdLayer} withYears={timetableType !== "lecturer"} />
            ) : (
              <div className={styles["no-selection"]}>
                <img className={styles.cat} src={catImage} draggable="false" alt="cat" width="800" height="800" />
                <p className={styles["cat-text"]}>Оберіть спецільність, щоб продовжити</p>
              </div>
            )}
          </section>
          <div className={classes(styles.feedback, "flex gap-2")}>
            <a
              href={DONATION_LINK}
              title="Support the project"
              target="_blank"
              rel="noreferrer"
              className="flex gap-1 items-center"
              onClick={() => Toast.info("Дуже дякую! 💖")}
            >
              <HeartIcon />
              Support
            </a>
            <a
              href={BUG_REPORT_LINK}
              title="Bug report"
              target="_blank"
              rel="noreferrer"
              className="flex gap-1 items-center"
            >
              <BugIcon />
              Bug report
            </a>
          </div>
        </main>
      </div>
    </DatalistFocusProvider>
  );
};

export default HomePage;
