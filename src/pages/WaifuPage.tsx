import { Link } from "react-router-dom";
import ArrowRightIcon from "@/assets/ArrowRightIcon";
import waifu from "@/assets/waifu.png";
import usePageTitle from "@/hooks/usePageTitle";
import styles from "./WaifuPage.module.scss";

const WaifuPage = () => {
  usePageTitle("Waifu · Розклад НУЛП");

  return (
    <main className={styles.page}>
      <meta name="robots" content="noindex" />
      <Link to="/home" className={styles.back} aria-label="До розкладу" title="До розкладу">
        <ArrowRightIcon />
      </Link>
      <figure className={styles.frame}>
        <img
          src={waifu}
          width="1254"
          height="1254"
          decoding="async"
          alt="Аніме-дівчина з котячими вушками у синьо-золотій сукні простягає руку на тлі Львівської політехніки"
        />
        <span className={styles.accent} aria-hidden="true">
          ✦
        </span>
      </figure>
    </main>
  );
};

export default WaifuPage;
