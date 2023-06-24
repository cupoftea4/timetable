import { FC } from 'react';
import styles from './Toggle.module.scss';

type OwnProps = {
  toggleState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  states: [string, string];
};

const Toggle: FC<OwnProps> = ({toggleState, states}) => {
  const [active, setActive] = toggleState;
  
  const toggle = () => setActive(!active);
  
  const handleKeyToggle = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === " ") toggle();
  };

  return (
    <span 
      onClick={toggle} tabIndex={0} 
      className={styles.toggle} onKeyDown={handleKeyToggle}
    >
      {states[0]}
      <span className={active ? styles.right : ''}/>
      {states[1]}
    </span>
  )
};

export default Toggle;