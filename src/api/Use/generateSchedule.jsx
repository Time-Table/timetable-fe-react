import axios from "axios";

export const generateSchedule = async (tableId) => {
  try {
    const res = await axios.post("/api/generateSchedule", { tableId });
    return res.data;
  } catch (error) {
    console.error("getAllSchedule: ", error.response);
    return error.response?.data;
  }
};
