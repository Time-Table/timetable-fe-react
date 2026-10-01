import { instance as axios } from "./interceptors";

/**
 * 표 화면 A/B 2회차 상태(2026-10-01, 하네스 specs/table-ab-2.md). 1.5초 안에 못 받으면 꺼짐으로 본다.
 * 경로가 없는 옛 BE(404)는 실험 전이므로 실패가 아니라 꺼짐이다. 200이어도 모양이 다르면(성공 표시·상태 값이 없음) 실패로 본다.
 * 돌려주는 값: { ok, running, state } 또는 { ok: false, running: false, reason: "timeout" | "error" }
 */
const STATES = ["off", "running", "stopped"];

export const getTableAbState = async ({ timeoutMs = 1500 } = {}) => {
  try {
    const res = await axios.get("/api/experiments/table-ab", { timeout: timeoutMs, silent: true });
    const state = res?.data?.state;
    if (res?.success !== true || !STATES.includes(state)) return { ok: false, running: false, reason: "error" };
    return { ok: true, running: state === "running", state };
  } catch (error) {
    if (error?.response?.status === 404) return { ok: true, running: false, state: "off" };
    const timeout = error?.code === "ECONNABORTED" || /timeout/i.test(String(error?.message || ""));
    return { ok: false, running: false, reason: timeout ? "timeout" : "error" };
  }
};
