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
    const onBlur = (e: Event) => {
      const relatedTarget = (e as FocusEvent).relatedTarget as HTMLElement | null;
      // Check if the focus is moving to a list item
      if (relatedTarget?.role === "option") return;
      setIsFocused(false);
    };
    input?.addEventListener("blur", onBlur);

    return () => {
      input?.removeEventListener("blur", onBlur);
    };
  }, [isChildInput]);

  const focus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const blur = useCallback(() => {
    setIsFocused(false);
  }, []);

  useEffect(() => {
    const input = isChildInput ? ref.current?.querySelector("input") : ref.current;

    if (isFocused) {
      // FIXME
      setTimeout(() => {
        input?.focus();
      }, 50);
    }
  }, [isFocused, isChildInput]);
  return { ref, isFocused, focus, blur } as const;
};

export default useInputFocus;
