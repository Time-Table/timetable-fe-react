import { getVisitorId, trackClarityEvent, CLARITY_EVENTS } from "./analytics";
import { isAdmin } from "./admin";

/**
 * 랜딩 A/B 1회차(2026-09-29 사람 지시, 명세 specs/api-contract.md "랜딩 A/B").
 * v1 = 지금 랜딩(StartPage), v2 = 스크롤 이야기(LandingV2Page). 같은 주소 `/`에서 방문자를 반반 나눈다.
 *
 * 배정은 따로 저장하지 않고 방문자 ID에서 매번 계산한다. 서버 이벤트에도 같은 visitorId가 남으므로
 * 서버가 같은 계산을 하면 요청 필드를 늘리지 않고도 어느 쪽을 봤는지 되살릴 수 있다.
 * 그래서 key·비율·해시를 바꾸면 이미 쌓인 기록의 배정도 바뀐다. 실험 중에는 바꾸지 않는다.
 */
export const LANDING_AB = {
  key: "landing-ab-1",
  startDate: "2026-09-29",
  active: true,
  // 0~99 칸 중 이 값보다 작은 칸이 v2다.
  v2Percent: 50,
};

/** FNV-1a 32비트. 명세에 적은 그대로 계산해 서버와 값이 같아야 한다. 방문자 ID는 ASCII다. */
export const fnv1a32 = (text) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
};

/** 방문자 ID → 0~99 칸 → v1/v2. */
export const landingVariantFor = (visitorId) =>
  fnv1a32(`${LANDING_AB.key}:${visitorId}`) % 100 < LANDING_AB.v2Percent ? "v2" : "v1";

/**
 * 이 브라우저가 `/`에서 볼 랜딩. `inExperiment`가 참일 때만 지표에 넣는다.
 * - 실험이 꺼져 있으면 모두 v1.
 * - 관리자는 지표에서 빠지므로 v1을 보되 `?landing=v2`로 v2를 골라 볼 수 있다.
 *   관리자가 아닌 사람에게는 이 값을 받지 않는다. 받으면 서버가 계산한 배정과 어긋난다.
 * - 저장소가 막혀 방문자 ID를 못 만들면 v1. 이때는 계측도 나가지 않는다.
 */
export const assignLandingVariant = (search = window.location.search) => {
  if (!LANDING_AB.active) return { variant: "v1", inExperiment: false };
  try {
    if (isAdmin()) {
      const forced = new URLSearchParams(search).get("landing");
      return { variant: forced === "v2" ? "v2" : "v1", inExperiment: false };
    }
    return { variant: landingVariantFor(getVisitorId()), inExperiment: true };
  } catch (error) {
    return { variant: "v1", inExperiment: false };
  }
};

/**
 * Clarity에 이 세션이 본 쪽을 남긴다. 필터용 사용자 지정 태그와, 퍼널 첫 단계로 쓸 노출 이벤트 둘 다.
 * 관리자·Clarity 부재·예외는 조용히 넘어간다(노출 이벤트는 trackClarityEvent가 관리자를 거른다).
 */
export const tagLandingVariant = (variant) => {
  try {
    if (isAdmin() || typeof window.clarity !== "function") return;
    window.clarity("set", "tt_landing_variant", variant);
  } catch (error) {
    // Clarity 차단·저장소 오류는 화면에 영향을 주지 않는다.
  }
  trackClarityEvent(variant === "v2" ? CLARITY_EVENTS.LANDING_VIEW_V2 : CLARITY_EVENTS.LANDING_VIEW_V1);
};
