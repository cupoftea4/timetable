import { isDarkMode } from "@/utils/general";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

interface UseThemeReturn {
  isDarkTheme: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export function useTheme(): UseThemeReturn {
  // Initialize with null to prevent flash, then sync with stored preference
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    // Only access localStorage on client side
    if (typeof window === "undefined") return false;
    return isDarkMode();
  });

  // Apply theme to document immediately on state change
  useEffect(() => {
    const applyTheme = (dark: boolean) => {
      if (dark) {
        document.documentElement.classList.add("dark-mode");
      } else {
        document.documentElement.classList.remove("dark-mode");
      }
    };

    applyTheme(isDarkTheme);
  }, [isDarkTheme]);

  // Listen for storage changes to sync theme across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "color-mode") {
        setIsDarkTheme(
          event.newValue === null
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
            : event.newValue === "dark"
        );
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Set theme preference and update localStorage
  const setTheme = (mode: Theme) => {
    window.localStorage.setItem("color-mode", mode);
    setIsDarkTheme(mode === "dark");
  };

  const toggleTheme = () => {
    setTheme(isDarkTheme ? "light" : "dark");
  };

  return {
    isDarkTheme,
    theme: isDarkTheme ? "dark" : "light",
    toggleTheme,
    setTheme,
  };
}

// Utility function to prevent FOUC (Flash of Unstyled Content)
export function initializeThemeOnLoad() {
  // This should be called as early as possible, ideally in a script tag in HTML head
  const theme = window.localStorage.getItem("color-mode");
  const prefersDark = theme === null ? window.matchMedia("(prefers-color-scheme: dark)").matches : theme === "dark";

  if (prefersDark) {
    document.documentElement.classList.add("dark-mode");
  } else {
    document.documentElement.classList.remove("dark-mode");
  }
}
