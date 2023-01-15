import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CheckMarkIcon from '../assets/CheckMarkIcon';
import HistoryIcon from '../assets/HistoryIcon';
import RemoveIcon from '../assets/RemoveIcon';
import TimetableManager from '../utils/TimetableManager'; 
import styles from './SavedMenu.module.scss';
import * as handler from '../utils/requestHandler';

const MAX_SAVED_ITEMS = 5;

const SavedMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const groupParam = useParams().group?.trim();
  const [savedGroups, setSavedGroups] = useState<string[]>(getCachedGroups);
  const [selectedItem, setSelectedItem] = useState(0);
  const navigate = useNavigate();
    
  function getCachedGroups(): string[] {
    const cachedGroups = TimetableManager.getCachedTimetables()
    const groups = cachedGroups.slice(Math.max(cachedGroups.length - MAX_SAVED_ITEMS, 0))
                       .map(item => item.group)
    return groups;
  }

  const openMenu = () => setIsMenuOpen(true);

  const closeMenu = () => setIsMenuOpen(false);

  const deleteItem = (index: number) => {
    TimetableManager.deleteTimetable(savedGroups[index]).then(
      () => setSavedGroups(getCachedGroups())
    ).catch((e) => handler.handleError(e, handler.DELETE_TIMETABLE_ERROR));
  };

  const arrowNavigation = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedItem((selectedItem + 1) % savedGroups.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedItem((selectedItem - 1) % savedGroups.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (savedGroups[selectedItem]) {
        navigate(`/${savedGroups[selectedItem]}`);
      }
    } else if (e.key === "Escape") {
      closeMenu();
    }

  }
  
  return (
    <div className={styles.saved} tabIndex={0}
      onMouseEnter={openMenu}  onMouseLeave={closeMenu} 
      onFocusCapture={openMenu} onKeyDown={arrowNavigation}
      aria-expanded={isMenuOpen}
      aria-label="Saved groups menu"
    >
      <HistoryIcon />
      {isMenuOpen &&
        <div className={`${styles['saved-menu']} ${groupParam && styles.home}`} >
          <span>
            {savedGroups.length !== 0 ? "Збережені" : "Немає збережених. Відкрийте будь-який розклад, щоб автоматично зберегти."}
          </span>
          <ul>
            {savedGroups.map((group, index) => (
              <li key={index} className={selectedItem === index ? styles.selected : ""}>
                <Link to={`/${group}`} onFocus={() => setSelectedItem(index)}> 
                  <span>
                    {group} 
                    {groupParam === group ? <CheckMarkIcon className={styles['check-mark']}/> : null}
                  </span> 
                </Link>
                <RemoveIcon onClick={() => deleteItem(index)} className={styles.remove} />
              </li>
            ))} 
          </ul>
        </div>
      }
    </div>
  );
};

export default SavedMenu;