import { classes } from "@/styles/utils";
import type { HalfTerm } from "@/types/timetable";
import { type FC, useEffect, useState } from "react";
import styles from "./TimetablePartials.module.scss";

type OwnProps = {
  partials: HalfTerm[];
  handlePartialClick: (partial: 0 | HalfTerm) => void;
};

const TimetablePartials: FC<OwnProps> = ({ partials, handlePartialClick }) => {
  const [activePartial, setActivePartial] = useState<0 | HalfTerm>(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: I have no idea what is going on here
  useEffect(() => {
    setActivePartial(0);
  }, [partials]);

  const onPartialClick = (partial: 0 | HalfTerm) => {
    setActivePartial(partial);
    handlePartialClick(partial);
  };

  const openDropdown = () => {
    setShowDropdown(true);
  };
  const closeDropdown = () => {
    setShowDropdown(false);
  };

  return (
    <>
      {partials.length > 0 && (
        <div
          className={styles.partials}
          onMouseEnter={openDropdown}
          onMouseLeave={closeDropdown}
          onFocusCapture={openDropdown}
        >
          <button className={classes(showDropdown && styles.active)} tabIndex={-1} type="button">
            {activePartial === 0 ? "Весь семестр" : `${activePartial} півсеместр`} {showDropdown ? "▴" : "▾"}
          </button>
          {showDropdown && (
            <ul className={styles.dropdown}>
              {[0, ...partials].map((partial, index) => (
                <li key={index}>
                  <button
                    onClick={() => {
                      onPartialClick(partial);
                    }}
                    type="button"
                  >
                    {partial === 0 ? "Весь семестр" : `${partial} півсеместр`}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
};

export default TimetablePartials;
