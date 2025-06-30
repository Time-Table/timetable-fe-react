import axios from "axios";

export const getSchedule = async (tableId) => {
  try {
    const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/getSchedule`, {
      params: { tableId },
    });
    if (res.status === 201) {
      return;
    }
    return res.data.data;
  } catch (error) {
    console.error("getAllSchedule: ", error.response);
    return error.response?.data;
  }
};
