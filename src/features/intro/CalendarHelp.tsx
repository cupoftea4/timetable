import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { FC } from "react";
import screenshot from "@/assets/google-calendar-import.png";
import { classes } from "@/styles/utils";
import styles from "./FeaturesIntro.module.scss";

const GOOGLE_CALENDAR_IMPORT = "https://calendar.google.com/calendar/r/settings/export";

type OwnProps = {
  isExams: boolean;
  onClose: () => void;
};

const CalendarHelp: FC<OwnProps> = ({ isExams, onClose }) => {
  // Phones and tablets open the file straight in a calendar app, computers need Google Calendar's import page
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  return (
    <Dialog open onClose={onClose} className={styles.backdrop}>
      <DialogPanel className={classes(styles.panel, styles.help)}>
        <DialogTitle className={styles.title}>
          Як додати {isExams ? "екзамени" : "пари"} {isTouch ? "в календар" : "в Google Calendar"}
        </DialogTitle>
        <p className={styles.text}>
          {isExams
            ? "Файл, що завантажився, містить розклад екзаменів."
            : "Файл, що завантажився, містить пари вашої підгрупи на весь семестр з урахуванням чисельника і знаменника."}
        </p>
        {isTouch ? (
          <p>Відкрийте завантажений файл і натисніть «Додати все».</p>
        ) : (
          <>
            <ol className={styles.helpSteps}>
              <li>
                Відкрийте{" "}
                <a href={GOOGLE_CALENDAR_IMPORT} target="_blank" rel="noreferrer">
                  імпорт у налаштуваннях Google Calendar
                </a>
                .
              </li>
              <li>
                Виберіть завантажений файл і календар, куди його додати, та натисніть «Імпортувати». Для розкладу краще
                створити окремий календар: так його легко приховати чи видалити.
              </li>
            </ol>
            <img src={screenshot} alt="Імпорт файлу в налаштуваннях Google Calendar" className={styles.screenshot} />
          </>
        )}
        <button type="button" className={styles.primary} onClick={onClose}>
          Зрозуміло
        </button>
      </DialogPanel>
    </Dialog>
  );
};

export default CalendarHelp;
