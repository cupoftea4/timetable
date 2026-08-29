import type { FC } from "react";
import styles from "./Toggle.module.scss";

type OwnProps = {
  toggleState: [boolean, (active: boolean) => void];
  states: [string, string];
};

const Toggle: FC<OwnProps> = ({ toggleState, states }) => {
  const [active, setActive] = toggleState;

  const toggle = () => {
    setActive(!active);
  };

  return (
    <button type="button" onClick={toggle} className={styles.toggle}>
      {states[0]}
      <span className={active ? styles.right : ""} />
      {states[1]}
    </button>
  );
};

export default Toggle;
