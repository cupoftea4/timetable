import SavedMenu from './SavedMenu'
import React, { useMemo } from 'react'
import SearchBar from './SearchBar';
import ThemesIcon from '../assets/ThemesIcon';
import useWindowDimensions from '../hooks/useWindowDimensions';
import styles from './HeaderPanel.module.scss';
import { SCREEN_BREAKPOINT } from '../utils/constants';

const HeaderPanel = () => {
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
      <SearchBar toggleSearchBar={toggleSearchBar} /> 
      {!shrinkSearchBar && shouldShrinkSearchBar ?
        null 
        :
        <nav className={styles['nav-buttons']}>
          <SavedMenu />
          <ThemesIcon />
        </nav> 
      }
    </header>
  )
};

export default HeaderPanel;