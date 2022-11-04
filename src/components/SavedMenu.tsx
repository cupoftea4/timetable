import HeartIcon from '../assets/HeartIcon';
import styles from './SavedMenu.module.scss';

export const SavedMenu = ({savedGroups}: {savedGroups: string[]}) => (
  <>
    <HeartIcon liked={false} />
    <div className={styles.likedMenu}>
      <ul>
        {savedGroups.map((group, index) => (
          <li key={index}>{group}</li>
        ))}
      </ul>
    </div>  
  </>
)
