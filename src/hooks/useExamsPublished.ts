import { useEffect, useState } from "react";
import { isExamsPublished } from "@/utils/data/LPNUData";

export default function useExamsPublished() {
  const [published, setPublished] = useState(false);

  useEffect(() => {
    let active = true;
    isExamsPublished().then((value) => {
      if (active) setPublished(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return published;
}
