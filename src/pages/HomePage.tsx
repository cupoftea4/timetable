import { useEffect, useState } from 'react';
import Groups from '../components/Groups';
import HeaderPanel from '../components/HeaderPanel';
import TimetableManager from '../utils/TimetableManager';
import { CachedInstitute } from '../utils/types';
import styles from './HomePage.module.scss';

const HomePage = () => {
  const [institutes, setInstitutes] = useState<CachedInstitute[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<CachedInstitute | null>(null);

  useEffect(() => {
    TimetableManager.getInstitutes().then((data) => {
      setInstitutes(data);
      // showInstituteGroups(data[0]);
    });
  }, []);

  const showInstituteGroups = (institute: CachedInstitute = 'ІКНІ') => {
    setSelectedInstitute(institute);
  }
  
  return (
    <>
      <HeaderPanel />
      <main>
        <section className={styles.selection}>
          <ul>
          {
            institutes.map((institute) => {
              return (
                <li key={institute}>
                  <button onClick={() => showInstituteGroups(institute)} 
                    data-state={selectedInstitute === institute ? "selected" : ""} 
                   >
                    {institute}
                  </button>
                </li>
              )
            })
          }        
          </ul>
          {selectedInstitute && <Groups institute={selectedInstitute} />}
        </section>
        
      </main>
    </>
  )
};

export default HomePage;