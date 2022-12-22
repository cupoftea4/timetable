import React from 'react'

type ListProps = {
  items: string[],
  selectedState: [string | null, React.Dispatch<React.SetStateAction<string | null>>],
}

const List = ({items, selectedState}: ListProps) => {
  const [selected, setSelected] = selectedState;
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <button
            onClick={() => {
              setSelected(item);
            }}
            data-state={selected === item ? "selected" : ""}
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  )
};

export default List;