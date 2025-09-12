import useInputFocus from "@/hooks/useFocus";
import type React from "react";
import { type ReactNode, createContext, useContext } from "react";

interface DatalistFocusContextType {
  ref: React.RefObject<HTMLDivElement>;
  isFocused: boolean;
  focus: () => void;
  blur: () => void;
}

const DatalistFocusContext = createContext<DatalistFocusContextType | undefined>(undefined);

const DatalistFocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { ref, isFocused, focus, blur } = useInputFocus<HTMLDivElement>({
    childInput: true,
  });

  return (
    <DatalistFocusContext.Provider value={{ ref, isFocused, focus, blur }}>{children}</DatalistFocusContext.Provider>
  );
};

export const useDatalistFocus = () => {
  const context = useContext(DatalistFocusContext);
  if (!context) {
    throw new Error("useDatalistFocus must be used within a DatalistFocusProvider");
  }
  return context;
};

export { DatalistFocusProvider };
