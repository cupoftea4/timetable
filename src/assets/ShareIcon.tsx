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
      <path d="M13 4.5 21 12l-8 7.5V15c-5 0-8 1.5-10 5 0-7 4-11.5 10-11.5Z" />
    </svg>
  );
};

export default ShareIcon;
