import { instance as axios } from "./interceptors";

export const trackVisit = async (page) => {
  try {
    const res = await axios.post("/api/visits", {
      page: page,
    });
    return res;
  } catch (error) {
    console.error("getTrackVisit 에러 ", error);
    return error.message;
  }
};

