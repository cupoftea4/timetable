import { useEffect } from "react";

const useGTagTimetableEvents = (group: string, source: string, isCustomSource?: boolean) => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: it should be sent only when the group changes
  useEffect(() => {
    window.gtag("event", "open_timetable", {
      event_category: "Timetable",
      event_label: group,
      group,
      source,
    });
  }, [group]);

  useEffect(() => {
    window.gtag("event", "open_timetable_from", {
      event_category: "Timetable",
      event_label: source ?? "url",
      isCustomSource,
      group,
      source,
    });
  }, [source, isCustomSource, group]);
};

export default useGTagTimetableEvents;
