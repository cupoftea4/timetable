import type React from "react";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

interface SearchBarFocusContextType {
  isFocused: boolean;
  focus: () => void;
}

const SearchBarFocusContext = createContext<SearchBarFocusContextType | undefined>(undefined);

const SearchBarFocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    document.querySelector<HTMLInputElement>("input")?.addEventListener("blur", () => {
      setIsFocused(false);
    });
  }, []);

  const focus = useCallback(() => {
    setIsFocused(true);
  }, []);

  useEffect(() => {
    if (isFocused) {
      document.querySelector<HTMLInputElement>("input")?.focus();
    }
  }, [isFocused]);

  return <SearchBarFocusContext.Provider value={{ isFocused, focus }}>{children}</SearchBarFocusContext.Provider>;
};

export const useSearchBarFocus = () => {
  const context = useContext(SearchBarFocusContext);
  if (!context) {
    throw new Error("useSearchBarFocus must be used within a SearchBarFocusProvider");
  }
  return context;
};

export { SearchBarFocusProvider };
