import { instance as axios } from "../interceptors";

export const generateSchedule = async (tableId) => {
  try {
    const res = await axios.post("/api/schedules/generation", {
      tableId,
    });
    return res;
  } catch (error) {
    console.error("generateSchedule: ", error.response);
    return error.response?.data;
  }
};

