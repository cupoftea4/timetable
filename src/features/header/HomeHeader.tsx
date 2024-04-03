import { type FC, useMemo, useState } from 'react';
import SavedMenu from './components/SavedMenu';
import SearchBar from './components/SearchBar';
import Navigation from './components/Navigation';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { TABLET_SCREEN_BREAKPOINT, NARROW_SCREEN_BREAKPOINT } from '@/utils/constants';
import { classes } from '@/styles/utils';
import styles from './HeaderPanel.module.scss';
import type { TimetableType } from '@/types/timetable';
import ThemesMenu from './components/ThemesMenu';
import { themes, type ThemeValue } from '@/utils/themes';

type OwnProps = {
  timetableType: TimetableType
  setTheme: React.Dispatch<React.SetStateAction<ThemeValue>>
  className?: string
};

const HeaderPanel: FC<OwnProps> = ({ timetableType, className, setTheme }) => {
  const { width } = useWindowDimensions();
  const shouldShrinkSearchBar = useMemo(
    () => width < TABLET_SCREEN_BREAKPOINT && width > NARROW_SCREEN_BREAKPOINT, [width]
  );
  const [showSearchBar, setShowSearchBar] = useState(!shouldShrinkSearchBar);

  const toggleSearchBar = (state = !showSearchBar) => {
    if (shouldShrinkSearchBar) {
      setShowSearchBar(state);
    }
  };

  return (
    <header className={classes(styles.header, className)} >
      <SearchBar toggleSearchBar={toggleSearchBar} show={showSearchBar} />
      {showSearchBar && shouldShrinkSearchBar
        ? null
        : <div className={styles['right-buttons']}>
          <Navigation timetableType={timetableType} />
          <SavedMenu />
          <ThemesMenu themes={themes} onThemeSelect={setTheme} />
        </div>
      }
    </header>
  );
};

export default HeaderPanel;
