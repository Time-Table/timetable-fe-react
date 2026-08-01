import { sendEvent } from "../api/event";
import { isAdmin } from "./admin";
import { VISITOR_KEY, SOURCE_KEY } from "./storage";

/**
 * 퍼널 단계 이름. 백엔드 utils/funnels.js의 정의와 짝을 이룬다.
 * 값을 바꾸면 이전에 쌓인 데이터와 연결이 끊기므로 새 단계를 추가하는 쪽을 택할 것.
 */
export const EVENTS = {
  // 생성 퍼널
  LANDING_VIEW: "landing_view",
  CREATE_CTA_CLICK: "create_cta_click",
  CREATE_VIEW: "create_view",
  CREATE_SUBMIT: "create_submit",
  CREATE_SUCCESS: "create_success",
  INVITE_SHARE: "invite_share",

  // 참여 퍼널
  TABLE_VIEW: "table_view",
  JOIN_SUBMIT: "join_submit",
  JOIN_SUCCESS: "join_success",
  SCHEDULE_SAVE: "schedule_save",
  RANKING_OPEN: "ranking_open",
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * 브라우저 단위 익명 식별자. 개인정보는 담지 않으며,
 * "한 사람이 어느 단계까지 진행했는가"를 이어붙이는 용도로만 쓴다.
 */
export const getVisitorId = () => {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = createId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

const detectSource = () => {
  const utm = new URLSearchParams(window.location.search).get("utm_source");
  if (utm) return utm.slice(0, 60);

  const referrer = document.referrer;
  if (!referrer) return "direct";

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    // 사이트 내부 이동은 유입이 아니다.
    return host === window.location.hostname ? "internal" : host;
  } catch {
    return "direct";
  }
};

/**
 * 유입 경로는 첫 방문 시점의 값을 계속 쓴다(first-touch).
 * 사이트 안을 돌아다닐 때마다 덮어쓰면 "어디서 왔는지"가 사라진다.
 */
export const getSource = () => {
  const stored = localStorage.getItem(SOURCE_KEY);
  if (stored) return stored;

  const detected = detectSource();
  const source = detected === "internal" ? "direct" : detected;
  localStorage.setItem(SOURCE_KEY, source);
  return source;
};

/** 화면 폭 기준 기기 구분. UA 파싱보다 반응형 대응 판단에 직접적으로 쓸모 있다. */
const getDevice = () => {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

/**
 * 퍼널 이벤트를 기록한다. 관리자 브라우저는 집계에서 제외된다.
 * 응답을 기다리지 않는 fire-and-forget 방식이라 호출부에서 await할 필요가 없다.
 */
export const trackEvent = (name, tableId) => {
  if (isAdmin()) return;
  sendEvent({
    name,
    visitorId: getVisitorId(),
    tableId,
    source: getSource(),
    device: getDevice(),
  });
};
