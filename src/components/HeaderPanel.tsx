import SavedMenu from './SavedMenu'
import { FC, useMemo, useState } from 'react'
import SearchBar from './SearchBar';
// import ThemesIcon from '../assets/ThemesIcon';
import useWindowDimensions from '../hooks/useWindowDimensions';
import styles from './HeaderPanel.module.scss';
import { TABLET_SCREEN_BREAKPOINT, NARROW_SCREEN_BREAKPOINT } from '../utils/constants';
import { TimetableType } from '../utils/types';
import Navigation from './Navigation';
import { classes } from '../styles/utils';

type OwnProps = {
  timetableType: TimetableType;
  className?: string;
};

const HeaderPanel : FC<OwnProps> = ({timetableType, className}) => {
  const { width } = useWindowDimensions();
  const shouldShrinkSearchBar = useMemo(() => width < TABLET_SCREEN_BREAKPOINT && width > NARROW_SCREEN_BREAKPOINT, [width]);
  const [showSearchBar, setShowSearchBar] = useState(!shouldShrinkSearchBar);

  const toggleSearchBar = (state = !showSearchBar) => {
    if (shouldShrinkSearchBar) {
      setShowSearchBar(state);
    }
  };

  return (
    <header className={classes(styles.header, className)} >
      <SearchBar toggleSearchBar={toggleSearchBar} show={showSearchBar} /> 
      {showSearchBar && shouldShrinkSearchBar ?
        null 
        :
        <div className={styles['right-buttons']}>
          <Navigation timetableType={timetableType} />
          <SavedMenu />
          {/* <ThemesIcon /> */}
        </div> 
      }
    </header>
  )
};

export default HeaderPanel;