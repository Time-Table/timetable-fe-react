import { instance as axios } from "../interceptors";

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
    console.error("Error addSchedule:", error.response || error);
  }
};

