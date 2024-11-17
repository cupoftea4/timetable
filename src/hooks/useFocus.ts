import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const useInputFocus = <T extends HTMLElement>({
  childInput = false,
  initFocus = false,
}: {
  childInput?: boolean;
  initFocus?: boolean;
}) => {
  const isChildInput = useMemo(() => childInput, [childInput]);
  const [isFocused, setIsFocused] = useState(initFocus);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const input = isChildInput ? ref.current?.querySelector("input") : ref.current;
    const onBlur = () => setIsFocused(false);
    input?.addEventListener("blur", onBlur);

    return () => {
      input?.removeEventListener("blur", onBlur);
    };
  }, [isChildInput]);

  const focus = useCallback(() => {
    setIsFocused(true);
  }, []);

  useEffect(() => {
    const input = isChildInput ? ref.current?.querySelector("input") : ref.current;

    if (isFocused) {
      input?.focus();
    }
  }, [isFocused, isChildInput]);
  return { ref, isFocused, focus } as const;
};

export default useInputFocus;
