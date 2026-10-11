import { CloseButton } from "@headlessui/react";
import { type FC, useState } from "react";
import Drawer from "@/shared/Drawer";
import type { CustomTimetableData } from "@/types/timetable";
import { toAIPrompt } from "@/utils/customTimetable";
import Toast from "@/utils/toasts";
import styles from "./TimetableEditor.module.scss";

type OwnProps = {
  timetable: CustomTimetableData;
  subgroup: 1 | 2;
  pending: boolean;
  onApply: (answer: string) => void;
  onClose: () => void;
};

const AiEditDialog: FC<OwnProps> = ({ timetable, subgroup, pending, onApply, onClose }) => {
  const [answer, setAnswer] = useState("");

  const copyPrompt = () =>
    navigator.clipboard.writeText(toAIPrompt(timetable, subgroup)).then(
      () => Toast.success("Скопійовано, вставте в чат із ШІ"),
      (e) => Toast.error(e, "Не вдалося скопіювати")
    );

  return (
    <Drawer title="Змінити розклад за допомогою ШІ" onClose={onClose} className={styles.dialog}>
      <ol className={styles.steps}>
        <li>
          <span>Скопіюйте розклад разом з інструкціями для ШІ.</span>
          <button type="button" className={styles.outlined} onClick={copyPrompt}>
            Скопіювати для ШІ
          </button>
        </li>
        <li>
          Вставте його в чат із ChatGPT, Gemini чи Claude і одразу після нього допишіть, що змінити. Можна додати й
          скріншот іншого розкладу.
        </li>
        <li>
          <label className={styles.field}>
            Вставте сюди відповідь ШІ
            <textarea
              className={styles.importText}
              rows={8}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </label>
        </li>
      </ol>
      <div className={styles.dialogActions}>
        <CloseButton className={styles.pushRight}>Скасувати</CloseButton>
        <button
          type="button"
          className={styles.primary}
          onClick={() => onApply(answer)}
          disabled={pending || !answer.trim()}
        >
          Застосувати
        </button>
      </div>
    </Drawer>
  );
};

export default AiEditDialog;
