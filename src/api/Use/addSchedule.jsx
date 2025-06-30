import axios from "axios";

export const addSchedule = async (tableId, name, availableTimes) => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_SERVER_URL}/api/addSchedule`, {
      tableId,
      name,
      availableTimes,
    });
    if (res.data.success) {
      return res.data.data;
    }
  } catch (error) {
    console.error("Error addSchedule:", error.response || error);
  }
};
