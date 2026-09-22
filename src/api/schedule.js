import { instance as axios } from "./interceptors";

export const addSchedule = async (tableId, name, availableTimes) => {
  try {
    const res = await axios.post("/api/schedules", {
      tableId,
      name,
      availableTimes,
    });
    return res;
  } catch (error) {
    console.error("addSchedule error:", error.response || error);
    throw error;
  }
};

export const getSchedule = async (tableId) => {
  try {
    const res = await axios.get("/api/schedules", {
      params: { tableId },
    });
    // 아직 집계 문서가 없는 성공 응답은 정상적인 빈 일정이다.
    if (res.success === true && res.data === undefined) return [];
    return res.data;
  } catch (error) {
    console.error("getSchedule error: ", error.response);
    return error.response?.data;
  }
};

export const generateSchedule = async (tableId) => {
  try {
    const res = await axios.post("/api/schedules/generation", {
      tableId,
    });
    return res;
  } catch (error) {
    console.error("generateSchedule error: ", error.response);
    return error.response?.data;
  }
};
