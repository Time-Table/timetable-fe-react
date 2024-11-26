import axios from "axios";

export const getAllSchedule = async (tableId) => {
  try {
    const res = await axios.get("http://localhost:3001/api/users", {
      params: { tableId: tableId },
    });
    return res.data;
  } catch (error) {
    console.error("getAllSchedule: ", error.response);
    return error.response?.data;
  }
};
