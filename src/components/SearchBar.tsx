import { useState } from 'react';
import SearchIcon from '../assets/SearchIcon';
import styles from './SearchBar.module.scss';
import useWindowDimensions from '../hooks/useWindowDimensions';
import DatalistInput from 'react-datalist-input';
import 'react-datalist-input/dist/styles.scss';
import TimetableManager from '../utils/TimetableManager';
import { useNavigate } from 'react-router-dom';
import { SCREEN_BREAKPOINT } from '../utils/constants';
import { TimetableType } from '../utils/types';

const getSearchBarOptions = (timetableType: TimetableType) => {
  switch (timetableType) {
    case "lecturer":
      return TimetableManager.getCachedLecturers().map(lecturer => ({id: lecturer, value: lecturer}));
    case "selective":
      return TimetableManager.getCachedSelectiveGroups().map(selective => ({id: selective, value: selective}));
    case "timetable":
      return TimetableManager.getCachedGroups().map(group => ({id: group, value: group}));
  }
}

const SearchBar = ( {toggleSearchBar, timetableType}: {toggleSearchBar: Function, timetableType: TimetableType} ) => {
  const { width } = useWindowDimensions();
  const [showSearchBar, setShowSearchBar] = useState(width > SCREEN_BREAKPOINT);
  const options = getSearchBarOptions(timetableType);;
  const navigate = useNavigate();



  return (
    <span className={`${styles.bar} ${!showSearchBar && styles['hidden-search']}`}>
      <SearchIcon onClick={() => {
          if (width < SCREEN_BREAKPOINT) {
            setShowSearchBar(!showSearchBar);
            toggleSearchBar();
          } 
        }}/>
      <span className={styles.search}>
        <DatalistInput
          placeholder="Група"
          label=""
          onSelect={item => navigate(`/${item.value}`)}
          items={[{id: "group", value: "i don't exist"}, ...options]}
        />
      </span>
    </span>
  )
};

export default SearchBar;