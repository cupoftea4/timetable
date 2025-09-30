import BugIcon from "@/assets/BugIcon";
import HeartIcon from "@/assets/HeartIcon";
import LoadingIcon from "@/assets/LoadingIcon";
import catImage from "@/assets/cat.svg";
import { DatalistFocusProvider } from "@/context/datalistFocus";
import HeaderPanel from "@/features/header/HomeHeader";
import MissingGroupTip from "@/features/home/MissingGroupTip";
import TimetablesSelection from "@/features/home/TimetablesSelection";
import { useIsTablet } from "@/hooks/useWindowDimensions";
import List from "@/shared/List";
import { classes } from "@/styles/utils";
import type { TimetableType } from "@/types/timetable";
import { BUG_REPORT_LINK, DONATION_LINK } from "@/utils/constants";
import TimetableManager from "@/utils/data/TimetableManager";
import Toast from "@/utils/toasts";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

  const [isLoadingThirdLayer, setIsLoadingThirdLayer] = useState(false);

  const isTablet = useIsTablet();
  const showFirstLayer = !isTablet || !selectedSecond;
  const showSecondLayer = showFirstLayer && secondLayer.length > 0;
  const showThirdLayer = Boolean(selectedSecond);

  const timetableTypeRef = useRef(timetableType);

  useEffect(() => {
    timetableTypeRef.current = timetableType;
  }, [timetableType]);

  const [searchParams, setSearchParams] = useSearchParams();

  const updateSecondLayer = useCallback((query: string) => {
    TimetableManager.updateLastOpenedInstitute(query);
    return Toast.promise(TimetableManager.getSecondLayerByType(timetableTypeRef.current, query), "Fetching groups...")
      .then(setSecondLayer)
      .catch(Toast.error);
  }, []);

  const updateThirdLayer = useCallback((major: string) => {
    setIsLoadingThirdLayer(true);
    return Toast.promise(
      TimetableManager.getThirdLayerByType(timetableTypeRef.current, major),
      "Fetching timetables..."
    )
      .then(setThirdLayer)
      .catch(Toast.error)
      .finally(() => setIsLoadingThirdLayer(false));
  }, []);

  const reset = useCallback(() => {
    setSelectedFirst(null);
    setSelectedSecond(null);
    setThirdLayer([]);
    setSecondLayer([]);
  }, []);

  // Initial fetch
  useEffect(() => {
    reset();

    Toast.promise(TimetableManager.getFirstLayerSelectionByType(timetableType), "Fetching institutes...")
      .then(setFirstLayer)
      .catch(Toast.error);

    // BUG: In strict mode it kinda ruins nonexisting group error toast
    return () => {
      Toast.hideAllMessages();
    };
  }, [timetableType, reset]);

  // On first layer change
  useEffect(() => {
    if (!selectedFirst) {
      return;
    }
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
    if (firstLayer.includes(selectedInstitute) && secondLayer.includes(selectedMajor)) {
      setSelectedSecond(selectedMajor);
    }
  }, [firstLayer, secondLayer, searchParams]);

  useEffect(() => {
    const selectedInstitute = searchParams.get("institute") || "";

    if (firstLayer.includes(selectedInstitute)) {
      setSelectedFirst(selectedInstitute);
    }
  }, [firstLayer, searchParams]);

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
              !isLoadingThirdLayer ? (
                <TimetablesSelection timetables={thirdLayer} withYears={timetableType !== "lecturer"} />
              ) : (
                <div
                  className={`flex items-center gap-2 flex-col justify-center ${
                    timetableType !== "lecturer" ? "max-h-[200px]" : ""
                  }`}
                >
                  <LoadingIcon />
                  <p>Loading...</p>
                </div>
              )
            ) : (
              <div className={styles["no-selection"]}>
                <img className={styles.cat} src={catImage} draggable="false" alt="cat" width="800" height="800" />
                <p className={styles["cat-text"]}>Оберіть спецільність, щоб продовжити</p>
                <div className="pt-6">
                  <MissingGroupTip />
                </div>
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
