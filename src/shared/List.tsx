import type React from 'react';

type OwnProps = {
  items: string[]
  selectedState:
  [string | null, React.Dispatch<React.SetStateAction<string | null>>]
  | [string | null, ((state: string | null) => void)]
};

const List = ({ items, selectedState }: OwnProps) => {
  const [selected, onSelect] = selectedState;
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <button
            onClick={() => { onSelect(item); }}
            data-state={selected === item ? 'selected' : ''}
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default List;
