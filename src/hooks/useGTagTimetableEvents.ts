import { useEffect } from "react";

const useGTagTimetableEvents = (group: string, source: string, isCustomSource?: boolean) => {
  useEffect(() => {
    window.gtag("event", "open_timetable", {
      event_category: "Timetable",
      event_label: group,
    });
  }, [group]);

  useEffect(() => {
    window.gtag("event", "open_timetable_from", {
      event_category: "Timetable",
      event_label: source ?? "url",
      isCustomSource,
      group,
    });
  }, [source, isCustomSource, group]);
};

export default useGTagTimetableEvents;
