import { instance as axios } from "./interceptors";

export const getChating = async (tableId) => {
  try {
    const res = await axios.get("/api/chats", {
      params: { tableId },
    });
    return res;
  } catch (error) {
    console.error("getChating error: ", error.response);
    return error.response?.data;
  }
};

export const postChat = async (tableId, name, message) => {
  try {
    const res = await axios.post("/api/chats", {
      tableId,
      name,
      message,
    });
    return res;
  } catch (error) {
    console.error("postChat error: ", error.response);
    return error.response?.data;
  }
};
