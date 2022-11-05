import { useState } from 'react';
import { Link } from 'react-router-dom';
import CheckMarkIcon from '../assets/CheckMarkIcon';
import HeartIcon from '../assets/HeartIcon';
import RemoveIcon from '../assets/RemoveIcon';
import TimetableManager from '../utils/TimetableManager';
import { CachedTimetable } from '../utils/types';
import styles from './SavedMenu.module.scss';

const MAX_SAVED_ITEMS = 5;

const SavedMenu = ({likable}: { likable?: boolean}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [savedGroups, setSavedGroups] = useState<string[]>(TimetableManager.getCachedTimetables().map((item: CachedTimetable) => item.group));

  const openMenu = () => {
    setIsMenuOpen(true);
  }

  const closeMenu = () => {
    setIsMenuOpen(false);
  }

  function deleteItem(index: number): void {
    console.log('delete item', index, savedGroups[index]);

    TimetableManager.deleteTimetable(savedGroups[index]).then(
      () => setSavedGroups(TimetableManager.getCachedTimetables().map((item: CachedTimetable) => item.group))
    );
  }
  
  return (
    <div className={styles.saved}
      onMouseEnter={openMenu}  onMouseLeave={closeMenu} 
      onFocusCapture={openMenu} onBlur={closeMenu} 
    >
      <HeartIcon onClick={() => setIsLiked(prev => !isLiked)} liked={likable && isLiked}/>
      {isMenuOpen &&
        <div className={styles['saved-menu']}>
          <span>{savedGroups.length !== 0 ? "Saved" : "No saved items. Open any timetable to automatically save it."}</span>
          <ul>
            {savedGroups.slice(0, MAX_SAVED_ITEMS).map((group, index) => (
              // TODO: add arrow navigation and data attributes?
              <li key={index}>
                <Link to={`/${group}`}> 
                  <span>{group} {index === 0 ? <CheckMarkIcon className={styles['check-mark']}/> : null}</span> 
                </Link>
                <RemoveIcon onClick={() => deleteItem(index)} className={styles.remove}/>
              </li>
            ))} 
          </ul>
        </div>
      }
    </div>
  );
};

export default SavedMenu;


