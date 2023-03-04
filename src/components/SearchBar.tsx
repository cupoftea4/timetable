import { FC } from 'react';
import SearchIcon from '../assets/SearchIcon';
import styles from './SearchBar.module.scss';
import DatalistInput from 'react-datalist-input';
import 'react-datalist-input/dist/styles.scss';
import { useNavigate } from 'react-router-dom';
import { TimetableType } from '../utils/types';
import useOnClickOutside from '../hooks/useOnOutsideClick';
import TimetableUtil from '../utils/TimetableUtil';

const getSearchBarOptions = () => {
  return TimetableUtil.getAllTimetables().map(group => ({id: group, value: group}));
}

type OwnProps = {
  toggleSearchBar: (state?: boolean) => void;
  timetableType?: TimetableType;
  show: boolean;
}

const SearchBar: FC<OwnProps> = ({toggleSearchBar, show}) => {
  const options = getSearchBarOptions();
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