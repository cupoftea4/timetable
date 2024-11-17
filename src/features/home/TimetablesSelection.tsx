import { useDatalistFocus } from "@/context/datalistFocus";
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
  const { focus } = useDatalistFocus();

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
            <span className="font-bold">Не знайшли свою групу?</span> Спробуйте ввести назву групи в{" "}
            <span className={styles.link} onClick={() => focus()}>
              полі пошуку
            </span>
            .
          </p>
          <p>
            Альтернативно: ви також можете додати назву групи до посилання, як у цьому прикладі:{" "}
            <span className="text-nowrap">{window.location.origin}/ОІ-32</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimetablesSelection;
