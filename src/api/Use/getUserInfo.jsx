import { instance as axios } from "../interceptors";

export const getUserInfo = async (tableId, name, password) => {
  try {
    const res = await axios.post("/api/users/verify", {
      tableId: tableId,
      name: name,
      password: password,
    });
    return res;
  } catch (error) {
    if (error.response?.status === 401) {
      return error.response?.data;
    }
    return error.response?.data;
  }
};

