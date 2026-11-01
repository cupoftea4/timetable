import { useParams } from "react-router-dom";
import { CUSTOM_PREFIX, ROOM_PREFIX } from "@/utils/timetable";

const useGroupParam = () => {
  const { group, id, room } = useParams();
  return (id ? CUSTOM_PREFIX + id : room ? ROOM_PREFIX + room : group)?.trim() ?? "";
};

export default useGroupParam;
