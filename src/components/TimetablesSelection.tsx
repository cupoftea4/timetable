import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import TimetableUtil from '../utils/TimetableUtil';
import styles from './TimetablesSelection.module.scss';

enum Year {
  First = 1,
  Second,
  Third,
  Fourth
}

type OwnProps = {
  className?: string;
  timetables: string[];
  withYears?: boolean;
};

const TimetablesSelection: FC<OwnProps> = ({className, timetables, withYears = false}) => {
  const groupsByYear = TimetableUtil.sortGroupsByYear(timetables);
  const [expandedYear, setExpandedYear] = useState<Year | null>(null); // for mobile onClick event and keyboard navigation

  return (
    <div className={`${styles.timetables} ${className} ${withYears && styles['with-years']}`}>
      {withYears ?
          [Year.First, Year.Second, Year.Third, Year.Fourth].map((year) => 
            groupsByYear[year]?.length && groupsByYear[year].length !== 0 ?
                <ul key={year} className={`${styles.year} ${expandedYear === year ? styles.expanded : ''}`} 
                    data-value={`${year} Курс`}
                    onClick={() => expandedYear === year ? setExpandedYear(null) : setExpandedYear(year)}
                  >
                    {groupsByYear[year].map(group => (
                                        <li key={group}>
                                          <Link to={"/" + group} onFocus={() => setExpandedYear(year)}>
                                            {group}
                                          </Link>
                                        </li>)  
                      ) 
                    }
                </ul> 
              : null
            )
          :               
          <ul>
            {timetables.map((lecturer) => <li key={lecturer}><Link to={"/" + lecturer}>{lecturer}</Link></li>)}
          </ul>
        }
    </div>
  )
};

export default TimetablesSelection;