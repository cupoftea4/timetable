import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { FC } from "react";
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
  <Dialog open onClose={onClose} className={styles.backdrop}>
    <DialogPanel className={classes(styles.dialog, styles.confirm)}>
      <DialogTitle className={styles.dialogTitle}>{title}</DialogTitle>
      {text && <p className={styles.hint}>{text}</p>}
      <div className={styles.dialogActions}>
        <button type="button" className={styles.pushRight} onClick={onClose}>
          Ні
        </button>
        <button
          type="button"
          className={classes(styles.primary, danger && styles.danger)}
          onClick={() => {
            onClose();
            onConfirm();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </DialogPanel>
  </Dialog>
);

export default ConfirmDialog;
