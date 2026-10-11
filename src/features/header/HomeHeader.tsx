import { type FC, useEffect, useState } from "react";
import { useDatalistFocus } from "@/context/datalistFocus";
import useMediaQuery, { useIsTablet } from "@/hooks/useMediaQuery";
import { classes } from "@/styles/utils";
import type { TimetableType } from "@/types/timetable";
import { NARROW_SCREEN_BREAKPOINT, TABLET_SCREEN_BREAKPOINT } from "@/utils/constants";
import Navigation from "./components/Navigation";
import SavedMenu from "./components/SavedMenu";
import SearchBar from "./components/SearchBar";
import ThemeButton from "./components/ThemeButton";
import styles from "./HeaderPanel.module.scss";

type OwnProps = {
  timetableType: TimetableType;
  className?: string;
};

const HeaderPanel: FC<OwnProps> = ({ timetableType, className }) => {
  const shouldShrinkSearchBar = useMediaQuery(
    `(min-width: ${NARROW_SCREEN_BREAKPOINT + 0.02}px) and (max-width: ${TABLET_SCREEN_BREAKPOINT - 0.02}px)`
  );
  const isNarrow = useIsTablet();
  const { isFocused, blur } = useDatalistFocus();
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
    }
  }, [showSearchBar, blur]);

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
          {isNarrow ? <ThemeButton /> : <SavedMenu />}
          {/* <ThemesIcon /> */}
        </div>
      )}
    </header>
  );
};

export default HeaderPanel;
