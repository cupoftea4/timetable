import { classes } from "@/styles/utils";
import { sortGroupsByYear } from "@/utils/timetable";
import { type FC, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TimetablesSelection.module.scss";

enum Year {
  First = 1,
  Second = 2,
  Third = 3,
  Fourth = 4,
}

type OwnProps = {
  timetables: string[];
  withYears?: boolean;
};

const TimetablesSelection: FC<OwnProps> = ({ timetables, withYears = false }) => {
  const groupsByYear = sortGroupsByYear(timetables);
  const [expandedYear, setExpandedYear] = useState<Year | null>(null); // for mobile onClick event and keyboard navigation
  function handleClickOnSearch() {
    document.querySelector("input")?.focus();
  }

  return (
    <div className={styles.timetables}>
      <div className={classes(styles.timetablesList, withYears && styles["with-years"])}>
        {withYears ? (
          [Year.First, Year.Second, Year.Third, Year.Fourth].map((year) =>
            groupsByYear[year]?.length && groupsByYear[year]?.length !== 0 ? (
              <ul
                key={year}
                className={classes(styles.year, expandedYear === year && styles.expanded)}
                data-value={`${year} Курс`}
                onClick={() => {
                  expandedYear === year ? setExpandedYear(null) : setExpandedYear(year);
                }}
              >
                {groupsByYear[year]?.map((group) => (
                  <li key={group}>
                    <Link
                      to={`/${group}`}
                      state={{ source: "selection" }}
                      onFocus={() => {
                        setExpandedYear(year);
                      }}
                    >
                      {group}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null
          )
        ) : (
          <ul>
            {timetables.map((lecturer) => (
              <li key={lecturer}>
                <Link to={`/${lecturer}`} state={{ source: "selection-lecturer" }}>{lecturer}</Link>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.timetablesInfo}>
          <p>
             Не знайшли свою групу? Якщо ваша група не відображається у списку, введіть назву групи в полі{" "}
            <span onClick={handleClickOnSearch}>пошуку</span>.
          </p>
          <p>
            Альтернативно: ви також можете додати назву групи до посилання, як у цьому прикладі:
            https://lpnu.pp.ua/ОІ-32
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimetablesSelection;
