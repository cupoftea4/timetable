import { FC } from 'react';
import SearchIcon from '../assets/SearchIcon';
import styles from './SearchBar.module.scss';
import 'react-datalist-input/dist/styles.scss';
import { useNavigate } from 'react-router-dom';
import { TimetableType } from '../utils/types';
import useOnClickOutside from '../hooks/useOnOutsideClick';
import TimetableUtil from '../utils/TimetableUtil';
import VirtualizedDataList from './VirtualizedDataList';
import { classes } from '../styles/utils';

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
    <span className={classes(styles.bar, !show && styles['hidden-search'])} ref={ref}>
      <SearchIcon onClick={() => toggleSearchBar()}/>
      <span className={styles.search}>
        <VirtualizedDataList
          options={options}
          onSelect={item => navigate(`/${item.value}`)}
          placeholder="Розклад..."
         />
      </span>
    </span>
  )
};

export default SearchBar;