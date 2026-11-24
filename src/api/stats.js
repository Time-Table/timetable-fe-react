import { instance as axios } from "./interceptors";

/**
 * 랜딩 신뢰 표시용 공개 집계(2026-10-04, BE GET /api/stats/landing). 어제까지 30일 참여 등록 건수.
 * 모양 검사: success가 true, count는 0 이상 정수, days는 30, asOf·startDate는 YYYY-MM-DD. 하나라도 다르면 못 받은 것으로 본다.
 */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const WINDOW_DAYS = 30;

const isValidStats = (res) => {
  const data = res?.data;
  return (
    res?.success === true &&
    Boolean(data) &&
    Number.isInteger(data.count) &&
    data.count >= 0 &&
    data.days === WINDOW_DAYS &&
    typeof data.asOf === "string" &&
    DATE.test(data.asOf) &&
    typeof data.startDate === "string" &&
    DATE.test(data.startDate)
  );
};

/**
 * 집계를 받아 결과와 실패 이유를 돌려준다(매니저 페이지용). 2.5초 안에 못 받으면 포기한다.
 * { ok: true, count, asOf, startDate, days } 또는 { ok: false, reason: "missing" | "timeout" | "invalid" | "error" }
 * - missing: 경로가 없는 옛 BE(404)  - timeout: 2.5초 초과  - invalid: 200이지만 모양이 다름  - error: 그 밖의 실패
 */
export const fetchLandingStats = async ({ timeoutMs = 2500 } = {}) => {
  try {
    const res = await axios.get("/api/stats/landing", { timeout: timeoutMs, silent: true });
    if (!isValidStats(res)) return { ok: false, reason: "invalid" };
    const { count, asOf, startDate, days } = res.data;
    return { ok: true, count, asOf, startDate, days };
  } catch (error) {
    if (error?.response?.status === 404) return { ok: false, reason: "missing" };
    const timeout = error?.code === "ECONNABORTED" || /timeout/i.test(String(error?.message || ""));
    return { ok: false, reason: timeout ? "timeout" : "error" };
  }
};

/**
 * 랜딩 화면용. { count, asOf } 또는 null(못 받았거나 모양이 다를 때. 화면은 표시를 숨긴다).
 */
export const getLandingStats = async (options) => {
  const result = await fetchLandingStats(options);
  return result.ok ? { count: result.count, asOf: result.asOf } : null;
};
