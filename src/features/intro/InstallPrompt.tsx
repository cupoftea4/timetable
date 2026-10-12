import { CloseButton, DialogTitle } from "@headlessui/react";
import type { FC } from "react";
import InstallIcon from "@/assets/InstallIcon";
import { promptInstall } from "@/hooks/usePwaInstall";
import Drawer from "@/shared/Drawer";
import styles from "./FeaturesIntro.module.scss";

type OwnProps = {
  kind: "prompt" | "ios";
  onClose: () => void;
};

// Safari's share icon, to find it in the browser's menu
const SafariShareIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 9H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2" />
    <path d="M12 2v12M8 6l4-4 4 4" />
  </svg>
);

const InstallPrompt: FC<OwnProps> = ({ kind, onClose }) => (
  <Drawer onClose={onClose} className={styles.panel}>
    <div>
      <DialogTitle className={styles.title}>Розклад на головному екрані</DialogTitle>
      <p className={styles.text}>
        Встановіть його як застосунок: він відкриватиметься одним дотиком і працюватиме без інтернету.
      </p>
    </div>
    {kind === "ios" ? (
      <>
        <ol className={styles.features}>
          <li>
            <SafariShareIcon />
            <span>Натисніть «Поділитися» в меню браузера</span>
          </li>
          <li>
            <InstallIcon />
            <span>Виберіть «На екран „Додому“»</span>
          </li>
        </ol>
        <CloseButton className={styles.primary}>Зрозуміло</CloseButton>
      </>
    ) : (
      <div className={styles.actions}>
        <CloseButton>Не зараз</CloseButton>
        <CloseButton className={styles.primary} onClick={promptInstall}>
          Встановити
        </CloseButton>
      </div>
    )}
  </Drawer>
);

export default InstallPrompt;
