import { useLayoutEffect, useState } from "react";

export function useDelayedProp<T>(prop: T, delay: number): [T, boolean] {
  const [innerProp, setInnerProp] = useState(prop);
  const [shouldAppear, setShouldAppear] = useState(true);

  useLayoutEffect(() => {
    setShouldAppear(false);
    const id = setTimeout(() => {
      setInnerProp(prop);
      setShouldAppear(true);
    }, delay);
    return () => clearTimeout(id);
  }, [prop, delay]);

  return [innerProp, shouldAppear];
}
