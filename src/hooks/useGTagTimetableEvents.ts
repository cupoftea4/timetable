import { useEffect } from "react";

const useGTagTimetableEvents = (group: string, source: string, isCustomSource?: boolean) => {
  useEffect(() => {
    window.gtag("event", `open_${group}`, {
      event_category: "Timetable",
      event_label: group,
    });
  }, [group]);

  useEffect(() => {
    window.gtag("event", `open_timetable_from_${source ?? "url"}`, {
      event_category: "Timetable",
      event_label: group,
      source: source ?? "url",
      isCustomSource,
      group,
    });
  }, [source, isCustomSource, group]);
};

export default useGTagTimetableEvents;
