import { useParams } from "react-router-dom";
import { CUSTOM_PREFIX } from "@/utils/timetable";

const useGroupParam = () => {
  const { group, id } = useParams();
  return (id ? CUSTOM_PREFIX + id : group)?.trim() ?? "";
};

export default useGroupParam;
