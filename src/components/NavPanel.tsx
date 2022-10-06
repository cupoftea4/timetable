import React, { useMemo } from 'react'
import HeartIcon from '../assets/HeartIcon';
import SearchBar from '../assets/SearchBar';
import ThemesIcon from '../assets/ThemesIcon';
import useWindowDimensions from '../hooks/useWindowDimentions';
import styles from './NavPanel.module.scss';

const NavPanel = () => {
  const { width } = useWindowDimensions();
  const shouldShrinkSearchBar = useMemo(() => width < 600, [width]);
  const [shrinkSearchBar, setShrinkSearchBar] = React.useState(shouldShrinkSearchBar);
  console.log(shrinkSearchBar, shouldShrinkSearchBar);
  


  const toggleSearchBar = () => {
    if (shouldShrinkSearchBar) {
      setShrinkSearchBar(!shrinkSearchBar);
    }
  }

  return (
    <nav>
      <SearchBar toggleSearchBar={toggleSearchBar} /> 
      { !shrinkSearchBar && shouldShrinkSearchBar ?
        null 
        :
        <span className={styles.navButtons}>
          <HeartIcon liked={false} />
          <ThemesIcon />
        </span> 
      }
    </nav>
  )
}

export default NavPanel;