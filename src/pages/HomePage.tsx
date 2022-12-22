import { useCallback, useEffect, useState } from "react";
import Groups from "../components/Groups";
import HeaderPanel from "../components/HeaderPanel";
import TimetableManager from "../utils/TimetableManager";
import { CachedInstitute, Year } from "../utils/types";
import styles from "./HomePage.module.scss";
import cat from "../assets/cat.png";
import useWindowDimensions from "../hooks/useWindowDimensions";
import List from "../components/List";
import * as handler from '../utils/requestHandler'
import { SCREEN_BREAKPOINT } from "../utils/constants";

const HomePage = () => {
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
    handler.handlePromise(TimetableManager.getInstitutes())
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
        setSelectedMajor(null);;
      })
      .catch(handler.handleError);
  }, []);

  useEffect(() => {
    if (selectedInstitute) handleInstituteUpdate(selectedInstitute);
  }, [selectedInstitute, handleInstituteUpdate]);

  const getSelectedGroups = () => {
    return [Year.First, Year.Second, Year.Third, Year.Fourth].map(
      (year) =>
        groupsByYear[year]?.filter(
          (group) => group.split("-")[0] === selectedMajor
        ) ?? []
    );
  };

  function sortGroupsByYear(groups: string[]) {
    return groups.reduce((acc, group) => {
      const yearIndex = +group.split("-")[1][0];
      if (!acc[yearIndex]) acc[yearIndex] = [];
      acc[yearIndex].push(group);
      return acc;
    }, [] as string[][]);
  }

  return (
    <>
      <HeaderPanel />
      <main>
        <section className={styles.selection}>
          {showMajorSelection &&
              <List items={institutes} selectedState={[selectedInstitute, setSelectedInstitute]} />
          } 
          {selectedInstitute && 
              showMajorSelection &&
              <List items={majors} selectedState={[selectedMajor, setSelectedMajor]} />
          }

          {selectedMajor ?
              <Groups groups={getSelectedGroups()} />
            : 
              <div className={styles['no-selection']}>
                <img src={cat} alt="cat" />
                <p>Оберіть інститут та спецільність, щоб продовжити</p>
              </div>
          }
        </section>
      </main>
    </>
  );
};

export default HomePage;