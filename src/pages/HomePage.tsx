import { useCallback, useEffect, useState } from "react";
import Groups from "../components/Groups";
import HeaderPanel from "../components/HeaderPanel";
import TimetableManager from "../utils/TimetableManager";
import { CachedInstitute, Year } from "../utils/types";
import styles from "./HomePage.module.scss";
import catImage from "../assets/cat.png";
import useWindowDimensions from "../hooks/useWindowDimensions";
import List from "../components/List";
import * as handler from '../utils/requestHandler'
import { SCREEN_BREAKPOINT } from "../utils/constants";

type TimetableType = "timetable" | "postgraduates" | "selective" | "lecturer";

const HomePage = () => {
  const [timetableType, setTimetableType] = useState<"timetable" | "postgraduates" | "selective" | "lecturer">("timetable");
  const [institutes, setInstitutes] = useState<CachedInstitute[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [groupsByYear, setGroupsByYear] = useState<string[][]>([]); // groupsByYear[year][groupIndex]
  const [selectedInstitute, setSelectedInstitute] = useState<CachedInstitute | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < SCREEN_BREAKPOINT;
  const showMajorSelection = !isMobile || !selectedMajor;
  
  useEffect(() => {
    TimetableManager.getLastOpenedInstitute().then(setSelectedInstitute);
    TimetableManager.getInstitutes()
      .then(setInstitutes)
      .catch(handler.handleError);
  }, []);

  const handleInstituteUpdate = useCallback((institute: CachedInstitute = "ІКНІ") => {
    TimetableManager.updateLastOpenedInstitute(institute);
    handler.handlePromise(TimetableManager.getGroups(institute), 'Fetching groups...')
      .then((data) => {
        const tempGroups = new Set<string>(data.map((group) => group.split("-")[0]));
        setMajors(Array.from(tempGroups));
        setGroupsByYear(sortGroupsByYear(data));
        setSelectedMajor(null);
      })
      .catch(handler.handleError);
  }, []);

  useEffect(() => {
    if (selectedInstitute) handleInstituteUpdate(selectedInstitute);
  }, [selectedInstitute, handleInstituteUpdate]);

  const getGroupName = (group: string, timetableType: TimetableType) => {
    if (timetableType === "selective") return group.split("-")[0] + "-" + group.split("-")[1];
    return group.split("-")[0];
  };

  const getSelectedGroups = () => {
    console.log(groupsByYear, selectedMajor);
    
    return [Year.First, Year.Second, Year.Third, Year.Fourth].map(
      (year) =>
        groupsByYear[year]?.filter(
          (group) => getGroupName(group, timetableType) === selectedMajor
        ) ?? []
    );
  };

  function sortGroupsByYear(groups: string[]) {
    return groups.reduce((acc, group) => {
      const yearIndex = +(group.split("-")?.at(-1)?.at(0) ?? 0);
      if (!acc[yearIndex]) acc[yearIndex] = [];
      acc[yearIndex].push(group);
      return acc;
    }, [] as string[][]);
  }

  useEffect(() => {
    TimetableManager.changeTimetableType(timetableType);
    if (timetableType === "selective") {
      handler.handlePromise(TimetableManager.getSelectiveGroups(), 'Fetching groups...')
      .then((data) => {
        const tempGroups = new Set<string>(data.map((group) => getGroupName(group, timetableType)));
        setMajors(Array.from(tempGroups));
        setGroupsByYear(sortGroupsByYear(data));
        setSelectedMajor(null);
        setInstitutes([]);
      })
      .catch(handler.handleError);

    } else {
      setInstitutes(TimetableManager.getCachedInstitutes());
      handleInstituteUpdate();
    }
  }, [timetableType, handleInstituteUpdate]);

  return (
    <>
      <HeaderPanel timetableTypeState={[timetableType, setTimetableType]}/>
      <main>
        <section className={styles.selection} data-attr={timetableType + "-groups"}>
          {showMajorSelection &&
              <List items={institutes} selectedState={[selectedInstitute, setSelectedInstitute]} />
          } 
          {selectedInstitute && 
              showMajorSelection &&
              <List  items={majors} selectedState={[selectedMajor, setSelectedMajor]} />
          }

          {selectedMajor ?
              <Groups groups={getSelectedGroups()} />
            : 
              <div className={styles['no-selection']}>
                <img src={catImage} alt="cat" />
                <p>Оберіть інститут та спецільність, щоб продовжити</p>
              </div>
          }
        </section>
      </main>
    </>
  );
};

export default HomePage;