import React, { type FC, useCallback } from "react";
import DatalistInput, { useComboboxControls } from "react-datalist-input";

type DataListOption = {
  id: string;
  value: string;
  isCustom?: boolean;
};

type OwnProps = {
  options: DataListOption[];
  onSelect: (item: DataListOption) => void;
  ignoreSpecialCharacters?: boolean;
  clearOnSelect?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  label?: string;
  placeholder?: string;
  className?: string;
  initialDisplayedCount?: number;
  autoFocus?: boolean;
  isExpanded?: boolean;
  allowCustomValue?: boolean;
};

const SPECIAL_CHARACTERS_REGEX = /[^\p{L}\p{N}]/gu;

const VirtualizedDataList: FC<OwnProps> = ({
  options,
  onSelect,
  className,
  containerRef,
  ignoreSpecialCharacters = false,
  clearOnSelect = false,
  label = "",
  placeholder = "",
  initialDisplayedCount = 10,
  autoFocus = false,
  allowCustomValue = false,
  isExpanded = false,
}) => {
  const { value: inputValue, setValue: setInputValue } = useComboboxControls({ isExpanded: false });
  const [displayedCount, setDisplayedCount] = React.useState(initialDisplayedCount);

  const matchesSearch = (itemName: string, searchQuery?: string) => {
    if (!searchQuery) return true;
    if (ignoreSpecialCharacters) {
      const query = searchQuery.toLocaleLowerCase().replace(SPECIAL_CHARACTERS_REGEX, "");
      return itemName.toLocaleLowerCase().replace(SPECIAL_CHARACTERS_REGEX, "").includes(query);
    }
    return itemName.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase());
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: I don't want to break it
  const filterOptions = useCallback(
    (datalistItems: DataListOption[], searchQuery?: string) => {
      const res = datalistItems.filter((item) => matchesSearch(item.value, searchQuery)).slice(0, displayedCount);

      if (allowCustomValue && searchQuery && !res.some((item) => item.value === searchQuery)) {
        res.push({ id: searchQuery, value: `Відкрити «${searchQuery}»`, isCustom: true });
      }

      return res;
    },
    [options, inputValue, displayedCount]
  );

  const showMoreOptions = () => {
    setDisplayedCount(displayedCount + initialDisplayedCount);
  };

  return (
    <DatalistInput
      value={inputValue}
      setValue={setInputValue}
      ref={containerRef}
      className={className}
      placeholder={placeholder}
      label={label}
      items={options}
      filters={[filterOptions]}
      inputProps={{ autoFocus }}
      isExpanded={isExpanded}
      onSelect={(item) => {
        onSelect(item);
        clearOnSelect && setInputValue("");
      }}
      listboxProps={{
        onScroll: (e) => {
          const bottom = e.currentTarget.scrollHeight - e.currentTarget.clientHeight;
          if (Math.abs(e.currentTarget.scrollTop - bottom) < 2) {
            showMoreOptions();
          }
        },
      }}
    />
  );
};

export default VirtualizedDataList;
