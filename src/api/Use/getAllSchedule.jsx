import { instance as axios } from "../interceptors";

export const getAllSchedule = async (tableId) => {
  try {
    const res = await axios.get("/api/users", {
      params: { tableId: tableId },
    });
    return res;
  } catch (error) {
    console.error("getAllSchedule: ", error.response);
    return error.response?.data;
  }
};

