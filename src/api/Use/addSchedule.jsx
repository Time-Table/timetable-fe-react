import axios from "axios";

export const addSchedule = async (tableId, name, availableTimes) => {
  try {
    const res = await axios.post("http://localhost:3001/api/addSchedule", {
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
