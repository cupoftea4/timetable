import styles from "./HomeIcon.module.scss";

const ShareIcon = () => {
  return (
    <svg
      className={styles.icon}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.5 3 21.5 11l-8 8v-4.5C8.5 14.5 4.5 16.5 2.5 21 2.5 12.5 7 7.5 13.5 7.5Z" />
    </svg>
  );
};

export default ShareIcon;
