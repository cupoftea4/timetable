import { useIsMobile } from "@/hooks/useWindowDimensions";
import { classes } from "@/styles/utils";
import { sortGroupsByYear } from "@/utils/timetable";
import { type FC, useState } from "react";
import { Link } from "react-router-dom";
import MissingGroupTip from "./MissingGroupTip";
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
  const isMobile = useIsMobile();

  return (
    <div className={styles.timetables}>
      <div className={classes(styles.timetablesList, withYears && styles["with-years"])}>
        {withYears ? (
          [Year.First, Year.Second, Year.Third, Year.Fourth].map((year) =>
            groupsByYear[year]?.length && groupsByYear[year]?.length !== 0 ? (
              <ul
                key={year}
                className={classes(styles.year, (expandedYear === year || isMobile) && styles.expanded)}
                data-value={`${year} Курс`}
                onClick={() => {
                  if (isMobile) return;
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
                <Link to={`/${lecturer}`} state={{ source: "selection-lecturer" }}>
                  {lecturer}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <MissingGroupTip />
      </div>
    </div>
  );
};

export default TimetablesSelection;
