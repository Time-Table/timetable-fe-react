import { instance } from "./interseptors/intex";

export const getTrackVisit = async () => {
  try {
    const res = await instance.get(`${process.env.REACT_APP_SERVER_URL}/api/getTrackVisit`, {});
    return res;
  } catch (error) {
    console.error("getTrackVisit 에러 ", error);
    return error.message;
  }
};
