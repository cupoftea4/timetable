import SavedMenu from './SavedMenu'
import React, { useMemo } from 'react'
import SearchBar from '../assets/SearchBar';
import ThemesIcon from '../assets/ThemesIcon';
import useWindowDimensions from '../hooks/useWindowDimentions';
import styles from './HeaderPanel.module.scss';

const likedGroups = [ 'ПЗ-22', 'КН-21', 'ПЗ-46'];

const HeaderPanel = () => {
  const { width } = useWindowDimensions();
  const shouldShrinkSearchBar = useMemo(() => width < 600, [width]);
  const [shrinkSearchBar, setShrinkSearchBar] = React.useState(shouldShrinkSearchBar);


  const toggleSearchBar = () => {
    if (shouldShrinkSearchBar) {
      setShrinkSearchBar(!shrinkSearchBar);
    }
  }


  return (
    <header>
      <SearchBar toggleSearchBar={toggleSearchBar} /> 
      {!shrinkSearchBar && shouldShrinkSearchBar ?
        null 
        :
        <nav className={styles['nav-buttons']}>
          <SavedMenu savedGroups={likedGroups} />
          <ThemesIcon />
        </nav> 
      }
    </header>
  )
}

export default HeaderPanel;