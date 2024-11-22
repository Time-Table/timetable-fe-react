import axios from "axios";

export const deleteUser = async (tableId, name, password) => {
  try {
    const res = await axios.delete("http://localhost:3001/api/deleteUser", {
      data: { tableId, name, password },
    });
    return res.data;
  } catch (error) {
    console.error("deleteUser error:", error.response);
    return error.response?.data;
  }
};
