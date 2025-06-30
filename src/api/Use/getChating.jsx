import axios from "axios";

export const getChating = async (tableId) => {
  try {
    const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/getChating`, {
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
