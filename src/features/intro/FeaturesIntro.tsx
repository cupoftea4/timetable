import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { FC } from "react";
import catFace from "@/assets/cat-face.svg";
import DownloadIcon from "@/assets/DownloadIcon";
import MergeIcon from "@/assets/MergeIcon";
import PencilIcon from "@/assets/PencilIcon";
import styles from "./FeaturesIntro.module.scss";

type OwnProps = {
  onClose: () => void;
};

const FeaturesIntro: FC<OwnProps> = ({ onClose }) => (
  <Dialog open onClose={onClose} className={styles.backdrop}>
    <DialogPanel className={styles.panel}>
      <img src={catFace} alt="" className={styles.cat} />
      <div>
        <DialogTitle className={styles.title}>Кілька корисних можливостей</DialogTitle>
        <p className={styles.text}>Їх можна знайти внизу сторінки.</p>
      </div>

      <ul className={styles.features}>
        <li>
          <PencilIcon />
          <span>
            На комп'ютері розклад можна змінити під себе: перетягнути пари, додати нові або доручити це ШІ, а потім
            поділитися посиланням з групою.
          </span>
        </li>
        <li>
          <MergeIcon />
          <span>Рокзлад групи та вибіркової дисципліни (чи іншої групи) можна об'єднати в одну таблицю.</span>
        </li>
        <li>
          <DownloadIcon />
          <span>Пари можна додати в Google Calendar чи інший календар.</span>
        </li>
      </ul>
      <button type="button" className={styles.primary} onClick={onClose}>
        Зрозуміло
      </button>
    </DialogPanel>
  </Dialog>
);

export default FeaturesIntro;
