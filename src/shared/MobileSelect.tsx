import React, { type FC } from "react";
import styles from "./MobileSelect.module.scss";

type OwnProps = {
  items: Array<{ value: string; name: string }>;
  selectedState: [string, React.Dispatch<React.SetStateAction<string>> | ((state: string) => void)];
};

const MobileSelect: FC<OwnProps> = ({ items, selectedState }) => {
  const [selected, onSelect] = selectedState;
  const [showSelect, setShowSelect] = React.useState(false);

  const onItemClicked = (item: string) => {
    setShowSelect(false);
    onSelect(item);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setShowSelect(true);
        }}
        className={styles.selected}
      >
        {items.find((item) => item.value === selected)?.name}
      </button>
      {showSelect && (
        <div
          className={styles.select}
          onClick={() => {
            setShowSelect(false);
          }}
        >
          <ul>
            {items.map((item) => (
              <li key={item.value}>
                <button
                  type="button"
                  onClick={() => {
                    onItemClicked(item.value);
                  }}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default MobileSelect;
