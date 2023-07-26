import React, { type FC, useMemo } from 'react';
import DatalistInput, { useComboboxControls } from 'react-datalist-input';

type OwnProps = {
  options: Array<{ id: string, value: string }>
  onSelect: (item: { id: string, value: string }) => void
  clearOnSelect?: boolean
  containerRef?: React.RefObject<HTMLDivElement>
  label?: string
  placeholder?: string
  className?: string
  initialDisplayedCount?: number
  autoFocus?: boolean
};

const VirtualizedDataList: FC<OwnProps> = ({
  options,
  onSelect,
  className,
  containerRef,
  clearOnSelect = false,
  label = '',
  placeholder = '',
  initialDisplayedCount = 10,
  autoFocus = false
}) => {
  const { value: inputValue, setValue: setInputValue } = useComboboxControls({ isExpanded: false });
  const [displayedCount, setDisplayedCount] = React.useState(initialDisplayedCount);

  const displayedOptions = useMemo(() => {
    const timetables = options
      .filter(({ value }) =>
        value.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())
      );
    return timetables.slice(0, displayedCount);
  }, [options, inputValue, displayedCount]);

  const showMoreOptions = () => {
    setDisplayedCount(displayedCount + initialDisplayedCount);
  };

  return (
    <DatalistInput
      inputProps={{
        autoFocus
      }}
      listboxProps={{
        onScroll: (e) => {
          const bottom = e.currentTarget.scrollHeight - e.currentTarget.clientHeight;
          if (Math.abs(e.currentTarget.scrollTop - bottom) < 2) {
            showMoreOptions();
          }
        }
      }}
      value={inputValue}
      setValue={setInputValue}
      ref={containerRef}
      className={className}
      placeholder={placeholder}
      label={label}
      onSelect={item => {
        onSelect(item);
        clearOnSelect && setInputValue('');
      }}
      items={displayedOptions}
    />
  );
};

export default VirtualizedDataList;
