import { useCallback, useSyncExternalStore } from "react";
import { MOBILE_SCREEN_BREAKPOINT, TABLET_SCREEN_BREAKPOINT } from "@/utils/constants";

export default function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_SCREEN_BREAKPOINT - 0.02}px)`);
}

export function useIsTablet() {
  return useMediaQuery(`(max-width: ${TABLET_SCREEN_BREAKPOINT - 0.02}px)`);
}
