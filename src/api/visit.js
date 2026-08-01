import { instance as axios } from "./interceptors";
import { isAdmin } from "../utils/admin";

export const trackVisit = async (page) => {
  // 관리자는 조회수/방문기록 집계에서 제외한다. (서버에서도 한 번 더 걸러낸다)
  if (isAdmin()) return null;

  try {
    const res = await axios.post("/api/visits", {
      page,
    });
    return res;
  } catch (error) {
    console.error("trackVisit error: ", error);
    return error.message;
  }
};

export const getTrackVisit = async () => {
  try {
    const res = await axios.get("/api/visits");
    return res;
  } catch (error) {
    console.error("getTrackVisit error: ", error);
    return error.message;
  }
};
