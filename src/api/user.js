import { instance as axios } from "./interceptors";

export const joinUser = async (tableId, name, password) => {
  try {
    const res = await axios.post("/api/users", {
      tableId,
      name,
      password,
    });
    return res;
  } catch (error) {
    console.error("joinUser error: ", error.response);
    return error.response?.data;
  }
};

export const getUserInfo = async (tableId, name, password) => {
  try {
    const res = await axios.post("/api/users/verify", {
      tableId,
      name,
      password,
    });
    return res;
  } catch (error) {
    if (error.response?.status === 401) {
      return error.response?.data;
    }
    return error.response?.data;
  }
};

export const deleteUser = async (tableId, name, password) => {
  try {
    const res = await axios.delete("/api/users", {
      data: { tableId, name, password },
    });
    return res;
  } catch (error) {
    console.error("deleteUser error:", error.response);
    return error.response?.data;
  }
};

export const getAllSchedule = async (tableId) => {
  try {
    const res = await axios.get("/api/users", {
      params: { tableId },
    });
    return res;
  } catch (error) {
    console.error("getAllSchedule error: ", error.response);
    return error.response?.data;
  }
};
