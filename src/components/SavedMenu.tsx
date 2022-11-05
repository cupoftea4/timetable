import { useState } from 'react';
import CheckMarkIcon from '../assets/CheckMarkIcon';
import HeartIcon from '../assets/HeartIcon';
import RemoveIcon from '../assets/RemoveIcon';
import styles from './SavedMenu.module.scss';

const MAX_SAVED_ITEMS = 5;

const SavedMenu = ({savedGroups}: {savedGroups: string[]}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = () => {
    setIsMenuOpen(true);
  }

  const closeMenu = () => {
    setIsMenuOpen(false);
  }
  
  return (
    <div onMouseEnter={openMenu}  onMouseLeave={closeMenu} 
      onFocusCapture={openMenu} onBlur={closeMenu} 
      style={{position: 'relative'}}
    >
      <HeartIcon/>
      {isMenuOpen &&
        <div className={styles.likedMenu}>
          <span>Saved</span>
          <ul>
            {savedGroups.slice(0, MAX_SAVED_ITEMS).map((group, index) => (
              // TODO: add arrow navigation and data attributes?
              <li key={index}><span>{group} {index === 0 ? <CheckMarkIcon/> : null}</span> <RemoveIcon/></li>
            ))} 
          </ul>
        </div>
      }
    </div>
  );
};

export default SavedMenu;
