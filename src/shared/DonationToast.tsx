import { DONATION_LINK } from "@/utils/constants";
import Toast from "@/utils/toasts";

const DonationToast = () => {
  return (
    <div className="flex items-center gap-0.5 text-white">
      <span className="flex-grow text-sm">Тепер можна підтримати автора через моно 🐱</span>
      <a
        href={DONATION_LINK}
        className="bg-cyan-700 dark:bg-gray-700 text-white px-2 py-2 rounded-md text-sm hover:bg-gray-600 text-nowrap"
        target="_blank"
        rel="noreferrer"
        onClick={() => Toast.info("Дуже дякую! 💖")}
      >
        Підтримати
      </a>
    </div>
  );
};

export default DonationToast;
