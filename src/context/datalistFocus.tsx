import useInputFocus from "@/hooks/useFocus";
import type React from "react";
import { type ReactNode, createContext, useContext } from "react";

interface DatalistFocusContextType {
  ref: React.RefObject<HTMLDivElement>;
  isFocused: boolean;
  focus: () => void;
}

const DatalistFocusContext = createContext<DatalistFocusContextType | undefined>(undefined);

const DatalistFocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { ref, isFocused, focus } = useInputFocus<HTMLDivElement>({
    childInput: true,
    initFocus: true,
  });

  return <DatalistFocusContext.Provider value={{ ref, isFocused, focus }}>{children}</DatalistFocusContext.Provider>;
};

export const useDatalistFocus = () => {
  const context = useContext(DatalistFocusContext);
  if (!context) {
    throw new Error("useDatalistFocus must be used within a DatalistFocusProvider");
  }
  return context;
};

export { DatalistFocusProvider };
