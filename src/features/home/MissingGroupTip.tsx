import { useDatalistFocus } from "@/context/datalistFocus";
import styles from "./MissingGroupTip.module.scss";

const MissingGroupTip = () => {
  const { focus } = useDatalistFocus();

  return (
    <div className={styles.timetablesInfo}>
      <p>
        <span className="font-bold">Не знайшли свою групу?</span> Спробуйте ввести назву групи в{" "}
        <button className={styles.link} onClick={() => focus()} type="button">
          полі пошуку
        </button>{" "}
        та натисніть <span className="font-bold">Відкрити «Група»</span>.
      </p>
      <p>
        Альтернативно: ви також можете додати назву групи до посилання, як у цьому прикладі:{" "}
        <span className="text-nowrap">{window.location.origin}/ОІ-32</span>
      </p>
    </div>
  );
};

export default MissingGroupTip;
