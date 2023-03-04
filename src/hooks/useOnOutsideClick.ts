import { useEffect, useRef } from "react";

export default function useOnClickOutside<T extends HTMLElement >(handle: () => void) {
  const ref: React.MutableRefObject<T | null> = useRef(null);
  
  useEffect(() => {
    function handleClickOutside({target}: MouseEvent) {
      if (ref?.current && target instanceof HTMLElement && !ref.current.contains(target)) {
        handle();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handle, ref]);

  return ref;
}