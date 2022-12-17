import { memo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import TimetableManager from '../utils/TimetableManager';

enum Year {
  First = 1,
  Second,
  Third,
  Fourth
}

const Groups = ({institute}: {institute: string}) => {
  const [groupsByYear, setGroupsByYear] = useState<string[][]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);

  useEffect(() => {
    TimetableManager.getGroups(institute).then((data) =>  {
      const tempGroups = new Set<string>(data.map(group => group.split('-')[0]));
      setMajors(Array.from(tempGroups));
      setGroupsByYear(sortGroupsByYear(data));
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
  
  return (
    <>
      <ul>
          {
            majors.map((group) =>
                <li key={group}>
                  <button onClick={() => setSelectedMajor(group)}>
                    {group} {selectedMajor === group && "selected"}
                  </button>
                </li>
            )
          }        
        </ul>
        <ul>
          {
            getSelectedGroups(Year.Second).map((group) =>
                <li key={group}>
                  <Link to={group}>
                    {group}
                  </Link>
                </li>
            )
          }
      </ul>
      <ul>
          {
            getSelectedGroups(Year.Third).map((group) =>
                <li key={group}>
                  <Link to={group}>
                    {group}
                  </Link>
                </li>
            )
          }
      </ul>      
    </> 
  )
};

export default memo(Groups);