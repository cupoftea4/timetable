import { FC } from 'react';
import SearchIcon from '../assets/SearchIcon';
import styles from './SearchBar.module.scss';
import DatalistInput from 'react-datalist-input';
import 'react-datalist-input/dist/styles.scss';
import TimetableManager from '../utils/TimetableManager';
import { useNavigate } from 'react-router-dom';
import { TimetableType } from '../utils/types';

const getSearchBarOptions = (timetableType: TimetableType) => {
  switch (timetableType) {
    case "lecturer":
      return TimetableManager.cachedLecturers.map(lecturer => ({id: lecturer, value: lecturer}));
    case "selective":
      return TimetableManager.cachedSelectiveGroups.map(selective => ({id: selective, value: selective}));
    case "timetable":
      return TimetableManager.cachedGroups.map(group => ({id: group, value: group}));
  }
}

type OwnProps = {
  toggleSearchBar: Function;
  timetableType: TimetableType;
  show: boolean;
}

const SearchBar: FC<OwnProps> = ({toggleSearchBar, timetableType, show}) => {
  const options = getSearchBarOptions(timetableType);;
  const navigate = useNavigate();

  return (
    <span className={`${styles.bar} ${!show && styles['hidden-search']}`}>
      <SearchIcon onClick={() => toggleSearchBar()}/>
      <span className={styles.search}>
        <DatalistInput
          placeholder={timetableType === "lecturer" ? "Викладач" : "Група"}
          label=""
          onSelect={item => navigate(`/${item.value}`)}
          items={options}
        />
      </span>
    </span>
  )
};

export default SearchBar;