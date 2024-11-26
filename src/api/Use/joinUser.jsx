import axios from "axios";

export const joinUser = async (tableId, name, password) => {
  try {
    const res = await axios.post("http://localhost:3001/api/join", {
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
