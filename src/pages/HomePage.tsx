import { FC, useCallback, useEffect, useState } from "react";
import TimetablesSelection from "../components/TimetablesSelection";
import HeaderPanel from "../components/HeaderPanel";
import TimetableManager from "../utils/TimetableManager";
import { TimetableType } from "../utils/types";
import styles from "./HomePage.module.scss";
import useWindowDimensions from "../hooks/useWindowDimensions";
import List from "../components/List";
import * as handler from '../utils/requestHandler'
import { TABLET_SCREEN_BREAKPOINT } from "../utils/constants";
import catImage from '../assets/cat.svg';
import { useLocation, useNavigate } from "react-router-dom";

type OwnProps = {
  timetableType: TimetableType;
};

const getHash = () => decodeURI(window.location.hash.slice(1));
const handleHashChange = (newHash: string) => {
  const hash = decodeURI(window.location.hash.slice(1));
  if (hash === "") window.history.pushState(newHash, 'custom', `#${newHash}` );
  if (hash !== newHash) window.history.replaceState(newHash, 'custom', `#${newHash}` ); 
}

const HomePage: FC<OwnProps>  = ({timetableType }) => {
  const [firstLayer, setFirstLayer] = useState<string[]>([]); // institutes/alphabet
  const [secondLayer, setSecondLayer] = useState<string[]>([]); // majors/departments/selective
  const [thirdLayer, setThirdLayer] = useState<string[]>([]); // groups/lecturers
  const [selectedFirst, setSelectedFirst] = useState<string | null>(null);
  const [selectedSecond, setSelectedSecond] = useState<string | null>(null);
  
  const { state }: {state: {force: boolean} | null} = useLocation();
  const { force } = state || {};

  const { width } = useWindowDimensions();
  const navigate = useNavigate();
  const isTablet = width < TABLET_SCREEN_BREAKPOINT;
  const showFirstLayer = (!isTablet || !selectedSecond);
  const showSecondLayer = showFirstLayer && secondLayer.length > 0;
  const showThirdLayer = Boolean(selectedSecond);
  

  const handleSecondSelect = useCallback((major: string | null) => {
    setSelectedSecond(major);
    if (!major) return;
    handleHashChange(major);
    handler.promise(TimetableManager.getThirdLayerByType(timetableType, major), 'Fetching timetables...')
      .then(setThirdLayer)
      .catch(handler.error);
  }, [timetableType]);

  useEffect(() => {
    if (!force && timetableType === "timetable") {
      TimetableManager.getLastOpenedTimetable()
        .then(t => t && navigate(t));
    }
    window.onpopstate = () => {setSelectedSecond(null)}
    return () => {window.onpopstate = null}
  }, [force, navigate, timetableType]); 

  useEffect(() => {
    if (secondLayer.includes(getHash())) {
      handleSecondSelect(getHash());
    }
  }, [secondLayer, handleSecondSelect]);
  
  useEffect(() => {
    setThirdLayer([]);
    handler.promise(
      TimetableManager.getFirstLayerSelectionByType(timetableType), 
      "Fetching institutes...")
    .then(setFirstLayer)
    .catch(handler.error);

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
    return () => handler.hideAllMessages();
  }, [timetableType]);

  const updateSecondLayer = (timetableType: TimetableType, query: string) => {
    TimetableManager.updateLastOpenedInstitute(query);   
    handler.promise(TimetableManager.getSecondLayerByType(timetableType, query), 'Fetching groups...')
      .then(setSecondLayer)
      .catch(handler.error);
  };

  const handleInstituteChange = (institute: string | null) => {
    setSelectedFirst(institute);
    if (!institute) return;
    updateSecondLayer(timetableType, institute);
  };

  return (
    <div className={styles.wrapper}>
      <HeaderPanel timetableType={timetableType} className={styles.header}/>
      <main className={styles.container}>
        <section className={`${styles.selection} ${isTablet && selectedSecond && styles["one-column"]}`} 
          data-attr={timetableType + "-groups"}>
          {showFirstLayer &&
            <List items={firstLayer} selectedState={[selectedFirst, handleInstituteChange]} />
          } 
          {showSecondLayer &&
            <List items={secondLayer} selectedState={[selectedSecond, handleSecondSelect]} />
          }
          {showThirdLayer ?
            <TimetablesSelection timetables={thirdLayer} withYears={timetableType !== "lecturer"}/>
            : 
              <div className={styles['no-selection']}>
                <img className={styles.cat} src={catImage} draggable="false" alt="cat" width="800" height="800"/>
                <p className={styles['cat-text']}>Оберіть спецільність, щоб продовжити</p>
              </div>
          }
        </section>
        <p className={styles.feedback}>Bug report: <a href="https://t.me/lpnu_timetable">@lpnu_timetable</a></p>
      </main>
    </div>
  );
};

export default HomePage;