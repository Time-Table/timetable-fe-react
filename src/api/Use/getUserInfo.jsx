import axios from "axios";

export const getUserInfo = async (tableId, name, password, availableTimes) => {
  try {
    const res = await axios.get("http://localhost:3001/api/userInfo", {
      params: {
        tableId: tableId,
        name: name,
        password: password,
        availableTimes: availableTimes,
      },
    });
    return res.data;
  } catch (error) {
    console.error("getUserInfo: ", error.response);
    return error.response?.data;
  }
};
