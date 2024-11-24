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
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./HomePage.module.scss";

type OwnProps = {
  timetableType: TimetableType;
};

const getHash = () => decodeURI(window.location.hash.slice(1));
const handleHashChange = (newHash: string) => {
  const hash = decodeURI(window.location.hash.slice(1));
  if (hash === "") window.history.pushState(newHash, "custom", `#${newHash}`);
  if (hash !== newHash) window.history.replaceState(newHash, "custom", `#${newHash}`);
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

  const handleSecondSelect = useCallback(
    (major: string | null) => {
      setSelectedSecond(major);
      if (!major) return;
      handleHashChange(major);
      Toast.promise(TimetableManager.getThirdLayerByType(timetableType, major), "Fetching timetables...")
        .then(setThirdLayer)
        .catch(Toast.error);
    },
    [timetableType]
  );

  useEffect(() => {
    if (!force && timetableType === "timetable") {
      TimetableManager.getLastOpenedTimetable().then((t) => {
        t && navigate(t);
      });
    }
    const onPopstate = () => {
      setSelectedSecond(null);
    };
    window.addEventListener("popstate", onPopstate);
    return () => {
      window.removeEventListener("popstate", onPopstate);
    };
  }, [force, navigate, timetableType]);

  useEffect(() => {
    if (secondLayer.includes(getHash())) {
      handleSecondSelect(getHash());
    }
  }, [secondLayer, handleSecondSelect]);

  useEffect(() => {
    setThirdLayer([]);
    Toast.promise(TimetableManager.getFirstLayerSelectionByType(timetableType), "Fetching institutes...")
      .then(setFirstLayer)
      .catch(Toast.error);

    TimetableManager.getLastOpenedInstitute().then((inst) => {
      if (!inst) return;
      if (!TimetableManager.firstLayerItemExists(timetableType, inst)) {
        setSecondLayer([]);
        setSelectedSecond(null);
        setSelectedFirst(null);
        return;
      }
      setSelectedFirst(inst);
      updateSecondLayer(timetableType, inst);
    });
    // BUG: In strict mode it kinda ruins nonexisting group error toast
    return () => {
      Toast.hideAllMessages();
    };
  }, [timetableType]);

  const updateSecondLayer = (timetableType: TimetableType, query: string) => {
    TimetableManager.updateLastOpenedInstitute(query);
    Toast.promise(TimetableManager.getSecondLayerByType(timetableType, query), "Fetching groups...")
      .then(setSecondLayer)
      .catch(Toast.error);
  };

  const handleInstituteChange = (institute: string | null) => {
    setSelectedFirst(institute);
    if (!institute) return;
    updateSecondLayer(timetableType, institute);
  };

  return (
    <DatalistFocusProvider>
      <div className={styles.wrapper}>
        <HeaderPanel timetableType={timetableType} className={styles.header} />
        <main className={styles.container}>
          <section
            className={classes(styles.selection, isTablet && selectedSecond && styles["one-column"])}
            data-attr={`${timetableType}-groups`}
          >
            {showFirstLayer && <List items={firstLayer} selectedState={[selectedFirst, handleInstituteChange]} />}
            {showSecondLayer && <List items={secondLayer} selectedState={[selectedSecond, handleSecondSelect]} />}
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
