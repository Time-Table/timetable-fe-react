import axios from "axios";

export const postChat = async (tableId, name, message) => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_SERVER_URL}/api/postChat`, {
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
