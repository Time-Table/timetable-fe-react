import { instance as axios } from "./interceptors";

export const createTable = async (title, dates, startHour, endHour, banedCells) => {
  try {
    const res = await axios.post("/api/tables", {
      title,
      dates,
      startHour,
      endHour,
      banedCells,
    });
    return res;
  } catch (error) {
    console.error("createTable error: ", error.response?.data || error.message);
    return error.response?.data;
  }
};

export const getTableInfo = async (tableId) => {
  try {
    const res = await axios.get(`/api/tables/${tableId}`);
    return res.data;
  } catch (error) {
    console.error("getTableInfo error: ", error.response);
    return error.response;
  }
};
