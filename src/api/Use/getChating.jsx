import { instance as axios } from "../interceptors";

export const getChating = async (tableId) => {
  try {
    const res = await axios.get("/api/chats", {
      params: { tableId },
    });
    return res;
  } catch (error) {
    console.error("getChating: ", error.response);
    return error.response?.data;
  }
};
