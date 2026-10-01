import { instance as axios } from "./interceptors";

export const sendEvent = async (payload) => {
  try {
    const res = await axios.post("/api/events", payload, { silent: true });
    return res;
  } catch (error) {
    // 수집 실패가 사용자 흐름을 막으면 안 되므로 조용히 넘어간다.
    return null;
  }
};

/**
 * 페이지가 사라지는 중에도 끝까지 가는 전송(fetch keepalive). 다른 출처 API에 미리 묻기(preflight) 없이 가도록
 * Content-Type을 text/plain으로 두고 본문은 JSON 문자열로 보낸다(BE /api/events가 8KB까지 읽는다).
 */
export const sendEventKeepalive = (payload) => {
  try {
    const base = (axios.defaults.baseURL || "").replace(/\/$/, "");
    fetch(`${base}/api/events`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (error) {
    // 수집 실패가 사용자 흐름을 막으면 안 된다.
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
