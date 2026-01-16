import { instance as axios } from "./interceptors";

export const trackVisit = async (page) => {
  try {
    const res = await axios.post("/api/visits", {
      page,
    });
    return res;
  } catch (error) {
    console.error("trackVisit error: ", error);
    return error.message;
  }
};

export const getTrackVisit = async () => {
  try {
    const res = await axios.get("/api/visits");
    return res;
  } catch (error) {
    console.error("getTrackVisit error: ", error);
    return error.message;
  }
};
