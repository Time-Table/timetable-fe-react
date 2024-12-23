import axios from "axios";

export const getTableInfo = async (tableId) => {
  try {
    const res = await axios.get("http://localhost:3001/api/tableInfo", {
      params: { tableId: tableId },
    });
    return res.data.data;
  } catch (error) {
    console.error("getTableInfo: ", error.response);
    return error.response?.data;
  }
};
