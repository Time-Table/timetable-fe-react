import { isAdmin } from "./admin";
import { trackEvent, EVENTS, trackClarityEvent, CLARITY_EVENTS, setActiveTableUi, getVisitorId } from "./analytics";
import { TABLE_UI_KEY, TABLE_UI_VOTE_KEY } from "./storage";

/**
 * 표 화면 A/B 2회차(2026-10-01, 하네스 specs/table-ab-2.md). A = 기존 표 화면, B = 새 화면.
 * 사람(브라우저 visitorId)마다 반반 나누고, 누구나 맨 위 띠로 바꿀 수 있다. 바꾼 화면은 이 브라우저의 모든 표에 쓴다.
 * 켜고 끄기는 서버 상태(매니저 [시작]·[중단], GET /api/experiments/table-ab)다. 빌드 값은 쓰지 않는다.
 *
 * 배정은 저장하지 않고 visitorId로 매번 계산한다. 서버도 같은 계산으로 되살린다(BE utils/tableExperiment.js).
 * 그래서 key·비율·해시를 바꾸면 쌓인 기록의 배정도 바뀐다. 실험 중에는 바꾸지 않는다.
 */
export const TABLE_AB = {
  key: "table-ab-2",
  // 0~99 칸 중 이 값보다 작은 칸이 B다.
  bPercent: 50,
};

/** FNV-1a 32비트. 랜딩 A/B(landingExperiment.js)와 같은 계산이며 명세에 적은 그대로다. visitorId는 ASCII다. */
const fnv1a32 = (text) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
};

/** visitorId → "A" | "B". */
export const assignedTableUi = (visitorId) =>
  fnv1a32(`${TABLE_AB.key}:${visitorId}`) % 100 < TABLE_AB.bPercent ? "B" : "A";

/** 실험용 브라우저 ID. 저장소를 못 쓰면 null이고 이 브라우저는 실험에서 뺀다(A, 띠·기록 없음). */
export const experimentVisitorId = () => {
  try {
    return getVisitorId();
  } catch (error) {
    return null;
  }
};

/** 띠로 고른 화면. 이번 회차 key가 아니면 버린다. */
const readChoice = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(TABLE_UI_KEY) || "null");
    return parsed && parsed.key === TABLE_AB.key && (parsed.ui === "A" || parsed.ui === "B") ? parsed.ui : null;
  } catch (error) {
    return null;
  }
};

/** 이 브라우저가 볼 화면. 실험이 꺼져 있거나 브라우저를 식별 못 하면 A, 띠로 고른 적이 있으면 그 선택, 없으면 배정. */
export const resolveTableUi = ({ running, visitorId }) => {
  if (!running || !visitorId) return "A";
  return readChoice() || assignedTableUi(visitorId);
};

/** Clarity 세션 필터용 태그. 관리자·Clarity 부재·예외는 넘어간다. */
export const tagTableUi = (version) => {
  try {
    if (isAdmin() || typeof window.clarity !== "function") return;
    window.clarity("set", "tt_table_ui", version);
  } catch (error) {
    // Clarity 차단·저장소 오류는 화면에 영향을 주지 않는다.
  }
};

/**
 * 띠로 화면을 바꿨을 때. 선택을 남기고, 서버 ui_switch에 바꾼 뒤 화면이 붙도록 먼저 지금 화면을 바꿔 둔다.
 * viewId는 떠나는 화면 구간이다. 저장소가 막혀 있으면 이번 화면에서만 바뀐다.
 */
export const switchTableUi = (tableId, version, { viewId } = {}) => {
  try {
    localStorage.setItem(TABLE_UI_KEY, JSON.stringify({ key: TABLE_AB.key, ui: version }));
  } catch (error) {
    // 사생활 모드 등
  }
  setActiveTableUi(tableId, version);
  trackEvent(EVENTS.UI_SWITCH, tableId, undefined, { viewId });
  trackClarityEvent(version === "B" ? CLARITY_EVENTS.UI_SWITCH_B : CLARITY_EVENTS.UI_SWITCH_A);
};

/** 띠 하트로 투표한 화면("A"·"B"). 이번 회차 key가 아니거나 없으면 null. */
export const readTableUiVote = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(TABLE_UI_VOTE_KEY) || "null");
    return parsed && parsed.key === TABLE_AB.key && (parsed.ui === "A" || parsed.ui === "B") ? parsed.ui : null;
  } catch (error) {
    return null;
  }
};

/**
 * 띠 하트 투표(2026-10-02 사람 결정 2안). 지금 보는 화면(version)에 한 표, 이미 그 화면에 투표했으면 취소.
 * 다른 화면 표는 옮겨 온다(사람당 한 표). 이 브라우저에 남기고 서버에 ui_vote(reason vote|cancel)를 보낸다.
 * 돌려주는 값: 투표 뒤의 표("A"·"B"·null).
 */
export const voteTableUi = (tableId, version, current) => {
  const cancel = current === version;
  try {
    if (cancel) localStorage.removeItem(TABLE_UI_VOTE_KEY);
    else localStorage.setItem(TABLE_UI_VOTE_KEY, JSON.stringify({ key: TABLE_AB.key, ui: version }));
  } catch (error) {
    // 저장소가 막혀 있으면 이번 화면에서만 기억한다.
  }
  trackEvent(EVENTS.UI_VOTE, tableId, undefined, { uiVersion: version, reason: cancel ? "cancel" : "vote" });
  return cancel ? null : version;
};
