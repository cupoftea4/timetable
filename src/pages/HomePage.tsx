import { useEffect, useState } from 'react';
import Groups from '../components/Groups';
import HeaderPanel from '../components/HeaderPanel';
import '../styles/main.scss';
import TimetableManager from '../utils/TimetableManager';
import { CachedInstitute } from '../utils/types';
import './HomePage.module.scss';

const HomePage = () => {
  const [institutes, setInstitutes] = useState<CachedInstitute[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<CachedInstitute | null>(null);

  useEffect(() => {
    TimetableManager.getInstitutes().then((data) => {
      setInstitutes(data);
      showInstituteGroups(data[0]);
    });
  }, []);

  const showInstituteGroups = (institute: CachedInstitute = 'ІКНІ') => {
    setSelectedInstitute(institute);
  }
  
  return (
    <>
      <HeaderPanel />
      <ul>
      {
        institutes.map((institute) => {
          return (
            <li key={institute}>
              <button onClick={() => showInstituteGroups(institute)}>
                {institute} {selectedInstitute === institute && "selected"}
              </button>
              </li>
          )
        })
      }        
      </ul>
      {selectedInstitute && <Groups institute={selectedInstitute} />}
    </>
  )
};

export default HomePage;