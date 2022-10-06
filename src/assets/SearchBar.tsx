import { useState } from 'react';
import SearchIcon from './SearchIcon';
import styles from './SearchBar.module.scss';
import useWindowDimensions from '../hooks/useWindowDimentions';

const SearchBar = ( {toggleSearchBar}: {toggleSearchBar: Function} ) => {
  const { width } = useWindowDimensions();
  const [showSearchBar, setShowSearchBar] = useState(width > 600);
  // const showSearchBar = width > 600;

  return (
    <span className={`${styles.bar} ${!showSearchBar && styles.hiddenSearch}`}>
      <SearchIcon onClick={() => {
          setShowSearchBar(!showSearchBar);
          toggleSearchBar();
        }}/>
      <span className={styles.search}>
        <input type="text" placeholder="Search" />
      </span>
    </span>
  )
}

export default SearchBar