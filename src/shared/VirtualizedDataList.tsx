import React, { type FC, useCallback } from 'react';
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
  const SEARCH_REGEX = /[^\p{L}\p{N}]/gu;

  const matchesSearch = (itemName: string, searchQuery: string) => {
    searchQuery = searchQuery.toLocaleLowerCase().replace(SEARCH_REGEX, '');
    return itemName?.toLocaleLowerCase()
      .replace(SEARCH_REGEX, '')
      .includes(searchQuery);
  };

  const filterFunction = useCallback(
    // eslint-disable-next-line no-trailing-spaces
    (timetableItems: Array<{ id: string, value: string }>, searchQuery: any) => timetableItems
      .filter((item) => matchesSearch(item.value, searchQuery))
      .slice(0, displayedCount),
    [options, inputValue, displayedCount]
  );

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
      items={options}
      filters={[filterFunction]}
    />
  );
};

export default VirtualizedDataList;
