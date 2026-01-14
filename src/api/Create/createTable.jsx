import { instance as axios } from "../interceptors";

export const createTable = async (title, dates, startHour, endHour, banedCells) => {
  try {
    const res = await axios.post("/api/tables", {
      title: title,
      dates: dates,
      startHour: startHour,
      endHour: endHour,
      banedCells: banedCells,
    });
    return res;
  } catch (error) {
    console.error("createTable: ", error.response?.data || error.message);
    return error.response?.data;
  }
};

