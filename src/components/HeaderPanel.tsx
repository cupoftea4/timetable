import SavedMenu from './SavedMenu'
import React, { FC, useMemo } from 'react'
import SearchBar from './SearchBar';
// import ThemesIcon from '../assets/ThemesIcon';
import useWindowDimensions from '../hooks/useWindowDimensions';
import styles from './HeaderPanel.module.scss';
import { SCREEN_BREAKPOINT } from '../utils/constants';
import { TimetableType } from '../utils/types';
import { Link } from 'react-router-dom';

const timetableTypes: {[key in TimetableType]: string} = 
{
  "timetable": "Студент",
  "selective": "Вибіркові",
  "lecturer": "Викладач"
}

type OwnProps = {
  timetableType: TimetableType;
};

const HeaderPanel : FC<OwnProps> = ({timetableType}) => {
  const { width } = useWindowDimensions();
  const shouldShrinkSearchBar = useMemo(() => width < SCREEN_BREAKPOINT, [width]);
  const [shrinkSearchBar, setShrinkSearchBar] = React.useState(shouldShrinkSearchBar);

  const toggleSearchBar = () => {
    if (shouldShrinkSearchBar) {
      setShrinkSearchBar(!shrinkSearchBar);
    }
  };

  return (
    <header className={styles.header}>
      <SearchBar toggleSearchBar={toggleSearchBar} timetableType={timetableType} /> 
      {!shrinkSearchBar && shouldShrinkSearchBar ?
        null 
        :
        <nav className={styles['nav-buttons']}>
          <div className={styles['timetable-types']}>
            {
              (Object.keys(timetableTypes) as TimetableType[]).map(type =>
                <Link 
                  to={"/" + (type === "timetable" ? "" : type)}
                  key={type}
                  className={timetableType === type ? styles.active : ""}
                >
                  {timetableTypes[type]}
                </Link>
              )
            }
          </div>
          <SavedMenu />
          {/* <ThemesIcon /> */}
        </nav> 
      }
    </header>
  )
};

export default HeaderPanel;