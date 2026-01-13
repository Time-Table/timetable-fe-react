import axios from "axios";

export const generateSchedule = async (tableId) => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_SERVER_URL}/api/schedules/generation`, {
      tableId,
    });
    return res.data;
  } catch (error) {
    console.error("getAllSchedule: ", error.response);
    return error.response?.data;
  }
};
