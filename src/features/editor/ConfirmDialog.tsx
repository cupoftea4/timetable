import { CloseButton } from "@headlessui/react";
import type { FC } from "react";
import Drawer from "@/shared/Drawer";
import { classes } from "@/styles/utils";
import styles from "./TimetableEditor.module.scss";

export type Confirmation = {
  title: string;
  text?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
};

type OwnProps = Confirmation & { onClose: () => void };

const ConfirmDialog: FC<OwnProps> = ({ title, text, confirmLabel, danger, onConfirm, onClose }) => (
  <Drawer title={title} onClose={onClose} className={classes(styles.dialog, styles.confirm)}>
    {text && <p className={styles.hint}>{text}</p>}
    <div className={styles.dialogActions}>
      <CloseButton className={styles.pushRight}>Ні</CloseButton>
      <CloseButton className={classes(styles.primary, danger && styles.danger)} onClick={onConfirm}>
        {confirmLabel}
      </CloseButton>
    </div>
  </Drawer>
);

export default ConfirmDialog;
