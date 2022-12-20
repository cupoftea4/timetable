import { useState } from 'react';
import SearchIcon from '../assets/SearchIcon';
import styles from './SearchBar.module.scss';
import useWindowDimensions from '../hooks/useWindowDimensions';
import DatalistInput from 'react-datalist-input';
import 'react-datalist-input/dist/styles.scss';
import TimetableManager from '../utils/TimetableManager';
import { useNavigate } from 'react-router-dom';

const SearchBar = ( {toggleSearchBar}: {toggleSearchBar: Function} ) => {
  const { width } = useWindowDimensions();
  const [showSearchBar, setShowSearchBar] = useState(width > 600);
  const options = TimetableManager.getCachedGroups().map(group => ({id: group, value: group}));
  const navigate = useNavigate();

  return (
    <span className={`${styles.bar} ${!showSearchBar && styles['hidden-search']}`}>
      <SearchIcon onClick={() => {
          if (width < 600) {
            setShowSearchBar(!showSearchBar);
            toggleSearchBar();
          } 
        }}/>
      <span className={styles.search}>
        <DatalistInput
          placeholder="Група"
          label=""
          onSelect={item => navigate(`/${item.value}`)}
          items={options}
        />
      </span>
    </span>
  )
};

export default SearchBar;