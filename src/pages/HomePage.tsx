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
  const [institutes, setInstitutes] = useState<CachedInstitute[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [groupsByYear, setGroupsByYear] = useState<string[][]>([]); // groupsByYear[year][groupIndex]
  const [selectedInstitute, setSelectedInstitute] = useState<CachedInstitute | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isMobile = width < SCREEN_BREAKPOINT;
  const showMajorSelection = !isMobile || !selectedMajor;
  const showInstituteSelection = showMajorSelection;
  const showGroupsSelection = selectedInstitute && showMajorSelection;
  
  useEffect(() => {
    TimetableManager.getLastOpenedInstitute().then((inst) => {
      setSelectedInstitute(inst);
      updateMajors(timetableType, inst);
    });
    TimetableManager.getFirstLayerSelectionByType(timetableType)
      .then(setInstitutes)
      .catch(handler.handleError);
    // BUG: In strict mode it kinda ruins nonexisting group error toast
    return () => handler.hideAllMessages();
  }, [timetableType]);

  const updateMajors = (timetableType: TimetableType, query: string) => {
    TimetableManager.updateLastOpenedInstitute(query);   
    handler.handlePromise(TimetableManager.getSecondLayerByType(timetableType, query), 'Fetching groups...')
      .then(setMajors)
      .catch(handler.handleError);
    setSelectedMajor(null);
  };

  const updateGroups = (timetableType: TimetableType, query: string) => {
    handler.handlePromise(TimetableManager.getThirdLayerByType(timetableType, query), 'Fetching timetables...')
      .then(setGroupsByYear)
      .catch(handler.handleError);
  };

  const handleInstituteChange = (institute: CachedInstitute | null) => {
    setSelectedInstitute(institute);
    if (!institute) return;
    updateMajors(timetableType, institute);
  };

  const handleMajorChange = (major: string | null) => {
    setSelectedMajor(major);
    if (!major) return;
    updateGroups(timetableType, major);
  };

  return (
    <>
      <HeaderPanel timetableType={timetableType}/>
      <main>
        <section className={styles.selection} data-attr={timetableType + "-groups"}>
          {showInstituteSelection &&
              <List items={institutes} selectedState={[selectedInstitute, handleInstituteChange]} />
          } 
          {showGroupsSelection &&
              <List items={majors} selectedState={[selectedMajor, handleMajorChange]} />
          }

          {selectedMajor ?
              <Groups groups={groupsByYear} />
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