import { isAdmin } from "./admin";
import { trackEvent, EVENTS, trackClarityEvent, CLARITY_EVENTS, setActiveTableUi } from "./analytics";
import { TABLE_UI_KEY } from "./storage";

/**
 * 테이블 A/B 1회차(2026-09-29 사람 지시, 명세 specs/api-contract.md "테이블 A/B 1회차").
 * A = 지금 표 화면, B = 회차마다 시안을 보고 고친 새 화면. 표마다 반반 나누고, 누구나 맨 위 띠로 바꿀 수 있다.
 *
 * 배정은 저장하지 않고 표 ID와 표 생성 시각으로 매번 계산한다. 서버도 같은 계산으로 되살린다.
 * 그래서 key·비율·해시를 바꾸면 쌓인 기록의 배정도 바뀐다. 실험 중에는 바꾸지 않는다.
 * 사용자가 띠로 바꾼 쪽만 이 브라우저에 표별로 남긴다.
 */
export const TABLE_AB = {
  key: "table-ab-1",
  // 시작 시각(ISO 8601). 비어 있으면 꺼져 있어 모두 A이고 띠도 없다. B가 준비되면 사람이 정해 켠다.
  // 로컬 미리보기는 빌드 환경 변수 REACT_APP_TABLE_AB_START로 켠다.
  startAt: process.env.REACT_APP_TABLE_AB_START || "",
  // 0~99 칸 중 이 값보다 작은 칸이 B다.
  bPercent: 50,
};

/** FNV-1a 32비트. 랜딩 A/B(landingExperiment.js)와 같은 계산이며 명세에 적은 그대로다. 표 ID는 ASCII다. */
const fnv1a32 = (text) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
};

const startTime = () => {
  const time = Date.parse(TABLE_AB.startAt);
  return Number.isFinite(time) ? time : null;
};

/** 실험이 켜져 있는가. 시작 시각이 비었거나 잘못됐거나 아직 오지 않았으면 꺼져 있다. */
export const isTableAbOn = (now = Date.now()) => {
  const start = startTime();
  return start !== null && now >= start;
};

/** 표 ID → 0~99 칸 → A/B. 시작 전에 만든 표와 만든 시각을 모르는 표는 A다. */
export const assignedTableUi = (tableId, createdAt) => {
  const start = startTime();
  const created = Date.parse(createdAt);
  if (start === null || !Number.isFinite(created) || created < start) return "A";
  return fnv1a32(`${TABLE_AB.key}:${tableId}`) % 100 < TABLE_AB.bPercent ? "B" : "A";
};

const readChoices = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(TABLE_UI_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
};

/** 이 브라우저가 이 표에서 볼 화면. 꺼져 있으면 A, 띠로 고른 적이 있으면 그 선택, 없으면 배정. */
export const resolveTableUi = (tableId, createdAt) => {
  if (!isTableAbOn()) return "A";
  const chosen = readChoices()[tableId];
  return chosen === "A" || chosen === "B" ? chosen : assignedTableUi(tableId, createdAt);
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
 * 저장소가 막혀 있으면 이번 화면에서만 바뀐다(다음에 열면 배정으로 돌아간다).
 */
export const switchTableUi = (tableId, version) => {
  try {
    localStorage.setItem(TABLE_UI_KEY, JSON.stringify({ ...readChoices(), [tableId]: version }));
  } catch (error) {
    // 사생활 모드 등
  }
  setActiveTableUi(tableId, version);
  trackEvent(EVENTS.UI_SWITCH, tableId);
  trackClarityEvent(version === "B" ? CLARITY_EVENTS.UI_SWITCH_B : CLARITY_EVENTS.UI_SWITCH_A);
};
