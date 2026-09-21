import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const STORAGE_KEY = "cat-mode";
const CatModeContext = createContext<{ enabled: boolean; disable: () => void } | undefined>(undefined);

export const CatModeProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("mode") === "cat";
  const [enabled, setEnabled] = useState(() => requested || localStorage.getItem(STORAGE_KEY) === "true");

  useEffect(() => {
    if (requested) {
      localStorage.setItem(STORAGE_KEY, "true");
      setEnabled(true);
    }
  }, [requested]);

  const disable = () => {
    localStorage.removeItem(STORAGE_KEY);
    setEnabled(false);
    if (requested) {
      setSearchParams(
        (params) => {
          params.delete("mode");
          return params;
        },
        { replace: true }
      );
    }
  };

  return (
    <CatModeContext.Provider value={{ enabled, disable }}>
      {enabled && <div className="cat-doodles" aria-hidden="true" />}
      {children}
    </CatModeContext.Provider>
  );
};

export const DisableCatModeButton = () => {
  const context = useContext(CatModeContext);
  if (!context) throw new Error("DisableCatModeButton must be used within a CatModeProvider");

  return context.enabled ? (
    <button
      type="button"
      className="cat-mode-toggle"
      onClick={context.disable}
      title="Вимкнути котячий режим"
      aria-label="Вимкнути котячий режим"
    />
  ) : null;
};
