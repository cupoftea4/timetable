import { useRef } from "react";

const useFocus = <T extends HTMLElement>() => {
  const htmlElRef = useRef<T | null>(null);
  const setFocus = (childInput = false) => {
    if (childInput) {
      htmlElRef.current?.querySelector("input")?.focus();
      return;
    }
    htmlElRef.current?.focus();
  };
  return [htmlElRef, setFocus] as const;
};

export default useFocus;
