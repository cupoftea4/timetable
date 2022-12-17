import { useState } from 'react';
import { Link } from 'react-router-dom';
import CheckMarkIcon from '../assets/CheckMarkIcon';
import HeartIcon from '../assets/HeartIcon';
import RemoveIcon from '../assets/RemoveIcon';
import TimetableManager from '../utils/TimetableManager'; 
import styles from './SavedMenu.module.scss';

const MAX_SAVED_ITEMS = 5;

const SavedMenu = ({likable}: { likable?: boolean}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [savedGroups, setSavedGroups] = useState<string[]>(getCachedGroups);
    
  function getCachedGroups(): string[] {
    console.log(TimetableManager.getCachedTimetables());
    const cachedGroups = TimetableManager.getCachedTimetables()
    return cachedGroups.slice(Math.max(cachedGroups.length - MAX_SAVED_ITEMS, 0))
                       .map(item => item.group);
  }

  const openMenu = () => setIsMenuOpen(true);

  const closeMenu = () => setIsMenuOpen(false);

  const deleteItem = (index: number) => {
    TimetableManager.deleteTimetable(savedGroups[index]).then(
      () => setSavedGroups(getCachedGroups())
    );
  };

  const likeItem = () => {
    setIsLiked(!isLiked);
    setSavedGroups(getCachedGroups);
  };
  
  return (
    <div className={styles.saved}
      onMouseEnter={openMenu}  onMouseLeave={closeMenu} 
      onFocusCapture={openMenu} onBlur={closeMenu} 
    >
      <button style={{background: "transparent", border: 0}} onClick={likeItem}>
        <HeartIcon liked={likable && isLiked}/>
      </button>
      {isMenuOpen &&
        <div className={styles['saved-menu']}>
          <span>{savedGroups.length !== 0 ? "Saved" : "No saved items. Open any timetable to automatically save it."}</span>
          <ul>
            {savedGroups.map((group, index) => (
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


