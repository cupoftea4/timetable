import SearchIcon from "@/assets/SearchIcon";
import useOnClickOutside from "@/hooks/useOnOutsideClick";
import VirtualizedDataList from "@/shared/VirtualizedDataList";
import { classes } from "@/styles/utils";
import { getAllTimetables } from "@/utils/timetable";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import "react-datalist-input/dist/styles.css";
import { useSearchBarFocus } from "@/context/searchBarFocus";
import type { TimetableType } from "@/types/timetable";
import styles from "./SearchBar.module.scss";

const getSearchBarOptions = () => {
  return getAllTimetables().map((group) => ({ id: group, value: group }));
};

type OwnProps = {
  toggleSearchBar: (state?: boolean) => void;
  timetableType?: TimetableType;
  show: boolean;
};

const SearchBar: FC<OwnProps> = ({ toggleSearchBar, show }) => {
  const { isFocused } = useSearchBarFocus();
  const options = getSearchBarOptions();
  const navigate = useNavigate();
  const ref = useOnClickOutside(() => {
    toggleSearchBar(false);
  });

  return (
    <span className={classes(styles.bar, !show && styles["hidden-search"])} ref={ref}>
      <SearchIcon
        onClick={() => {
          toggleSearchBar();
        }}
      />
      <span className={styles.search}>
        <VirtualizedDataList
          options={options}
          onSelect={(item) => {
            navigate(`/${item.id}`, { state: { source: "search-bar", isCustom: item.isCustom } });
          }}
          placeholder="Розклад..."
          ignoreSpecialCharacters
          allowCustomValue
          autoFocus
          isExpanded={isFocused}
        />
      </span>
    </span>
  );
};

export default SearchBar;
