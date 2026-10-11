import { CloseButton, Menu, MenuButton, MenuItem, MenuItems, MenuSeparator } from "@headlessui/react";
import { type ReactNode, Suspense, useState } from "react";
import EyeIcon from "@/assets/EyeIcon";
import KeyIcon from "@/assets/KeyIcon";
import ShareIcon from "@/assets/ShareIcon";
import useGroupParam from "@/hooks/useGroupParam";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { lazyPrefetched } from "@/utils/general";
import Toast from "@/utils/toasts";
import styles from "./ShareButton.module.scss";

const Drawer = lazyPrefetched(() => import("@/shared/Drawer"));

type OwnProps = {
  editToken?: string;
  className?: string;
  label?: ReactNode;
};

const ShareButton = ({ editToken, className, label }: OwnProps) => {
  const group = useGroupParam();
  const isMobile = useIsMobile();
  const isSheet = useIsTablet();
  const [showSheet, setShowSheet] = useState(false);

  const share = (hash = "") => {
    const url = `${window.location.origin}/${group}${hash}`;
    if (isMobile && navigator.share) return navigator.share({ title: document.title, url }).catch(() => {});
    navigator.clipboard.writeText(url).then(
      () => Toast.success("Посилання скопійовано"),
      (e) => Toast.error(e, "Не вдалося скопіювати посилання")
    );
  };

  const buttonProps = { className, title: "Поділитися розкладом", "aria-label": "Поділитися розкладом" };
  const content = (
    <>
      <ShareIcon />
      {label}
    </>
  );
  const viewLink = (
    <>
      <EyeIcon />
      <span>Посилання для перегляду</span>
    </>
  );
  const editLink = (
    <>
      <KeyIcon />
      <span>
        Посилання для редагування
        <small>Дає право змінювати для всіх</small>
      </span>
    </>
  );

  if (!editToken) {
    return (
      <button type="button" {...buttonProps} onClick={() => share()}>
        {content}
      </button>
    );
  }

  if (isSheet) {
    return (
      <>
        <button type="button" {...buttonProps} onClick={() => setShowSheet(true)}>
          {content}
        </button>
        {showSheet && (
          <Suspense fallback={null}>
            <Drawer title="Поділитися розкладом" onClose={() => setShowSheet(false)}>
              <ul className={styles.sheetList}>
                <li>
                  <CloseButton onClick={() => share()}>{viewLink}</CloseButton>
                </li>
                <li>
                  <CloseButton onClick={() => share(`#edit=${editToken}`)}>{editLink}</CloseButton>
                </li>
              </ul>
            </Drawer>
          </Suspense>
        )}
      </>
    );
  }

  return (
    <Menu>
      <MenuButton {...buttonProps}>{content}</MenuButton>
      <MenuItems modal={false} anchor={{ to: "bottom start", gap: 8, padding: 16 }} className={styles.menu}>
        <MenuItem>
          <button type="button" onClick={() => share()}>
            {viewLink}
          </button>
        </MenuItem>
        <MenuSeparator className={styles.separator} />
        <MenuItem>
          <button type="button" onClick={() => share(`#edit=${editToken}`)}>
            {editLink}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

export default ShareButton;
