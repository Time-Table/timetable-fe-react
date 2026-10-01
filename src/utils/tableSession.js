/**
 * 표 화면 A/B 공유 상태(2026-09-30 사람 지시).
 * "기존 화면, 새화면으로 변경할 때, 닉네임, 드래그한 시간, 저장된 시간, 상태 다 똑같아야해.
 *  특히 드래그하다가 새 화면 옮기면 같은 드래그가 그어져 있어야해."
 *
 * 같은 브라우저 탭(sessionStorage)에 표마다 하나를 둔다. 기존 화면(A)과 새 화면(B)이 같은 규칙으로 읽고 쓴다.
 * 명세: 하네스 specs/api-contract.md "테이블 A/B 공유 상태".
 *
 *   { v: 1, name, editing, draft, weekKey, picks }
 *   - name: 이 상태를 남긴 참여 이름. 지금 로그인한 이름과 다르면 editing·draft는 쓰지 않는다.
 *   - editing: 내 시간을 고치는 화면이었는가(A "내 일정", B 입력 모드).
 *   - draft: null이면 저장한 시간과 같다(바뀐 것 없음). 배열이면 저장하지 않은 선택 전체이고 []는 "전부 지움"이다.
 *   - weekKey: 보고 있던 주의 월요일(YYYY-MM-DD).
 *   - picks: 골라 보던 사람들. A는 한 명씩 고르지만 두 명 이상을 받으면 그대로 보여 준다(모두 되는 칸이 가장 진하다).
 * 닉네임은 이미 두 화면이 같은 localStorage(name, tableId)를 쓴다. 저장한 시간은 서버에서 읽는다.
 */
import { CHAT_SEEN_KEY } from "./storage";

export const TABLE_STATE_PREFIX = "tt_table_state:";

const CELL_RE = /^\d{4}-\d{2}-\d{2}-\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const emptyState = () => ({ v: 1, name: null, editing: false, draft: null, weekKey: null, picks: [] });

const uniqueStrings = (list, test) => [...new Set(list.filter((item) => typeof item === "string" && item && (!test || test(item))))];

/** 읽기. 없거나 깨졌거나 버전이 다르면 빈 상태를 준다(예외를 던지지 않는다). */
export const readTableState = (tableId) => {
  if (!tableId) return emptyState();
  try {
    const raw = sessionStorage.getItem(TABLE_STATE_PREFIX + tableId);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || parsed.v !== 1) return emptyState();
    return {
      v: 1,
      name: typeof parsed.name === "string" && parsed.name ? parsed.name : null,
      editing: parsed.editing === true,
      draft: Array.isArray(parsed.draft) ? uniqueStrings(parsed.draft, (cell) => CELL_RE.test(cell)) : null,
      weekKey: typeof parsed.weekKey === "string" && DATE_RE.test(parsed.weekKey) ? parsed.weekKey : null,
      picks: Array.isArray(parsed.picks) ? uniqueStrings(parsed.picks) : [],
    };
  } catch (error) {
    return emptyState();
  }
};

/** 일부만 바꿔 쓴다. 저장소가 막혀 있으면 조용히 넘어간다(이번 화면에서만 유지). */
export const writeTableState = (tableId, patch) => {
  if (!tableId) return;
  try {
    const next = { ...readTableState(tableId), ...patch, v: 1 };
    sessionStorage.setItem(TABLE_STATE_PREFIX + tableId, JSON.stringify(next));
  } catch (error) {
    // 사생활 모드·저장소 가득 참
  }
};

/** 저장·취소 뒤: 저장 안 한 선택을 비운다. */
export const clearTableDraft = (tableId) => writeTableState(tableId, { draft: null });

/** 참여 취소 뒤: 이 표의 공유 상태를 모두 지운다. */
export const clearTableState = (tableId) => {
  if (!tableId) return;
  try {
    sessionStorage.removeItem(TABLE_STATE_PREFIX + tableId);
  } catch (error) {
    // 넘어간다
  }
};

// "10:30"·"10" → 분. 시각 모양이 아니면(빈 값 포함) NaN이라 칸을 만들지 않는다.
const minutesOf = (value) => {
  const match = /^\s*(\d{1,2})(?::(\d{1,2}))?/.exec(String(value ?? ""));
  return match ? Number(match[1]) * 60 + Number(match[2] || 0) : NaN;
};

/**
 * 표의 30분 칸 시각. 시작·끝을 분까지 보고 그 사이만 칸으로 만든다(끝은 24시까지).
 * 10:30~15:30 표는 10:30부터 15:00 칸까지다. 30분 단위가 아닌 값은 시작은 내리고 끝은 올려 30분 칸에 맞춘다.
 * 전에는 "시"만 읽어 10:30 표가 10:00부터 그려지고 15:00~15:30 칸이 빠졌다(2026-10-01 사람 지시로 고침).
 * 기존 화면(TimeGrid)·새 화면(bModel.timesOf)·칸 계산(validCellsOf)이 모두 이 함수를 쓴다.
 */
export const slotTimesOf = (startHour, endHour) => {
  const start = Math.floor(minutesOf(startHour) / 30) * 30;
  const end = Math.min(Math.ceil(minutesOf(endHour) / 30) * 30, 24 * 60);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return [];
  const times = [];
  for (let minute = start; minute < end; minute += 30) {
    times.push(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
  }
  return times;
};

/** 표의 칸 목록(날짜 × slotTimesOf 시각, 막힌 칸 제외). */
export const validCellsOf = ({ dates = [], startHour = "00:00", endHour = "00:00", banedCells = [] }) => {
  const cells = new Set();
  const times = slotTimesOf(startHour, endHour);
  const banned = new Set(banedCells || []);
  (dates || []).forEach((date) => {
    times.forEach((time) => {
      const cell = `${date}-${time}`;
      if (!banned.has(cell)) cells.add(cell);
    });
  });
  return cells;
};

/**
 * 참여자 목록으로 칸마다 되는 사람을 센다. 새 화면(시안 shared.js recompute)과 같은 규칙이다.
 * validCells(표 날짜 × 표 시간, 막은 칸 제외)를 주면 그 밖의 칸은 뺀다. 한 사람의 같은 시간은 한 번만 센다.
 * 결과 [{ time, count, members, _id }]의 members는 목록 순서다.
 * 전에는 기존 화면이 서버 집계(GET /api/schedules)를 그대로 써서, 집계가 목록과 어긋나면 두 화면이 달랐다
 * (Codex 재검증, 2026-09-30).
 */
export const timeInfoOf = (users = [], validCells) => {
  const byCell = new Map();
  (users || []).forEach((user) => {
    new Set(Array.isArray(user?.availableTimes) ? user.availableTimes : []).forEach((time) => {
      if (validCells && !validCells.has(time)) return;
      if (!byCell.has(time)) byCell.set(time, []);
      byCell.get(time).push(user.name);
    });
  });
  return [...byCell].map(([time, members]) => ({ time, count: members.length, members, _id: time }));
};

const sameCells = (a, b) => a.length === b.length && a.every((cell) => b.includes(cell));

/**
 * 지금 이름으로 보여 줄 저장 안 한 선택. 이름이 다르거나 없으면 null.
 * 표에 없는 칸은 빼고, 저장한 시간과 같아지면 null(바뀐 것 없음)로 본다.
 */
export const draftFor = (state, name, validCells, savedCells = []) => {
  if (!name || !state || state.name !== name || !Array.isArray(state.draft)) return null;
  const draft = validCells ? state.draft.filter((cell) => validCells.has(cell)) : state.draft;
  return sameCells(draft, savedCells) ? null : draft;
};

/**
 * 대화 읽음(2026-09-30 사람 지시로 새 화면에 안 읽은 수를 넣으며 추가). localStorage CHAT_SEEN_KEY 한 칸에
 * { 표 ID: 마지막으로 본 대화 시각(ISO) }을 표 50개까지 둔다. 새 화면(시안 shared.js)은 이 시각 뒤에 다른 사람이
 * 쓴 글을 "안 읽음"으로 센다. 기존 화면은 대화를 보여 줄 때 여기에 남겨, 기존 화면에서 읽은 글이 새 화면에서
 * 안 읽음으로 남지 않게 한다.
 */
const CHAT_SEEN_MAX = 50;
const readChatSeenMap = () => {
  try {
    const map = JSON.parse(localStorage.getItem(CHAT_SEEN_KEY) || "{}");
    return map && typeof map === "object" && !Array.isArray(map) ? map : {};
  } catch (error) {
    return {};
  }
};

/** 이 표에서 마지막으로 본 대화 시각(밀리초). 본 적 없으면 null. */
export const chatSeenAt = (tableId) => {
  const time = Date.parse(readChatSeenMap()[tableId] || "");
  return Number.isFinite(time) ? time : null;
};

/** 지금 보여 준 대화를 모두 읽은 것으로 남긴다(가장 늦은 글 시각, 뒤로 가지 않는다). */
export const markChatsSeen = (tableId, chats) => {
  if (!tableId || !Array.isArray(chats)) return;
  const latest = chats.reduce((max, chat) => {
    const time = Date.parse(chat?.timestamp);
    return Number.isFinite(time) && time > max ? time : max;
  }, 0);
  if (!latest) return;
  const seen = chatSeenAt(tableId);
  if (seen !== null && seen >= latest) return;
  try {
    const map = { ...readChatSeenMap(), [tableId]: new Date(latest).toISOString() };
    const kept = Object.entries(map)
      .sort((a, b) => (Date.parse(b[1]) || 0) - (Date.parse(a[1]) || 0))
      .slice(0, CHAT_SEEN_MAX);
    localStorage.setItem(CHAT_SEEN_KEY, JSON.stringify(Object.fromEntries(kept)));
  } catch (error) {
    // 저장소가 막혀 있으면 넘어간다(안 읽은 수만 덜 정확해진다)
  }
};

/** 고른 사람들 이름 표시. 새 화면과 같다(세 명까지 "민준·서연", 넘으면 "민준 외 3명"). */
export const pickLabel = (picks = []) =>
  picks.length <= 3 ? picks.join("·") : `${picks[0]} 외 ${picks.length - 1}명`;

/** 월요일 시작 주 목록의 각 주 월요일(YYYY-MM-DD). TimeGrid·새 화면과 같은 계산이다. */
export const weekKeysOf = (dates = []) => {
  const keys = new Set();
  (dates || []).forEach((date) => {
    const current = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(current.getTime())) return;
    current.setUTCDate(current.getUTCDate() - ((current.getUTCDay() + 6) % 7));
    keys.add(current.toISOString().split("T")[0]);
  });
  return [...keys].sort();
};
