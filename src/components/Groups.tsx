import { memo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import useWindowDimensions from '../hooks/useWindowDimensions';
import TimetableManager from '../utils/TimetableManager';
import styles from './Groups.module.scss';

enum Year {
  First = 1,
  Second,
  Third,
  Fourth
}

const Groups = ({institute}: {institute: string}) => {
  const [groupsByYear, setGroupsByYear] = useState<string[][]>([]); // groupsByYear[year][groupIndex]
  const [majors, setMajors] = useState<string[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  console.log(width);
  

  useEffect(() => {
    TimetableManager.getGroups(institute).then((data) =>  {
      const tempGroups = new Set<string>(data.map(group => group.split('-')[0]));
      setMajors(Array.from(tempGroups));
      setGroupsByYear(sortGroupsByYear(data));
      setSelectedMajor(null);
    });
  }, [institute]);

  const getSelectedGroups = (year: Year) => {
    return groupsByYear[year]?.filter((group) => 
      group.split('-')[0] === selectedMajor
    ) ?? [];
  }

  function sortGroupsByYear(groups: string[]) {
    return groups.reduce((acc, group) => {
      const yearIndex = +(group.split('-')[1][0]);
      if (!acc[yearIndex]) acc[yearIndex] = [];
      acc[yearIndex].push(group);
      return acc;
    }, [] as string[][]);
  }

  const groupElement = (group: string) => {
    return (<li key={group}>
              <Link to={group}>
                {group}
              </Link>
            </li>)
  }
  
  return (
    <>
      <ul>
          {
            majors.map((group) =>
                <li key={group}>
                  <button data-state={selectedMajor === group ? "selected" : ""} 
                      onClick={() => setSelectedMajor(group)} 
                      >
                    {group}
                  </button>
                </li>
            )
          }
      </ul>
      {
        !selectedMajor ? <p>Виберіть спеціальність</p> :
        <div className={styles.groups}>
          { 
            [Year.First, Year.Second, Year.Third, Year.Fourth].map((year) => 
              getSelectedGroups(year).length !== 0 ?
                  <ul key={year} className={styles.year} 
                      data-value={`${year} Курс`}
                    >
                      { getSelectedGroups(year).map(groupElement) }
                  </ul> 
              : null
            )}
        </div>
      }
      
       
    </>
  )
};

export default memo(Groups);