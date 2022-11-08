// import useToggleRef from '../hooks/useToggle';
import styles from './Toggle.module.scss';

type ToggleProps = {
  toggleState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  states: [string, string];
};

const Toggle = ({toggleState, states}: ToggleProps) => {
  const [active, setActive] = toggleState;
  
  const toggle = () => setActive(prev => !prev);
  const handleKeyToggle = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') toggle();
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