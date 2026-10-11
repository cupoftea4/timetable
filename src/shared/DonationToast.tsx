import { DONATION_LINK } from "@/utils/constants";
import Toast from "@/utils/toasts";

const DonationToast = () => {
  return (
    <div className="flex items-center gap-3 text-white">
      <span className="flex-grow text-sm">Нас можна підтримати через моно 🐱</span>
      <a
        href={DONATION_LINK}
        className="shrink-0 bg-white/10 text-white px-2.5 py-1.5 rounded-md text-sm hover:bg-white/15 text-nowrap"
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
