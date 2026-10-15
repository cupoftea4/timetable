import type { FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useMediaQuery";
import MobileSelect from "@/shared/MobileSelect";
import { classes } from "@/styles/utils";
import type { TimetableType } from "@/types/timetable";
import styles from "./Navigation.module.scss";

const navigationItems: Array<{ value: TimetableType; name: string }> = [
  { value: "timetable", name: "Студент" },
  { value: "selective", name: "Вибіркові" },
  { value: "lecturer", name: "Викладач" },
  { value: "postgraduate", name: "Аспірант" },
];

type OwnProps = {
  timetableType: TimetableType;
};

const Navigation: FC<OwnProps> = ({ timetableType }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const onMobileSelectChange = (type: string) => {
    navigate(`/${type === "timetable" ? "home" : type}`, { state: { force: true } });
  };

  return (
    <nav className={styles["timetable-types"]}>
      {!isMobile ? (
        navigationItems.map((type) => (
          <Link
            state={{ force: true }}
            to={`/${type.value === "timetable" ? "home" : type.value}`}
            key={type.value}
            className={classes(styles["nav-link"], timetableType === type.value && styles.active)}
          >
            {type.name}
          </Link>
        ))
      ) : (
        <MobileSelect
          label="Розклад для"
          items={navigationItems}
          selectedState={[timetableType, onMobileSelectChange]}
        />
      )}
    </nav>
  );
};

export default Navigation;
