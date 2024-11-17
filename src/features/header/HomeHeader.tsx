import { useDatalistFocus } from "@/context/datalistFocus";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import { classes } from "@/styles/utils";
import type { TimetableType } from "@/types/timetable";
import { NARROW_SCREEN_BREAKPOINT, TABLET_SCREEN_BREAKPOINT } from "@/utils/constants";
import { type FC, useEffect, useMemo, useState } from "react";
import styles from "./HeaderPanel.module.scss";
import Navigation from "./components/Navigation";
import SavedMenu from "./components/SavedMenu";
import SearchBar from "./components/SearchBar";

type OwnProps = {
  timetableType: TimetableType;
  className?: string;
};

const HeaderPanel: FC<OwnProps> = ({ timetableType, className }) => {
  const { width } = useWindowDimensions();
  const shouldShrinkSearchBar = useMemo(
    () => width < TABLET_SCREEN_BREAKPOINT && width > NARROW_SCREEN_BREAKPOINT,
    [width]
  );
  const { isFocused, blur, focus } = useDatalistFocus();
  const [showSearchBar, setShowSearchBar] = useState(!shouldShrinkSearchBar || isFocused);

  useEffect(() => {
    const onPopstate = () => setShowSearchBar(false);
    window.addEventListener("popstate", onPopstate);
    return () => {
      window.removeEventListener("popstate", onPopstate);
    };
  }, []);

  useEffect(() => {
    if (isFocused) {
      setShowSearchBar(true);
    }
  }, [isFocused]);

  useEffect(() => {
    if (!showSearchBar) {
      blur();
    } else {
      focus();
    }
  }, [showSearchBar, blur, focus]);

  const toggleSearchBar = (state = !showSearchBar) => {
    if (shouldShrinkSearchBar) {
      setShowSearchBar(state);
    }
  };

  return (
    <header className={classes(styles.header, className)}>
      <SearchBar toggleSearchBar={toggleSearchBar} show={showSearchBar} />
      {showSearchBar && shouldShrinkSearchBar ? null : (
        <div className={styles["right-buttons"]}>
          <Navigation timetableType={timetableType} />
          <SavedMenu />
          {/* <ThemesIcon /> */}
        </div>
      )}
    </header>
  );
};

export default HeaderPanel;
