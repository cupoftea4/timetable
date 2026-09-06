import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import CheckMarkIcon from "@/assets/CheckMarkIcon";
import styles from "./TimetableViewSelect.module.scss";

type Props = {
  isExams: boolean;
  onChange: (isExams: boolean) => void;
};

export default function TimetableViewSelect({ isExams, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const container = useRef<HTMLFieldSetElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const classesOption = useRef<HTMLButtonElement>(null);
  const examsOption = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    (isExams ? examsOption : classesOption).current?.focus();
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open, isExams]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  const navigateOptions = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      (event.currentTarget === classesOption.current ? examsOption : classesOption).current?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      (event.key === "Home" ? classesOption : examsOption).current?.focus();
    }
  };

  return (
    <fieldset
      aria-label="Вибір типу розкладу"
      ref={container}
      className={styles.select}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-label={`Тип розкладу: ${isExams ? "Екзамени" : "Пари"}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          } else if (event.key === "Escape") close();
        }}
      >
        {isExams ? "Екзамени" : "Пари"}
        <span className={styles.chevron} aria-hidden="true" />
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label="Тип розкладу" className={styles.menu}>
          {[false, true].map((exams) => (
            <button
              key={String(exams)}
              ref={exams ? examsOption : classesOption}
              type="button"
              role="menuitemradio"
              aria-checked={isExams === exams}
              className={styles.option}
              onKeyDown={navigateOptions}
              onClick={() => {
                close();
                if (isExams !== exams) onChange(exams);
              }}
            >
              {exams ? "Екзамени" : "Пари"}
              <span className={styles.check} aria-hidden="true">
                {isExams === exams && <CheckMarkIcon />}
              </span>
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
}
