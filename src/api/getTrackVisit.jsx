import { instance as axios } from "./interceptors";

export const getTrackVisit = async () => {
  try {
    const res = await axios.get("/api/visits");
    return res;
  } catch (error) {
    console.error("getTrackVisit 에러 ", error);
    return error.message;
  }
};

