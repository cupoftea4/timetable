import { CloseButton } from "@headlessui/react";
import React, { type FC, Suspense } from "react";
import CheckMarkIcon from "@/assets/CheckMarkIcon";
import ChevronDownIcon from "@/assets/ChevronDownIcon";
import { lazyPrefetched } from "@/utils/general";
import styles from "./MobileSelect.module.scss";

const Drawer = lazyPrefetched(() => import("./Drawer"));

type OwnProps = {
  label: string;
  items: Array<{ value: string; name: string }>;
  selectedState: [string, React.Dispatch<React.SetStateAction<string>> | ((state: string) => void)];
};

const MobileSelect: FC<OwnProps> = ({ label, items, selectedState }) => {
  const [selected, onSelect] = selectedState;
  const [showSelect, setShowSelect] = React.useState(false);

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
        <ChevronDownIcon />
      </button>
      {showSelect && (
        <Suspense fallback={null}>
          <Drawer title={label} onClose={() => setShowSelect(false)}>
            <ul className={styles.options}>
              {items.map((item) => (
                <li key={item.value}>
                  <CloseButton
                    className={styles.option}
                    aria-current={item.value === selected}
                    onClick={() => {
                      onSelect(item.value);
                    }}
                  >
                    {item.name}
                    {item.value === selected && <CheckMarkIcon className={styles.check} />}
                  </CloseButton>
                </li>
              ))}
            </ul>
          </Drawer>
        </Suspense>
      )}
    </>
  );
};

export default MobileSelect;
