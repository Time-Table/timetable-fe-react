import { instance as axios } from "./interceptors";

export const sendEvent = async (payload) => {
  try {
    const res = await axios.post("/api/events", payload);
    return res;
  } catch (error) {
    // 수집 실패가 사용자 흐름을 막으면 안 되므로 조용히 넘어간다.
    return null;
  }
};

export const getFunnels = async (days) => {
  try {
    const res = await axios.get("/api/events/funnels", { params: { days } });
    return res;
  } catch (error) {
    console.error("getFunnels error: ", error.response);
    return null;
  }
};
