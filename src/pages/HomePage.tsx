import { FC, useEffect, useState } from "react";
import Groups from "../components/Groups";
import HeaderPanel from "../components/HeaderPanel";
import TimetableManager from "../utils/TimetableManager";
import { CachedInstitute, TimetableType } from "../utils/types";
import styles from "./HomePage.module.scss";
import catImage from "../assets/cat.png";
import useWindowDimensions from "../hooks/useWindowDimensions";
import List from "../components/List";
import * as handler from '../utils/requestHandler'
import { SCREEN_BREAKPOINT } from "../utils/constants";

type OwnProps = {
  timetableType: TimetableType;
}

const HomePage: FC<OwnProps>  = ({timetableType}) => {
  const [firstLayer, setFirstLayer] = useState<CachedInstitute[]>([]); // institutes/alphabet
  const [secondLayer, setSecondLayer] = useState<string[]>([]); // majors/departments/selective
  const [thirdLayer, setThirdLayer] = useState<string[]>([]); // groups/lecturers
  const [selectedFirst, setSelectedFirst] = useState<CachedInstitute | null>(null);
  const [selectedSecond, setSelectedSecond] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isMobile = width < SCREEN_BREAKPOINT;
  const showSecondLayer = !isMobile || !selectedSecond;
  const showFirstLayer = showSecondLayer;
  const showThirdLayer = selectedFirst && showSecondLayer;
  
  useEffect(() => {
    setThirdLayer([]);
    TimetableManager.getLastOpenedInstitute().then((inst) => {
      setSelectedFirst(inst);
      updateMajors(timetableType, inst);
    });
    TimetableManager.getFirstLayerSelectionByType(timetableType)
      .then(setFirstLayer)
      .catch(handler.handleError);
    // BUG: In strict mode it kinda ruins nonexisting group error toast
    return () => handler.hideAllMessages();
  }, [timetableType]);

  const updateMajors = (timetableType: TimetableType, query: string) => {
    TimetableManager.updateLastOpenedInstitute(query);   
    handler.handlePromise(TimetableManager.getSecondLayerByType(timetableType, query), 'Fetching groups...')
      .then(setSecondLayer)
      .catch(handler.handleError);
    setSelectedSecond(null);
  };

  const updateGroups = (timetableType: TimetableType, query: string) => {
    handler.handlePromise(TimetableManager.getThirdLayerByType(timetableType, query), 'Fetching timetables...')
      .then(setThirdLayer)
      .catch(handler.handleError);
  };

  const handleInstituteChange = (institute: CachedInstitute | null) => {
    setSelectedFirst(institute);
    if (!institute) return;
    updateMajors(timetableType, institute);
  };

  const handleMajorChange = (major: string | null) => {
    setSelectedSecond(major);
    if (!major) return;
    updateGroups(timetableType, major);
  };

  return (
    <>
      <HeaderPanel timetableType={timetableType}/>
      <main>
        <section className={styles.selection} data-attr={timetableType + "-groups"}>
          {showFirstLayer &&
              <List items={firstLayer} selectedState={[selectedFirst, handleInstituteChange]} />
          } 
          {showThirdLayer &&
              <List items={secondLayer} selectedState={[selectedSecond, handleMajorChange]} />
          }

          {selectedSecond ?
            (timetableType === 'lecturer' ?
              <ul>
                {thirdLayer.map((lecturer) => <li>{lecturer}</li>)}
              </ul>
              :
              <Groups groups={thirdLayer} />
            )
            : 
              <div className={styles['no-selection']}>
                <img src={catImage} alt="cat" />
                <p>Оберіть спецільність, щоб продовжити</p>
              </div>
          }
        </section>
      </main>
    </>
  );
};

export default HomePage;