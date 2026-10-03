import { instance as axios } from "./interceptors";

/**
 * 랜딩 신뢰 표시용 공개 집계(2026-10-04, BE GET /api/stats/landing). 어제까지 30일 참여 등록 건수.
 * 돌려주는 값: { count, asOf } 또는 null(응답이 늦거나 실패했거나 모양이 다를 때. 화면은 표시를 숨긴다).
 * 2.5초 안에 못 받으면 포기한다. 경로가 없는 옛 BE(404)도 null이다.
 */
export const getLandingStats = async ({ timeoutMs = 2500 } = {}) => {
  try {
    const res = await axios.get("/api/stats/landing", { timeout: timeoutMs, silent: true });
    const count = res?.data?.count;
    if (res?.success !== true || !Number.isFinite(count)) return null;
    return { count, asOf: typeof res.data.asOf === "string" ? res.data.asOf : "" };
  } catch (error) {
    return null;
  }
};
