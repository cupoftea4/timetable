import { Link } from 'react-router-dom';
import BackIcon from '../assets/BackIcon';
import useWindowDimensions from '../hooks/useWindowDimensions';
import { SCREEN_BREAKPOINT } from '../utils/constants';
import styles from './Groups.module.scss';

enum Year {
  First = 1,
  Second,
  Third,
  Fourth
}

const Groups = ({groups}: {groups: string[][]}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < SCREEN_BREAKPOINT;

  // ммм, та
  const reload = () => window.location.reload();

  return (
    <div className={styles.groups}>
      {
        isMobile &&
          <button onClick={reload} className={styles.back}>
            <BackIcon />
          </button>
      }
      
      { 
        [Year.First, Year.Second, Year.Third, Year.Fourth].map((year) => 
          groups[year]?.length && groups[year].length !== 0 ?
              <ul key={year} className={styles.year} 
                  data-value={`${year} Курс`}
                >
                  { groups[year].map(group => (
                                      <li key={group}>
                                        <Link to={"/" + group}>
                                          {group}
                                        </Link>
                                      </li>)
                    ) 
                  }
              </ul> 
          : null
        )}
    </div>
  )
};

export default Groups;