import axios from "axios";

export const getTableInfo = async (tableId) => {
  try {
    const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/tables/${tableId}`);
    return res.data.data;
  } catch (error) {
    console.error("getTableInfo: ", error.response);
    return error.response;
  }
};
