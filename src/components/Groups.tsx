import { Link } from 'react-router-dom';
import styles from './Groups.module.scss';

enum Year {
  First = 1,
  Second,
  Third,
  Fourth
}

const Groups = ({groups}: {groups: string[][]}) => {
  return (
    <>
      {
        <div className={styles.groups}>
          { 
            [Year.First, Year.Second, Year.Third, Year.Fourth].map((year) => 
              groups[year - 1]?.length && groups[year - 1].length !== 0 ?
                  <ul key={year} className={styles.year} 
                      data-value={`${year} Курс`}
                    >
                      { groups[year - 1].map(group => (
                                          <li key={group}>
                                            <Link to={group}>
                                              {group}
                                            </Link>
                                          </li>)
                        ) 
                      }
                  </ul> 
              : null
            )}
        </div>
      }
      
       
    </>
  )
};

export default Groups;