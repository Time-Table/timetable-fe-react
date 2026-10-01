import { sendEvent, sendEventKeepalive } from "../api/event";
import { sendBlogView } from "../api/blogView";
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

  // 퍼널 단계가 아니라 테이블 A/B(2026-09-29)의 화면 전환 기록이다.
  UI_SWITCH: "ui_switch",

  // 표 화면 A/B 2회차(2026-10-01, 하네스 specs/table-ab-2.md). 퍼널 단계가 아니다.
  UI_VIEW: "ui_view", // 화면이 그려짐(마감 때 유지한 화면 = 마감 전 마지막 ui_view)
  AB_STATE_FAIL: "ab_state_fail", // 실험 상태를 못 받아 꺼짐으로 그림
  JOIN_FAIL: "join_fail",
  SAVE_FAIL: "save_fail",
  UI_LOAD_FAIL: "ui_load_fail", // 새 화면 조각을 못 받음
};

/**
 * 테이블 A/B(2026-09-29): 지금 열린 표와 그 표에서 보고 있는 화면(A/B).
 * 표 화면이 실험이 켜져 있을 때 표 정보를 받은 뒤 정하고, 떠날 때 비운다(utils/tableExperiment.js).
 * 그 표의 아래 이벤트에만 uiVersion으로 붙는다. table_view는 표 정보를 받기 전에 남기므로 넣지 않는다.
 */
let activeTableUi = null;
const TABLE_UI_EVENTS = [EVENTS.INVITE_SHARE, EVENTS.JOIN_SUBMIT, EVENTS.JOIN_SUCCESS,
  EVENTS.SCHEDULE_SAVE, EVENTS.RANKING_OPEN, EVENTS.UI_SWITCH,
  EVENTS.UI_VIEW, EVENTS.JOIN_FAIL, EVENTS.SAVE_FAIL, EVENTS.UI_LOAD_FAIL];
// 2회차 기록: 정해진 필드만 보내고 자유 문자열(source)은 넣지 않는다. 탭 ID·순번으로 같은 탭 안 순서를 맞춘다.
const AB_EVENTS = [EVENTS.UI_VIEW, EVENTS.UI_SWITCH, EVENTS.AB_STATE_FAIL,
  EVENTS.JOIN_FAIL, EVENTS.SAVE_FAIL, EVENTS.UI_LOAD_FAIL];
const AB_FIELDS = ["viewId", "reason", "joinType"];
const TAB_KEY = "tt_tab_id";
const SEQ_KEY = "tt_tab_seq";

export const setActiveTableUi = (tableId, version) => {
  activeTableUi = tableId && (version === "A" || version === "B") ? { tableId, version } : null;
};

/** 지금 열린 표와 화면(실험 중일 때만). */
export const getActiveTableUi = () => activeTableUi;

const uiVersionFor = (name, tableId) =>
  TABLE_UI_EVENTS.includes(name) && activeTableUi && activeTableUi.tableId === tableId
    ? activeTableUi.version : undefined;

export const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

let memoryTab = null;
let memorySeq = 0;
/** 이 탭의 ID와 다음 순번. 새로고침해도 같은 탭이면 이어 센다(sessionStorage). 못 쓰면 메모리. */
const nextTabSeq = () => {
  try {
    let tab = sessionStorage.getItem(TAB_KEY);
    if (!tab) {
      tab = createId();
      sessionStorage.setItem(TAB_KEY, tab);
    }
    const seq = (Number(sessionStorage.getItem(SEQ_KEY)) || 0) + 1;
    sessionStorage.setItem(SEQ_KEY, String(seq));
    return { tabId: tab, seq };
  } catch {
    if (!memoryTab) memoryTab = createId();
    memorySeq += 1;
    return { tabId: memoryTab, seq: memorySeq };
  }
};

/** 2회차 기록에 붙일 정해진 필드(값이 있는 것만) + 탭 ID·순번. */
const abFieldsOf = (extra) => {
  const fields = {};
  for (const key of AB_FIELDS) if (extra?.[key] !== undefined && extra?.[key] !== null) fields[key] = extra[key];
  return { ...fields, ...nextTabSeq() };
};

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
/** 보낼 본문. 2회차 기록은 정해진 필드만, 그 밖의 이벤트는 원래대로(source 포함). */
const payloadOf = (name, tableId, creationPath, extra) => {
  const ab = AB_EVENTS.includes(name);
  // 새 화면 불러오기 실패는 아직 그 화면이 안 그려졌을 수 있어 화면 값을 직접 받는다.
  const uiVersion = ab && (extra?.uiVersion === "A" || extra?.uiVersion === "B") ? extra.uiVersion : uiVersionFor(name, tableId);
  return {
    name,
    visitorId: getVisitorId(),
    tableId,
    ...(ab ? {} : { source: getSource() }),
    device: getDevice(),
    // 생성 경로. 서버가 랜딩 생성과 빠른 생성을 나눠 세도록 함께 보낸다(2026-09-29 랜딩 A/B).
    ...(creationPath === "landing" || creationPath === "quick_create" ? { creationPath } : {}),
    // 테이블 A/B에서 이 이벤트 때 보고 있던 화면. 실험이 꺼져 있거나 다른 표면 붙지 않는다.
    ...(uiVersion ? { uiVersion } : {}),
    ...(ab ? abFieldsOf(extra) : {}),
    // 표 화면 A/B 2회차: 새 참여(201)와 다시 들어옴(200)을 나눈다.
    ...(name === EVENTS.JOIN_SUCCESS && ["new", "returning"].includes(extra?.joinType) ? { joinType: extra.joinType } : {}),
  };
};

/**
 * 페이지가 사라지는 중(새로고침 직전)에 보내는 2회차 기록(ui_load_fail chunk_retry).
 * 미리 묻기 없는 요청이라 관리자 헤더를 못 실으므로 관리자 판단은 여기서 한다.
 */
export const trackEventKeepalive = (name, tableId, extra) => {
  try {
    if (isAdmin()) return;
    const payload = payloadOf(name, tableId, undefined, extra);
    if (!payload.uiVersion) return;
    sendEventKeepalive(payload);
  } catch (error) {
    // 넘어간다
  }
};

export const trackEvent = (name, tableId, creationPath, extra) => {
  let pending;
  // 저장소 차단·수집 장애가 생성 요청이나 성공 화면을 막으면 안 된다.
  try {
    if (isAdmin()) return;
    const payload = payloadOf(name, tableId, creationPath, extra);
    // 2회차 기록은 실험이 켜져 화면이 정해진 표에서만 보낸다(상태를 못 받은 기록만 예외).
    if (AB_EVENTS.includes(name) && name !== EVENTS.AB_STATE_FAIL && !payload.uiVersion) return;
    pending = sendEvent(payload);
  } catch (error) {
    return;
  }

  if ([EVENTS.CREATE_SUCCESS, EVENTS.TABLE_VIEW, EVENTS.JOIN_SUCCESS, EVENTS.SCHEDULE_SAVE].includes(name)) {
    // 역할은 현재 URL이나 마지막으로 만든 표가 아니라, 요청한 표의 서버 응답에 묶는다.
    // 태그는 행동별로 구분한다. Clarity 세션에는 여러 표의 역할이 공존할 수 있다.
    Promise.resolve(pending).then((result) => {
      if (!result?.success || result.skipped || isAdmin() || typeof window.clarity !== "function") return;
      const role = ["creator", "participant", "unknown"].includes(result.tableRole)
        ? result.tableRole : "unknown";
      window.clarity("set", `tt_${name}_role`, role);
    }).catch(() => {
      // 계측 응답·저장소·Clarity 오류를 사용자 동작에 전파하지 않는다.
    });
  }

  // 기존 버튼 텍스트 기반 스마트 이벤트와 구분한다. 식별자/입력값은 보내지 않는다.
  // 참여 시도·골든타임 확인은 2026-09-29에 더했다. 서버 퍼널에는 기기 구분이 없어 모바일 비율을 Clarity에서 본다.
  if (![EVENTS.LANDING_VIEW, EVENTS.CREATE_VIEW, EVENTS.CREATE_CTA_CLICK,
    EVENTS.CREATE_SUBMIT, EVENTS.CREATE_SUCCESS, EVENTS.TABLE_VIEW,
    EVENTS.JOIN_SUBMIT, EVENTS.JOIN_SUCCESS, EVENTS.SCHEDULE_SAVE,
    EVENTS.RANKING_OPEN].includes(name)) return;
  try {
    if (typeof window.clarity !== "function") return;
    window.clarity("event", `tt_${name}`);
    if (creationPath === "landing" || creationPath === "quick_create") {
      window.clarity("event", `tt_${name}_${creationPath}`);
    }
  } catch (error) {
    // Clarity 차단·오류는 자체 계측과 서비스 동작에 영향을 주지 않는다.
  }
};

/**
 * Clarity에만 남기는 보조 이벤트. 자체 API(서버 이벤트 목록 EVENTS)로는 보내지 않는다.
 * 서버 퍼널은 합계만 보면 되고, 세부 구분(예: 휴대폰 공유 창 vs 링크 복사)은 Clarity에서 본다.
 * 이름은 `tt_`로 시작해야 한다. 관리자는 제외하고, Clarity 부재·차단·예외는 흐름을 막지 않는다.
 * 표 ID·방문자 ID·입력값은 보내지 않는다.
 */
export const CLARITY_EVENTS = {
  INVITE_SHARE_NATIVE: "tt_invite_share_native",
  INVITE_SHARE_COPY: "tt_invite_share_copy",

  // 표 화면(/table)에서 기록이 없던 곳(2026-09-29, 0회차 지표 조사 뒤). 동작 한 번에 1회씩이고 조건은 계약서 "표 화면 Clarity 보조 계측"에 있다.
  INVITE_SHARE_TABLE: "tt_invite_share_table", // 표 화면 초대 링크 "복사하기" 누름(클립보드 호출 전, 랜딩 완료 창 복사와 구분)
  // 이용 가이드(tt_guide_show·next·done·never)는 2026-09-30 사람 지시로 온보딩을 지우며 뺐다.
  TIMETABLE_OPEN: "tt_timetable_open", // 휴대폰 전체 시간표 모달이 닫힘에서 열림으로 바뀜(버튼·참여자 칩·순위 이름 모두)
  TIMETABLE_CELL: "tt_timetable_cell", // 전체 시간표 칸을 눌러 명단 팝업 열기
  TIMETABLE_CELL_EMPTY: "tt_timetable_cell_empty", // 가능한 사람이 없는 칸을 누름(팝업이 뜨지 않는다)
  TIMETABLE_MEMBER_FILTER: "tt_timetable_member_filter", // 참여자 드롭다운에서 한 사람 고르기
  RANKING_EXPAND: "tt_ranking_expand", // 골든타임 순위 항목 펼치기
  RANKING_MEMBER_VIEW: "tt_ranking_member_view", // 순위 항목 안 이름 → 그 사람 시간표
  MEMBERS_OPEN: "tt_members_open", // 단계 막대 "인원"
  MEMBER_VIEW: "tt_member_view", // 인원 화면 참여자 칩 → 그 사람 시간표
  CHAT_SEND: "tt_chat_send", // 채팅 보내기 성공
  SCHEDULE_SELECT: "tt_schedule_select", // 내 일정에서 시간을 처음 더함(화면을 열 때마다 1회, 해제만 한 것은 제외)
  SCHEDULE_SAVE_CLICK: "tt_schedule_save_click", // 켜진 저장 버튼 누름(서버 결과와 무관, 성공은 tt_schedule_save)
  TIPS_OPEN: "tt_tips_open", // "모임 시간 조율을 위한 팁" 펼치기
  TIPS_CLOSE: "tt_tips_close", // 같은 팁 접기

  // 랜딩(`/`, v1·v2 공통, 2026-09-29 A/B 1회차). 노출은 `/`를 열 때마다, 나머지는 화면을 한 번 열 때 처음 1회다.
  LANDING_VIEW_V1: "tt_landing_view_v1", // A/B 배정 v1(지금 랜딩)을 봄
  LANDING_VIEW_V2: "tt_landing_view_v2", // A/B 배정 v2(스크롤 이야기)를 봄
  LANDING_FORM_VIEW: "tt_landing_form_view", // 모임 입력 상자가 절반 이상 화면에 들어옴
  LANDING_FORM_START: "tt_landing_form_start", // 모임 이름·후보 날짜·시간 범위 중 하나를 처음 바꿈
  LANDING_PRESET: "tt_landing_preset", // 추천 모임 이름 칩을 처음 누름
  LANDING_PREVIEW_OPEN: "tt_landing_preview_open", // 미리보기 칸을 직접 눌러 명단을 처음 엶(자동으로 열린 것은 빼고)

  // 테이블 A/B(2026-09-29). 서버 ui_switch와 같은 순간에 방향을 나눠 남긴다(서버 이름은 Clarity로 넘기지 않는다).
  UI_SWITCH_B: "tt_ui_switch_b", // 맨 위 띠로 새 화면(B)으로 바꿈
  UI_SWITCH_A: "tt_ui_switch_a", // 맨 위 띠로 기존 화면(A)으로 바꿈

  // 새 화면(B)에만 있는 동작(2026-10-01, B를 실제 앱에 넣으며). A와 같은 동작은 위의 같은 이름을 쓴다
  // (명단 창 tt_timetable_cell, 대화 보내기 tt_chat_send, 처음 더함 tt_schedule_select, 저장 누름 tt_schedule_save_click,
  //  공유 tt_invite_share_table). 조건은 계약서 "새 화면(B) 계측".
  B_EDIT_START: "tt_b_edit_start", // "내 시간 넣기/고치기"로 입력 모드를 엶(참여자, 직접 누른 것만)
  B_EDIT_CANCEL: "tt_b_edit_cancel", // 저장하지 않고 입력 모드를 끝냄(취소·나가기)
  B_SAVE_NOCHANGE: "tt_b_save_nochange", // 바뀐 시간 없이 저장을 누름(B 저장 단추는 늘 켜져 있다)
  B_JOIN_OPEN: "tt_b_join_open", // 참여 창이 열림(참여 전 "내 시간 넣기"·대화 "참여하기"·로그아웃 뒤)
  B_PICK: "tt_b_pick", // 참여자 칩으로 사람을 더함(빼기·"전체"는 남기지 않음)
  B_COMMON_JUMP: "tt_b_common_jump", // 여러 명이 "모두 되는 시간"을 눌러 그 칸으로 감
  B_WEEK_NAV: "tt_b_week_nav", // 주 넘기기(‹ ›)
  B_RANK_JUMP: "tt_b_rank_jump", // 순위 창의 줄을 눌러 시간표 칸으로 감
  B_RANK_MORE: "tt_b_rank_more", // 순위 창 "더 보기"
  B_CHAT_OPEN: "tt_b_chat_open", // 아래 막대 "대화"로 대화 창을 엶
  B_HELP_OPEN: "tt_b_help_open", // 헤더 "?"로 사용법 창을 엶
  B_MORE_OPEN: "tt_b_more_open", // 입력 중 "더보기"(로그아웃·참여 취소)를 엶
  B_LOGOUT: "tt_b_logout", // 더보기에서 로그아웃(이 기기의 이름만 지움)
  B_DAY_TOGGLE: "tt_b_day_toggle", // 입력 중 요일 글자로 하루 전체 칠하기·지우기
  B_HOUR_TOGGLE: "tt_b_hour_toggle", // 입력 중 시간 글자로 그 시간 줄 칠하기·지우기
  B_SAVE_PROMPT: "tt_b_save_prompt", // 표에서 처음 시간을 넣은 사람에게 공유 권유 창이 뜸
  B_PROMPT_SHARE: "tt_b_prompt_share", // 그 창에서 "공유하기"를 누름
};

export const trackClarityEvent = (name) => {
  try {
    if (!Object.values(CLARITY_EVENTS).includes(name)) return;
    if (isAdmin() || typeof window.clarity !== "function") return;
    window.clarity("event", name);
  } catch (error) {
    // Clarity 차단·저장소 오류는 서비스 동작에 영향을 주지 않는다.
  }
};

/**
 * 블로그 글 조회를 기록한다. 퍼널 이벤트가 아니라 별도 컬렉션(BlogView)에 쌓인다.
 * 관리자 브라우저는 제외한다.
 *
 * getSource()를 여기서 불러 블로그로 처음 들어온 사람의 출처(구글·네이버 등)를 first-touch로
 * 저장한다. 앱 안 <Link> 이동은 document.referrer를 바꾸지 않아 대부분 랜딩에서도 같은 출처가
 * 잡히지만, 새 탭이나 전체 로드로 서비스에 들어오면 referrer가 사이트 내부가 되어 "direct"로
 * 남는다. 블로그에서 먼저 저장해 두면 그 경우에도 출처가 보존된다.
 */
export const trackBlogView = (slug) => {
  // localStorage 접근이 막힌 브라우저(사생활 모드·정책)에서는 isAdmin·getVisitorId가 예외를 던진다.
  // 계측 실패가 글 읽기를 깨뜨리면 안 되므로 전부 삼킨다.
  try {
    if (isAdmin()) return;
    sendBlogView({
      slug,
      visitorId: getVisitorId(),
      source: getSource(),
      device: getDevice(),
    });
  } catch (error) {
    // 조용히 넘어간다.
  }
};
