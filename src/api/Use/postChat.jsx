import axios from "axios";

export const postChat = async (tableId, name, message) => {
  try {
    const res = await axios.post("http://localhost:3001/api/postChat", {
      tableId,
      name,
      message,
    });
    return res.data;
  } catch (error) {
    console.error("postChat: ", error.response);
    return error.response?.data;
  }
};
