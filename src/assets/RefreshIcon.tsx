import { classes } from "@/styles/utils";
import type { IconProps } from "@/types/components";

type OwnProps = IconProps & {
  isPending?: boolean;
};

const RefreshIcon = ({ className, isPending }: OwnProps) => {
  return (
    <svg
      className={classes(className, isPending && "animate-reverse-spin text-gray-400 cursor-not-allowed")}
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
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
};

export default RefreshIcon;
