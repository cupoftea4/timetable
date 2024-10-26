import LoadingIcon from "../assets/LoadingIcon";
import styles from "./LoadingPage.module.scss";

const LoadingPage = () => {
  return (
    <main className={styles.container}>
      <div>
        <LoadingIcon />
        <span>Loading...</span>
      </div>
    </main>
  );
};

export default LoadingPage;
