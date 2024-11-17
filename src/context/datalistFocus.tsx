import useInputFocus from "@/hooks/useFocus";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import { TABLET_SCREEN_BREAKPOINT } from "@/utils/constants";
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
  const { width } = useWindowDimensions();
  const { ref, isFocused, focus, blur } = useInputFocus<HTMLDivElement>({
    childInput: true,
    initFocus: width > TABLET_SCREEN_BREAKPOINT,
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
