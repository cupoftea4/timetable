import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@/assets/SearchIcon";
import { useDatalistFocus } from "@/context/datalistFocus";
import VirtualizedDataList from "@/shared/VirtualizedDataList";
import { classes } from "@/styles/utils";
import type { TimetableType } from "@/types/timetable";
import { getAllTimetables, getTimetableName } from "@/utils/timetable";
import styles from "./SearchBar.module.scss";

const getSearchBarOptions = () => {
  return getAllTimetables().map((group) => ({ id: group, value: getTimetableName(group) }));
};

type OwnProps = {
  toggleSearchBar: (state?: boolean) => void;
  timetableType?: TimetableType;
  show: boolean;
};

const SearchBar: FC<OwnProps> = ({ toggleSearchBar, show }) => {
  const { ref: datalistRef } = useDatalistFocus();
  const options = getSearchBarOptions();
  const navigate = useNavigate();

  return (
    <span className={classes(styles.bar, !show && styles["hidden-search"])}>
      <button
        onClick={() => {
          toggleSearchBar();
        }}
        type="button"
        className={styles["search-icon"]}
      >
        <SearchIcon />
      </button>
      <span className={styles.search}>
        <VirtualizedDataList
          options={options}
          onClose={() => toggleSearchBar(false)}
          onSelect={(item) => {
            navigate(`/${item.id}`, { state: { source: "search-bar", isCustom: item.isCustom } });
          }}
          placeholder="Розклад..."
          optionsClassName={styles.options}
          ignoreSpecialCharacters
          allowCustomValue
          autoFocus
          containerRef={datalistRef}
        />
      </span>
    </span>
  );
};

export default SearchBar;
