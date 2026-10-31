import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Search engines should index the production address, whichever host serves the page
const useCanonicalUrl = (): void => {
  const { pathname } = useLocation();
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.append(link);
    }
    link.href = `https://lpnu.pp.ua${pathname}`;
  }, [pathname]);
};

export default useCanonicalUrl;
