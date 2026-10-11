import MoonIcon from "@/assets/MoonIcon";
import SunIcon from "@/assets/SunIcon";
import { useTheme } from "@/hooks/useTheme";
import { classes } from "@/styles/utils";

const ThemeButton = () => {
  const { isDarkTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={classes("icon-button", "transition duration-300")}
      onClick={toggleTheme}
      aria-label="Змінити тему"
    >
      {isDarkTheme ? <MoonIcon /> : <SunIcon />}
    </button>
  );
};

export default ThemeButton;
