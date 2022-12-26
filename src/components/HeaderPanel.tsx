import SavedMenu from './SavedMenu'
import React, { FC, useMemo } from 'react'
import SearchBar from './SearchBar';
// import ThemesIcon from '../assets/ThemesIcon';
import useWindowDimensions from '../hooks/useWindowDimensions';
import styles from './HeaderPanel.module.scss';
import { SCREEN_BREAKPOINT } from '../utils/constants';
import { TimetableType } from '../utils/types';

type OwnProps = {
  setTimetableType: React.Dispatch<React.SetStateAction<TimetableType>>;
};

const HeaderPanel : FC<OwnProps> = ({setTimetableType}) => {
  const { width } = useWindowDimensions();
  const shouldShrinkSearchBar = useMemo(() => width < SCREEN_BREAKPOINT, [width]);
  const [shrinkSearchBar, setShrinkSearchBar] = React.useState(shouldShrinkSearchBar);
  // const [timetableType, setTimetableType] = timetableTypeState;
  

  const toggleSearchBar = () => {
    if (shouldShrinkSearchBar) {
      setShrinkSearchBar(!shrinkSearchBar);
    }
  };


  return (
    <header className={styles.header}>
      <SearchBar toggleSearchBar={toggleSearchBar} /> 
      {!shrinkSearchBar && shouldShrinkSearchBar ?
        null 
        :
        <nav className={styles['nav-buttons']}>
          <select name="timetable-types" onChange={(e) => setTimetableType(e.target.value as TimetableType)}>
            <option value="timetable">Студент</option>
            <option value="selective">Вибіркові</option> 
            <option value="lecturer">Викладач</option>
          </select>
          <SavedMenu />
          {/* <ThemesIcon /> */}
        </nav> 
      }
    </header>
  )
};

export default HeaderPanel;