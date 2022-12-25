import SavedMenu from './SavedMenu'
import React, { FC, useMemo } from 'react'
import SearchBar from './SearchBar';
// import ThemesIcon from '../assets/ThemesIcon';
import useWindowDimensions from '../hooks/useWindowDimensions';
import styles from './HeaderPanel.module.scss';
import { SCREEN_BREAKPOINT } from '../utils/constants';

type OwnProps = {
  timetableTypeState: [string, React.Dispatch<React.SetStateAction<"timetable" | "postgraduates" | "selective" | "lecturer">>];
};

const HeaderPanel : FC<OwnProps> = ({timetableTypeState}) => {
  const { width } = useWindowDimensions();
  const shouldShrinkSearchBar = useMemo(() => width < SCREEN_BREAKPOINT, [width]);
  const [shrinkSearchBar, setShrinkSearchBar] = React.useState(shouldShrinkSearchBar);
  const [timetableType, setTimetableType] = timetableTypeState;
  console.log(timetableType);
  

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
          <select name="timetable-types" onChange={(e) => setTimetableType(e.target.value as "timetable" | "postgraduates" | "selective" | "lecturer")}>
            <option value="timetable">Бакалавр</option>
            <option value="postgraduates">Аспірант</option>
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