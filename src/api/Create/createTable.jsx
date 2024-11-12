import axios from "axios";

export const createTable = async (title, dates, startHour, endHour, banedCells) => {
  try {
    const res = await axios.post("http://localhost:3001/api/create", {
      title: title,
      dates: dates,
      startHour: startHour,
      endHour: endHour,
      banedCells: banedCells,
    });
    return res.data;
  } catch (error) {
    console.error("createTable: ", error.response.data);
    return error.response.data;
  }
};
