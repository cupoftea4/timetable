import { useEffect } from "react";

const usePageTitle = (title: string): void => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default usePageTitle;
