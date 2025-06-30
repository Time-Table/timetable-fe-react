import axios from "axios";

export const createTable = async (title, dates, startHour, endHour, banedCells) => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_SERVER_URL}/api/create`, {
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
