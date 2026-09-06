import { useEffect } from "react";
import { useNavigate } from "react-router";
import TimetableManager from "@/utils/data/TimetableManager";

const NavigationSelector = () => {
  const navigate = useNavigate();

  useEffect(() => {
    TimetableManager.getLastOpenedPath().then((path) => {
      navigate(path ? `/${path}` : "/home");
    });
  }, [navigate]);
  return null;
};

export default NavigationSelector;
