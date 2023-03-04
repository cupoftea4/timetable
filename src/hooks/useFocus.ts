import { useRef } from "react";

const useFocus = <T extends HTMLElement>() => {
    const htmlElRef = useRef<T | null>(null);
    const setFocus = (childInput: boolean = false) => { 
      if (childInput) {
        htmlElRef.current && htmlElRef.current.querySelector("input")?.focus();
        return;
      }
      htmlElRef.current && htmlElRef.current.focus() 
    }
    return [htmlElRef, setFocus] as const;
};

export default useFocus;