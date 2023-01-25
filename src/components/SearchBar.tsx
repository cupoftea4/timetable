import { FC } from 'react';
import SearchIcon from '../assets/SearchIcon';
import styles from './SearchBar.module.scss';
import DatalistInput from 'react-datalist-input';
import 'react-datalist-input/dist/styles.scss';
import TimetableManager from '../utils/TimetableManager';
import { useNavigate } from 'react-router-dom';
import { TimetableType } from '../utils/types';
import useOnClickOutside from '../hooks/useOnOutsideClick';

const getSearchBarOptions = () => {
  return (
    TimetableManager.cachedGroups.map(group => ({id: group + '-student', value: group}))
  ).concat(
    TimetableManager.cachedSelectiveGroups.map(selective => ({id: selective + '-selective', value: selective}))
  ).concat(
    TimetableManager.cachedLecturers.map(lecturer => ({id: lecturer + '-lecturer', value: lecturer}))
  )
}

type OwnProps = {
  toggleSearchBar: (state?: boolean) => void;
  timetableType?: TimetableType;
  show: boolean;
}

const SearchBar: FC<OwnProps> = ({toggleSearchBar, show}) => {
  const options = getSearchBarOptions();;
  const navigate = useNavigate();
  const ref = useOnClickOutside(() => toggleSearchBar(false));

  return (
    <span className={`${styles.bar} ${!show && styles['hidden-search']}`} ref={ref}>
      <SearchIcon onClick={() => toggleSearchBar()}/>
      <span className={styles.search}>
        <DatalistInput
          placeholder={"Розклад..."}
          label=""
          onSelect={item => navigate(`/${item.value}`)}
          items={options}
        />
      </span>
    </span>
  )
};

export default SearchBar;