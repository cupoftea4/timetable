import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import React, { type FC } from "react";

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
  optionsClassName?: string;
  autoFocus?: boolean;
  allowCustomValue?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onClose?: () => void;
};

const SPECIAL_CHARACTERS_REGEX = /[^\p{L}\p{N}]/gu;

const normalize = (value: string, ignoreSpecialCharacters: boolean) => {
  const normalized = value.toLocaleLowerCase();
  return ignoreSpecialCharacters ? normalized.replace(SPECIAL_CHARACTERS_REGEX, "") : normalized;
};

const VirtualizedDataList: FC<OwnProps> = ({
  options,
  onSelect,
  className,
  optionsClassName,
  containerRef,
  ignoreSpecialCharacters = false,
  clearOnSelect = false,
  label = "",
  placeholder = "",
  autoFocus = false,
  allowCustomValue = false,
  onKeyDown,
  onClose,
}) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [inputKey, setInputKey] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const normalizedQuery = normalize(query, ignoreSpecialCharacters);
  const filteredOptions = options.filter((item) =>
    normalize(item.value, ignoreSpecialCharacters).includes(normalizedQuery)
  );

  if (allowCustomValue && query && !filteredOptions.some((item) => item.value === query)) {
    filteredOptions.push({ id: query, value: `Відкрити «${query}»`, isCustom: true });
  }

  return (
    <div ref={containerRef} className={className}>
      <Combobox
        immediate
        virtual={{ options: filteredOptions }}
        onClose={onClose}
        onChange={(item: DataListOption | null) => {
          if (!item) return;
          onSelect(item);
          if (clearOnSelect) {
            setQuery("");
            setInputKey((key) => key + 1);
          }
        }}
      >
        {({ open }) => (
          <>
            <ComboboxButton ref={buttonRef} hidden aria-label="Show suggestions" />
            <ComboboxInput
              key={inputKey}
              aria-label={label || placeholder || "Search"}
              placeholder={placeholder}
              autoFocus={autoFocus}
              onClick={() => {
                if (!open) buttonRef.current?.click();
              }}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
            />
            <ComboboxOptions
              as="ul"
              modal={false}
              anchor={{ to: "bottom", gap: 6, padding: 8 }}
              className={optionsClassName}
            >
              {({ option }) => (
                <ComboboxOption as="li" value={option}>
                  {option.value}
                </ComboboxOption>
              )}
            </ComboboxOptions>
          </>
        )}
      </Combobox>
    </div>
  );
};

export default VirtualizedDataList;
