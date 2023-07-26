import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import useOnClickOutside from '@/hooks/useOnOutsideClick';
import { getAllTimetables } from '@/utils/timetable';
import VirtualizedDataList from '@/shared/VirtualizedDataList';
import { classes } from '@/styles/utils';
import SearchIcon from '@/assets/SearchIcon';
import 'react-datalist-input/dist/styles.css';
import styles from './SearchBar.module.scss';
import type { TimetableType } from '@/types/timetable';

const getSearchBarOptions = () => {
  return getAllTimetables().map(group => ({ id: group, value: group }));
};

type OwnProps = {
  toggleSearchBar: (state?: boolean) => void
  timetableType?: TimetableType
  show: boolean
};

const SearchBar: FC<OwnProps> = ({ toggleSearchBar, show }) => {
  const options = getSearchBarOptions();
  const navigate = useNavigate();
  const ref = useOnClickOutside(() => { toggleSearchBar(false); });

  return (
    <span className={classes(styles.bar, !show && styles['hidden-search'])} ref={ref}>
      <SearchIcon onClick={() => { toggleSearchBar(); }}/>
      <span className={styles.search}>
        <VirtualizedDataList
          options={options}
          onSelect={item => { navigate(`/${item.value}`); }}
          placeholder="Розклад..."
         />
      </span>
    </span>
  );
};

export default SearchBar;
