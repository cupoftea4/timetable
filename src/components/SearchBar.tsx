import { useState } from 'react';
import SearchIcon from '../assets/SearchIcon';
import styles from './SearchBar.module.scss';
import useWindowDimensions from '../hooks/useWindowDimensions';


// TODO: refactor generic html elements (div, span, etc.)
const SearchBar = ( {toggleSearchBar}: {toggleSearchBar: Function} ) => {
  const { width } = useWindowDimensions();
  const [showSearchBar, setShowSearchBar] = useState(width > 600);

  return (
    <span className={`${styles.bar} ${!showSearchBar && styles['hidden-search']}`}>
      <SearchIcon onClick={() => {
          if (width < 600) {
            setShowSearchBar(!showSearchBar);
            toggleSearchBar();
          }
        }}/>
      <span className={styles.search}>
        <input type="text" placeholder="Search" />
      </span>
    </span>
  )
};

export default SearchBar;