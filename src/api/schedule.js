import { instance as axios } from "./interceptors";

export const addSchedule = async (tableId, name, availableTimes) => {
  try {
    const res = await axios.post("/api/schedules", {
      tableId,
      name,
      availableTimes,
    });
    if (res.success) {
      return res.data;
    }
  } catch (error) {
    console.error("addSchedule error:", error.response || error);
  }
};

export const getSchedule = async (tableId) => {
  try {
    const res = await axios.get("/api/schedules", {
      params: { tableId },
    });
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
