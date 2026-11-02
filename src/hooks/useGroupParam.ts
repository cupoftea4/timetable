import { useParams } from "react-router-dom";
import { CUSTOM_PREFIX, ROOM_PREFIX } from "@/utils/timetable";

// Messengers leave the trailing dot of "н.к." out of shared links
const fixRoomName = (room: string) => room.trim().replace(/ н\.к$/, " н.к.");

const useGroupParam = () => {
  const { group, id, room } = useParams();
  return (id ? CUSTOM_PREFIX + id : room ? ROOM_PREFIX + fixRoomName(room) : group)?.trim() ?? "";
};

export default useGroupParam;
