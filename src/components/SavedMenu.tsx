import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CheckMarkIcon from '../assets/CheckMarkIcon';
import HeartIcon from '../assets/HeartIcon';
import RemoveIcon from '../assets/RemoveIcon';
import TimetableManager from '../utils/TimetableManager'; 
import styles from './SavedMenu.module.scss';
import * as errors from '../utils/errorConstants';

const MAX_SAVED_ITEMS = 5;

const SavedMenu = ({likable}: { likable?: boolean}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [savedGroups, setSavedGroups] = useState<string[]>(getCachedGroups);
  const [selectedItem, setSelectedItem] = useState(0);
  const navigate = useNavigate();
    
  function getCachedGroups(): string[] {
    const cachedGroups = TimetableManager.getCachedTimetables()
    return cachedGroups.slice(Math.max(cachedGroups.length - MAX_SAVED_ITEMS, 0))
                       .map(item => item.group);
  }

  const openMenu = () => setIsMenuOpen(true);

  const closeMenu = () => setIsMenuOpen(false);

  const deleteItem = (index: number) => {
    TimetableManager.deleteTimetable(savedGroups[index]).then(
      () => setSavedGroups(getCachedGroups())
    ).catch((e) => errors.handleError(e, errors.DELETE_TIMETABLE_ERROR));
  };

  const likeItem = () => {
    setIsLiked(!isLiked);
    setSavedGroups(getCachedGroups);
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
      <HeartIcon onClick={likeItem} liked={likable && isLiked}  />
      {isMenuOpen &&
        <div className={styles['saved-menu']} >
          <span>
            {savedGroups.length !== 0 ? "Saved" : "No saved items. Open any timetable to automatically save it."}
          </span>
          <ul>
            {savedGroups.map((group, index) => (
              <li key={index} className={selectedItem === index ? styles.selected : ""}>
                <Link to={`/${group}`} onFocus={() => setSelectedItem(index)}> 
                  <span>{group} {index === 0 ? <CheckMarkIcon className={styles['check-mark']}/> : null}</span> 
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