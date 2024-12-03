import axios from "axios";

export const getChating = async (tableId) => {
  try {
    const res = await axios.get("http://localhost:3001/api/getChating", {
      params: { tableId },
    });
    if (res.status === 201) {
      return res;
    }

    return res.data;
  } catch (error) {
    console.error("getChating: ", error.response);
    return error.response?.data;
  }
};
