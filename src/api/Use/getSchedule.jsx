import axios from "axios";

export const getSchedule = async (tableId) => {
  try {
    const res = await axios.get(`http://localhost:3001/api/getSchedule`, {
      params: { tableId },
    });

    return res.data.data;
  } catch (error) {
    console.error("getAllSchedule: ", error.response);
    return error.response?.data;
  }
};
