import type { ExamsTimetableItem, TimetableItem } from "@/types/timetable";
import ISCFile from "@/utils/export/ICSFile";
import { isExams } from "@/utils/timetable";
import { useMemo } from "react";

const useTimetableISCFile = (
  timetable: TimetableItem[] | ExamsTimetableItem[] | undefined | false,
  isSecondSubgroup: boolean
) => {
  const icsFILE = useMemo(() => {
    let fileContent: string;
    if (!timetable) return undefined;
    if (timetable[0] && !isExams(timetable[0])) {
      fileContent = ISCFile.fromTimetable(timetable as TimetableItem[], isSecondSubgroup ? 2 : 1);
    } else {
      fileContent = ISCFile.fromExamsTimetable(timetable as ExamsTimetableItem[]);
    }
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    return url;
  }, [isSecondSubgroup, timetable]);
  return icsFILE;
};

export default useTimetableISCFile;
