import { instance as axios } from "../interceptors";

export const getTableInfo = async (tableId) => {
  try {
    const res = await axios.get(`/api/tables/${tableId}`);
    return res.data;
  } catch (error) {
    console.error("getTableInfo: ", error.response);
    return error.response;
  }
};

