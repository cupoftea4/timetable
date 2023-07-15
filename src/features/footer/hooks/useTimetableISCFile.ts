import { useMemo } from "react";
import { ExamsTimetableItem, TimetableItem } from "@/utils/types";
import ISCFile from "@/utils/export/ICSFile";
import { isExams } from "@/utils/timetable";

const useTimetableISCFile = (
  timetable: TimetableItem[] | ExamsTimetableItem[] | undefined | false, 
  isSecondSubgroup: boolean, isSecondWeek: boolean
) => {
  const icsFILE = useMemo(() => {
    console.log(timetable);
    let fileContent;
    if (!timetable) return undefined;
    if (timetable[0] && !isExams(timetable[0])) {
      fileContent = ISCFile.fromTimetable(timetable as TimetableItem[], isSecondSubgroup ? 2 : 1, isSecondWeek ? 2 : 1);     
    } else {
      fileContent = ISCFile.fromExamsTimetable(timetable as ExamsTimetableItem[]);
    }
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    return url; 
  }, [isSecondSubgroup, isSecondWeek, timetable]);
  return icsFILE;
}

export default useTimetableISCFile;