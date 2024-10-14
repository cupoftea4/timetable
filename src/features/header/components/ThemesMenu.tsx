import { type FC, useState } from 'react';
import { classes } from '@/styles/utils';
import styles from './SavedMenu.module.scss';
import ThemesIcon from '@/assets/ThemesIcon';
import { type ThemeType, type ThemeValue } from '@/utils/themes';

type OwnProps = {
  themes: ThemeType[]
  onThemeSelect: (theme: ThemeValue) => void
};

const ThemesMenu: FC<OwnProps> = ({ themes, onThemeSelect }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(0);

  const openMenu = () => { setIsMenuOpen(true); };

  const closeMenu = () => { setIsMenuOpen(false); };

  const arrowNavigation = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedItem((selectedItem + 1) % themes.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedItem((selectedItem - 1) % themes.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (themes[selectedItem]) {
        onThemeSelect(themes[selectedItem]!.value);
      }
    } else if (e.key === 'Escape') {
      closeMenu();
    }
  };

  return (
    <div className={styles.saved} tabIndex={0}
      onMouseEnter={openMenu} onMouseLeave={closeMenu}
      onFocusCapture={openMenu} onKeyDown={arrowNavigation}
      aria-expanded={isMenuOpen ? 'true' : 'false'}
      aria-controls="themes-menu"
      aria-label="Themes"
      role="button"
    >
      <ThemesIcon />
      {isMenuOpen &&
        <div
          className={classes(styles['saved-menu'])}
          id="saved-menu"
          aria-hidden={!isMenuOpen ? 'true' : 'false'}
        >
          <span className={styles.title}>
            {'Tеми'}
          </span>
          <ul>
            {themes.map((group, index) => (
              <li key={index} className={selectedItem === index ? styles.selected : ''}>
                <button
                  className={styles['list-item']}
                  onFocus={() => { setSelectedItem(index); }}
                  onClick={() => {
                    onThemeSelect(group.value);
                    closeMenu();
                  }}
                >
                  <span
                    className={styles.name}
                  >
                    <span className={styles['color-preview']} style={{
                      background: 'linear-gradient(' + group.color1 + ' 0%, ' + group.color2 + ' 100%)',
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '5px'
                    }} />
                    {group.name}
                  </span>
                </button>
              </li>
            ))}
              <li style={{
                display: 'none'
              }}>
                <a
                  href='https://youtu.be/dQw4w9WgXcQ?si=esIswhvrHUZ9J8Ox'
                  target='_blank'
                  rel='noreferrer'
                  className={styles['gradient-text']}
                >
                  Click me to get free money
                </a>
              </li>
          </ul>
        </div>
      }
    </div>
  );
};

export default ThemesMenu;
