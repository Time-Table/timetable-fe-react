import axios from "axios";

export const joinUser = async (tableId, name, password) => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_SERVER_URL}/api/join`, {
      tableId: tableId,
      name: name,
      password: password,
    });
    return res.data;
  } catch (error) {
    console.error("joinUser: ", error.response);
    return error.response?.data;
  }
};
