import { instance as axios } from "./interceptors";

/**
 * 문의를 보낸다. 화면이 결과별로 다른 안내를 해야 하므로 실패를 뭉개지 않고 구분해 돌려준다.
 * silent: 429여도 공용 인터셉터의 경고 모달 대신 폼 안에서 안내한다.
 */
export const sendInquiry = async (payload) => {
  try {
    const res = await axios.post("/api/inquiries", payload, { silent: true });
    return { ok: true, skipped: Boolean(res?.skipped) };
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = typeof data === "string" ? data : data?.message;
    if (status === 429) return { ok: false, reason: "rateLimited", message };
    if (status === 400) return { ok: false, reason: "invalid", message };
    return { ok: false, reason: "failed" };
  }
};
