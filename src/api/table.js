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
    if (error.response?.status === 429) {
      return { isRateLimit: true };
    }
    return error.response?.data;
  }
};

export const getTableInfo = async (tableId) => {
  try {
    const res = await axios.get(`/api/tables/${tableId}`);
    return res;
  } catch (error) {
    console.error("getTableInfo error: ", error.response);
    return error.response;
  }
};

export const getAllTables = async () => {
  try {
    const res = await axios.get("/api/tables");
    return res;
  } catch (error) {
    console.error("getAllTables error: ", error.response);
    return error.response;
  }
};

export const updateTable = async (tableId, updateData) => {
  try {
    const res = await axios.patch(`/api/tables/${tableId}`, updateData);
    return res;
  } catch (error) {
    console.error("updateTable error: ", error.response);
    return error.response;
  }
};

export const deleteTable = async (tableId) => {
  try {
    const res = await axios.delete(`/api/tables/${tableId}`);
    return res;
  } catch (error) {
    console.error("deleteTable error: ", error.response);
    return error.response;
  }
};
