import { instance } from "./interseptors/intex";

export const trackVisit = async (page) => {
  try {
    const res = await instance.post(`${process.env.REACT_APP_SERVER_URL}/api/visits`, {
      page: page,
    });
    return res;
  } catch (error) {
    console.error("getTrackVisit 에러 ", error);
    return error.message;
  }
};
