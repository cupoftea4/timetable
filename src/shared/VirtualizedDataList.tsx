import React, { type FC, useCallback } from "react";
import DatalistInput from "react-datalist-input";

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
  containerRef?: React.RefObject<HTMLDivElement | null>;
  label?: string;
  placeholder?: string;
  className?: string;
  initialDisplayedCount?: number;
  autoFocus?: boolean;
  isExpanded?: boolean;
  allowCustomValue?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

const SPECIAL_CHARACTERS_REGEX = /[^\p{L}\p{N}]/gu;

const matchesSearch = (itemName: string, searchQuery: string | undefined, ignoreSpecialCharacters: boolean) => {
  if (!searchQuery) return true;
  if (ignoreSpecialCharacters) {
    const query = searchQuery.toLocaleLowerCase().replace(SPECIAL_CHARACTERS_REGEX, "");
    return itemName.toLocaleLowerCase().replace(SPECIAL_CHARACTERS_REGEX, "").includes(query);
  }
  return itemName.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase());
};

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
  onKeyDown,
}) => {
  const [inputKey, setInputKey] = React.useState(0);
  const [displayedCount, setDisplayedCount] = React.useState(initialDisplayedCount);

  const filterOptions = useCallback(
    (datalistItems: DataListOption[], searchQuery?: string) => {
      const res = datalistItems
        .filter((item) => matchesSearch(item.value, searchQuery, ignoreSpecialCharacters))
        .slice(0, displayedCount);

      if (allowCustomValue && searchQuery && !res.some((item) => item.value === searchQuery)) {
        res.push({ id: searchQuery, value: `Відкрити «${searchQuery}»`, isCustom: true });
      }

      return res;
    },
    [allowCustomValue, displayedCount, ignoreSpecialCharacters]
  );

  const showMoreOptions = () => {
    setDisplayedCount(displayedCount + initialDisplayedCount);
  };

  return (
    <DatalistInput
      key={inputKey}
      ref={containerRef}
      className={className}
      placeholder={placeholder}
      label={label}
      items={options}
      filters={[filterOptions]}
      inputProps={{
        autoFocus,
        onKeyDown: (event) => {
          // Keep the first option visible when the library focuses it.
          if (event.key === "ArrowDown") event.preventDefault();
          onKeyDown?.(event);
        },
      }}
      isExpanded={isExpanded}
      onSelect={(item) => {
        onSelect(item);
        if (clearOnSelect) setInputKey((key) => key + 1);
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
