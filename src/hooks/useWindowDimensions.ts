import { MOBILE_SCREEN_BREAKPOINT, TABLET_SCREEN_BREAKPOINT } from "@/utils/constants";
import { useEffect, useState } from "react";

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export default function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return windowDimensions;
}

export function useIsMobile() {
  const { width } = useWindowDimensions();
  return width < MOBILE_SCREEN_BREAKPOINT;
}

export function useIsTablet() {
  const { width } = useWindowDimensions();
  return width < TABLET_SCREEN_BREAKPOINT;
}
