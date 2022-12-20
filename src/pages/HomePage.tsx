import { useEffect, useState } from "react";
import Groups from "../components/Groups";
import HeaderPanel from "../components/HeaderPanel";
import TimetableManager from "../utils/TimetableManager";
import { CachedInstitute, Year } from "../utils/types";
import styles from "./HomePage.module.scss";
import cat from "../assets/cat.png";
import useWindowDimensions from "../hooks/useWindowDimensions";
import List from "../components/List";
import * as errors from '../utils/errorConstants'

const HomePage = () => {
  const [institutes, setInstitutes] = useState<CachedInstitute[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [groupsByYear, setGroupsByYear] = useState<string[][]>([]); // groupsByYear[year][groupIndex]
  const [selectedInstitute, setSelectedInstitute] = useState<CachedInstitute | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    TimetableManager.getInstitutes()
      .then(setInstitutes)
      .catch(errors.handleError);
  }, []);

  const showInstituteGroups = (institute: CachedInstitute = "ІКНІ") => {
    TimetableManager.getGroups(institute).then((data) => {
      const tempGroups = new Set<string>(data.map((group) => group.split("-")[0]));
      setMajors(Array.from(tempGroups));
      setGroupsByYear(sortGroupsByYear(data));
      setSelectedMajor(null);
    }).catch(errors.handleError);
  };

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
          {
            (!isMobile || !selectedMajor) &&
              <List items={institutes} 
                    selectedState={[selectedInstitute, setSelectedInstitute]} 
                    onClick={showInstituteGroups} 
                  />
          } 
          {selectedInstitute ? (
            <>
              {
                (!isMobile || !selectedMajor) &&
                  <List items={majors} selectedState={[selectedMajor, setSelectedMajor]} />
              }
              {
                (!isMobile || selectedMajor) &&
                  <Groups groups={getSelectedGroups()} />
              }
            </>
          ) : (
            <div className={styles["no-selection"]}>
              <img src={cat} alt="cat" />
              <p>Оберіть інститут, щоб продовжити</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default HomePage;