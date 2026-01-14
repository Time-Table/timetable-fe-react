import { instance as axios } from "../interceptors";

export const postChat = async (tableId, name, message) => {
  try {
    const res = await axios.post("/api/chats", {
      tableId,
      name,
      message,
    });
    return res;
  } catch (error) {
    console.error("postChat: ", error.response);
    return error.response?.data;
  }
};

