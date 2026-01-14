import { instance as axios } from "../interceptors";

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

