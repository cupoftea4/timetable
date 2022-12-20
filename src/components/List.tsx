import React from 'react'

type ListProps = {
  items: string[],
  selectedState: [string | null, React.Dispatch<React.SetStateAction<string | null>>],
  onClick?: Function
}

const List = ({items, selectedState, onClick}: ListProps) => {
  const [selected, setSelected] = selectedState;
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <button
            onClick={() => {
              setSelected(item);
              onClick && onClick(item);
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