import { type FC, useLayoutEffect, useMemo, useRef, useState } from "react";
import { classes } from "@/styles/utils";
import { getSourceOptions, getTimetableName } from "@/utils/timetable";
import styles from "./SourcePicker.module.scss";
import VirtualizedDataList from "./VirtualizedDataList";

const MAX_SOURCES = 5;

type OwnProps = {
  value: string[];
  onAdd: (source: string) => void;
  onRemove: (source: string) => void;
  locked?: string;
  compact?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
};

const SourcePicker: FC<OwnProps> = ({ value, onAdd, onRemove, locked, compact, autoFocus, disabled }) => {
  const options = useMemo(() => getSourceOptions(value), [value]);
  const last = value.at(-1);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [optionsFrame, setOptionsFrame] = useState({ offset: 0, width: 0 });

  // Options are anchored to the input, this stretches them under the whole field
  // biome-ignore lint/correctness/useExhaustiveDependencies: chips move the input
  useLayoutEffect(() => {
    const field = fieldRef.current;
    const input = field?.querySelector("input");
    if (!field || !input) return;
    const update = () =>
      setOptionsFrame({
        offset: field.getBoundingClientRect().left - input.getBoundingClientRect().left,
        width: field.offsetWidth,
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(field);
    return () => observer.disconnect();
  }, [value.length]);

  return (
    <div ref={fieldRef} className={classes(styles.field, compact && styles.compact)}>
      {value.map((source) => (
        <span key={source} className={styles.chip}>
          {getTimetableName(source)}
          {source !== locked && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(source)}
              aria-label={`Прибрати ${getTimetableName(source)}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {value.length < MAX_SOURCES && (
        <VirtualizedDataList
          clearOnSelect
          ignoreSpecialCharacters
          autoFocus={autoFocus}
          label="Додати групу або викладача"
          placeholder={compact ? "+ Група або викладач" : "Група або викладач…"}
          emptyText="Нічого не знайдено"
          optionsFrame={optionsFrame}
          className={styles.search}
          optionsClassName={styles.options}
          options={options}
          onSelect={(item) => onAdd(item.id)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !event.currentTarget.value && last && last !== locked) onRemove(last);
          }}
          renderOption={(option) => (
            <>
              {option.section && <span className={styles.section}>{option.section}</span>}
              <span className={styles.option}>
                {option.value}
                {option.caption && <span className={styles.caption}>{option.caption}</span>}
              </span>
            </>
          )}
        />
      )}
      {!compact && (
        <span className={styles.count}>
          {value.length}/{MAX_SOURCES}
        </span>
      )}
    </div>
  );
};

export default SourcePicker;
