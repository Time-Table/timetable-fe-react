import { instance as axios } from "../interceptors";

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

