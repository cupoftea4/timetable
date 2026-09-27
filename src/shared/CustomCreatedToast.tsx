import type { ToastContentProps } from "react-toastify";
import ShareIcon from "@/assets/ShareIcon";
import Toast from "@/utils/toasts";

const CustomCreatedToast = ({ data: url }: ToastContentProps<string>) => {
  const copyLink = () =>
    navigator.clipboard.writeText(url).then(
      () => Toast.success("Посилання скопійовано"),
      (e) => Toast.error(e, "Не вдалося скопіювати посилання")
    );

  return (
    <div className="flex items-center gap-3 text-white">
      <svg
        className="size-[22px] shrink-0 opacity-75"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </svg>
      <div className="flex-grow">
        <p className="text-sm font-bold">Розклад створено</p>
        <p className="text-sm text-white/70">Доступний іншим за посиланням</p>
      </div>
      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-1.5 text-nowrap bg-white/10 text-white px-2.5 py-1.5 rounded-md text-sm hover:bg-white/15 [&_svg]:size-4"
        onClick={copyLink}
      >
        <ShareIcon />
        Поділитися
      </button>
    </div>
  );
};

export default CustomCreatedToast;
