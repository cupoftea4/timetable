import TimetableManager from "@/utils/data/TimetableManager";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const NavigationSelector = () => {
  const navigate = useNavigate();

  useEffect(() => {
    TimetableManager.getLastOpenedTimetable().then((t) => {
      navigate(t || "/home");
    });
  }, [navigate]);
  return null;
};

export default NavigationSelector;
