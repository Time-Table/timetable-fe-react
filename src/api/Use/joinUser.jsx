import { instance as axios } from "../interceptors";

export const joinUser = async (tableId, name, password) => {
  try {
    const res = await axios.post("/api/users", {
      tableId: tableId,
      name: name,
      password: password,
    });
    return res;
  } catch (error) {
    console.error("joinUser: ", error.response);
    return error.response?.data;
  }
};

