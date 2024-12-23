import axios from "axios";

export const getUserInfo = async (tableId, name, password) => {
  try {
    const res = await axios.get("http://localhost:3001/api/userInfo", {
      params: {
        tableId: tableId,
        name: name,
        password: password,
      },
    });
    return res.data;
  } catch (error) {
    if (error.response.status === 401) {
      return error.response?.data;
    }
    return error.response?.data;
  }
};
