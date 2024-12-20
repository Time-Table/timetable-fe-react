import axios from "axios";

export const deleteUser = async (tableId, name, password) => {
  try {
    const res = await axios.delete(`${process.env.REACT_APP_SERVER_URL}/api/deleteUser`, {
      data: { tableId, name, password },
    });
    return res.data;
  } catch (error) {
    console.error("deleteUser error:", error.response);
    return error.response?.data;
  }
};
