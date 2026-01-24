import { useIsMobile } from "@/hooks/useWindowDimensions";
import MobileSelect from "@/shared/MobileSelect";
import { classes } from "@/styles/utils";
import { formatWeekRange, getCurrentUADate, getWeekStart } from "@/utils/date";
import type { FC } from "react";
import styles from "./WeekNavigation.module.scss";

type OwnProps = {
  weeks: Date[];
  selectedWeek: Date;
  onWeekChange: (week: Date) => void;
};

const WeekNavigation: FC<OwnProps> = ({ weeks, selectedWeek, onWeekChange }) => {
  const isMobile = useIsMobile();
  const currentWeekStart = getWeekStart(getCurrentUADate());

  const weekItems = weeks.map((week) => {
    const isCurrent = week.getTime() === currentWeekStart.getTime();
    return {
      value: week.toISOString(),
      name: formatWeekRange(week, isCurrent),
    };
  });

  const selectedValue = selectedWeek.toISOString();

  const handleWeekChange = (value: string) => {
    const week = weeks.find((w) => w.toISOString() === value);
    if (week) onWeekChange(week);
  };

  if (weeks.length === 0) return null;

  return (
    <nav className={styles.weeks}>
      {!isMobile ? (
        weekItems.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => handleWeekChange(item.value)}
            className={classes(styles["week-tab"], selectedValue === item.value && styles.active)}
          >
            {item.name}
          </button>
        ))
      ) : (
        <MobileSelect items={weekItems} selectedState={[selectedValue, handleWeekChange]} />
      )}
    </nav>
  );
};

export default WeekNavigation;
