/**
 * 새 화면(표 화면 B) 계산 모음. 화면과 떼어 두어 따로 시험한다.
 * 확정 시안(하네스 output/table-ab-sian/full의 shared.js·kit.js·wx.js, 2026-10-01 사람 확정)의 계산을 그대로 옮겼다.
 * 칸마다 되는 사람은 기존 화면과 같은 함수(utils/tableSession.js timeInfoOf)로 센다(두 화면이 같은 칸·명단·순위).
 */
import { slotTimesOf, timeInfoOf, validCellsOf } from "../../../utils/tableSession";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const DAY_SHORT = ["월", "화", "수", "목", "금", "토", "일"];

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOf = (date) => new Date(`${date}T00:00:00`).getDay();

export const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const endOf = (t) => fromMin(toMin(t) + 30);

/** 표 날짜(정렬). */
export const datesOf = (table) => (table?.dates || []).slice().sort();

/** 30분 칸 시각. 기존 화면(TimeGrid)과 같은 slotTimesOf: 시작·끝을 분까지 보고 끝은 24시까지. */
export const timesOf = (table) => (table ? slotTimesOf(table.startHour, table.endHour) : []);

/** 칸 → { count, members }. 표 칸(범위 안, 막은 칸 밖)만 보고 한 사람의 같은 시간은 한 번만 센다. */
export const infoOf = (users, table) => {
  const valid = validCellsOf({
    dates: table?.dates,
    startHour: table?.startHour,
    endHour: table?.endHour,
    banedCells: table?.banedCells,
  });
  return new Map(timeInfoOf(users, valid).map(({ time, count, members }) => [time, { count, members }]));
};

/** 가장 많은 인원(1 이상). 칸 채움 진하기의 기준이다. */
export const maxOf = (info) => Math.max(1, ...[...info.values()].map((v) => v.count));

/**
 * 월요일부터 일요일까지 한 주를 통째로 그린다. 후보 밖 날은 열을 지우지 않고 흐리게 남긴다(랜딩·기존 화면과 같다).
 * [{ key: "YYYY-MM-DD", on, dnum }] × 7 의 목록.
 */
export const calWeeks = (dates) => {
  if (!dates.length) return [];
  const on = new Set(dates);
  const start = new Date(`${dates[0]}T00:00:00`);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(`${dates[dates.length - 1]}T00:00:00`);
  const out = [];
  for (const m = new Date(start); m <= end; m.setDate(m.getDate() + 7)) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(m);
      d.setDate(m.getDate() + i);
      week.push({ key: ymd(d), on: on.has(ymd(d)), dnum: d.getDate() });
    }
    if (week.some((x) => x.on)) out.push(week);
  }
  return out;
};
export const weekOf = (weeks, date) => weeks.findIndex((w) => w.some((d) => d.key === date));

/** 같은 사람들이 이어서 되는 칸을 한 덩어리로 묶어 많이 되는 순으로 준다(골든타임). */
export const blocksOf = ({ dates, times, locked, info }) => {
  const out = [];
  for (const date of dates) {
    let run = null;
    for (const t of times) {
      const inf = locked.has(`${date}-${t}`) ? null : info.get(`${date}-${t}`);
      const sig = inf ? inf.members.slice().sort().join("|") : "";
      if (inf && run && run.sig === sig) {
        run.len += 1;
      } else {
        if (run) out.push(run);
        run = inf ? { date, start: t, len: 1, sig, members: inf.members.slice(), count: inf.count } : null;
      }
    }
    if (run) out.push(run);
  }
  return out.sort((a, b) => b.count - a.count || b.len - a.len || `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
};

/** 순위. 인원이 같으면 같은 순위다(기존 화면 RankingList와 같다). */
export const rankBlocks = (blocks) => {
  let rank = 0;
  let prev = -1;
  return blocks.map((b) => {
    if (b.count !== prev) rank += 1;
    prev = b.count;
    return { b, rank };
  });
};

/** 고른 사람들이 모두 되는 구간(같은 날 이어지는 30분 칸). 긴 순. */
export const commonBlocksOf = (picks, { dates, times, locked, info }) => {
  const out = [];
  for (const date of dates) {
    let run = null;
    for (const t of times) {
      const key = `${date}-${t}`;
      const members = locked.has(key) ? [] : info.get(key)?.members || [];
      if (picks.every((p) => members.includes(p))) {
        if (run) run.len += 1;
        else run = { date, start: t, len: 1 };
      } else {
        if (run) out.push(run);
        run = null;
      }
    }
    if (run) out.push(run);
  }
  return out.sort((a, b) => b.len - a.len || `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
};

export const isGolden = (count, max) => max >= 2 && count === max;
/** 가장 많이 모이는 덩어리의 첫 칸. 2명 이상이 모일 때만. */
export const goldenKeyOf = (blocks, max) => {
  const b = blocks[0];
  return b && isGolden(b.count, max) ? `${b.date}-${b.start}` : null;
};
/** 참여자가 모두 되는 덩어리인가(2명 이상일 때만). */
export const allFree = (b, total) => !!b && total >= 2 && b.count === total;
/** 처음 볼 주: 1위가 있는 주(랜딩 미리보기와 같다). */
export const firstWeekOf = (blocks, weeks) => {
  const b = blocks[0];
  return Math.max(0, b ? weekOf(weeks, b.date) : 0);
};

export const dayMax = (date, { times, locked, info }) =>
  Math.max(0, ...times.filter((t) => !locked.has(`${date}-${t}`)).map((t) => info.get(`${date}-${t}`)?.count || 0));
const onDays = (week) => week.filter((d) => d.on).map((d) => d.key);
export const weekMax = (week, grid) => Math.max(0, ...onDays(week).map((d) => dayMax(d, grid)));
export const myInWeek = (week, times, selected) =>
  onDays(week).reduce((n, d) => n + times.filter((t) => selected.has(`${d}-${t}`)).length, 0);

export const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

/** 30분 칸 수 → "1시간 30분". */
export const duration = (n) => {
  const m = n * 30;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return [hh ? `${hh}시간` : "", mm ? `${mm}분` : ""].filter(Boolean).join(" ") || "0분";
};

// ---------- 글 ----------
export const fmtDay = (date) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일 (${WEEKDAYS[dayOf(date)]})`;
export const fmtRange = (b) => `${b.start} ~ ${fromMin(toMin(b.start) + b.len * 30)}`;
const md = (d) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
const dot = (d) => `${Number(d.slice(5, 7))}.${Number(d.slice(8, 10))}`;
const ydot = (d) => `${d.slice(0, 4)}.${dot(d)}`;
export const shortDay = (d) => `${WEEKDAYS[dayOf(d)]} ${md(d)}`;
export const spanOf = (b) => `${b.start}–${fromMin(toMin(b.start) + b.len * 30)}`;
/** 기간 "10.5 – 10.25". 하루면 한 날짜, 해가 바뀌면 연도를 붙인다. */
const rangeLabel = (list) => {
  if (!list.length) return "";
  if (list.length === 1) return dot(list[0]);
  const cross = list[0].slice(0, 4) !== list[list.length - 1].slice(0, 4);
  return cross ? `${ydot(list[0])} – ${ydot(list[list.length - 1])}` : `${dot(list[0])} – ${dot(list[list.length - 1])}`;
};
export const periodOf = (dates) => rangeLabel(dates);
export const weekRangeOf = (week) => rangeLabel(onDays(week));
export const fracOf = (b, total) => (allFree(b, total) ? "모두" : `${b.count}/${total}`);
export const summaryOf = (blocks, total) => {
  const b = blocks[0];
  if (!b) return "아직 아무도 시간을 표시하지 않았어요.";
  return `가장 많이 모이는 시간은 ${fmtDay(b.date)} ${fmtRange(b)}, ${total}명 중 ${b.count}명 가능이에요.`;
};

// ---------- 참여 ----------
// 기존 화면 JoinForm과 같은 규칙(옛 자모까지). 다르면 기존 화면에서 만든 이름으로 못 들어온다.
const NAME_RE = /^[A-Za-z0-9가-힣ㄱ-ㆎ\s]+$/;
export const validateJoin = (name, password) => {
  if (!name || !password) return "이름과 비밀번호를 모두 넣어 주세요.";
  if (!NAME_RE.test(name) || !NAME_RE.test(password)) return "이름과 비밀번호는 한글·영문·숫자·공백만 쓸 수 있어요.";
  return "";
};
/**
 * 참여 이름 정하기. 앞 공백은 기존 화면처럼 빼고, 뒤 공백은 이미 그런 이름이 있으면 살린다.
 * 기존 화면은 뒤 공백을 막지 않아 "민준 " 같은 이름이 있을 수 있다.
 */
export const resolveName = (typed, names) => {
  const raw = String(typed || "").replace(/^\s+/, "");
  if (names.includes(raw)) return raw;
  const trimmed = raw.trim();
  if (names.includes(trimmed)) return trimmed;
  const loose = names.filter((n) => n.trim() === trimmed);
  return loose.length === 1 ? loose[0] : trimmed;
};

// ---------- 대화 ----------
const chatTime = (chat) => {
  const t = Date.parse(chat?.timestamp);
  return Number.isFinite(t) ? t : 0;
};
/** 안 읽은 글: 마지막으로 본 뒤에 다른 사람이 쓴 글. 이 기기에서 본 적 없으면 다른 사람 글 전부. 내 글은 세지 않는다. */
export const unreadOf = (chats, seenAt, me) =>
  chats.filter((c) => c.name !== me && (seenAt === null || chatTime(c) > seenAt)).length;

// ---------- 날짜 투표 표(2026-10-09, 시안 하네스 캔버스 Final1~5·FinalSpec·FinalMonths) ----------
// 시간 없이 날짜만 고르는 표. 칸은 날짜 "YYYY-MM-DD"이고, 달마다 달력 한 장을 그린다.

/** 날짜 → { count, members }. 후보 날짜만 보고 한 사람의 같은 날은 한 번만 센다. */
export const dateInfoOf = (users, table) => {
  const valid = new Set(datesOf(table));
  return new Map(timeInfoOf(users, valid).map(({ time, count, members }) => [time, { count, members }]));
};

/**
 * 달력 목록. 후보가 있는 달마다 한 장, 그 달의 모든 주(월요일 시작)를 넣는다(후보 없는 주도 건너뛰지 않는다).
 * [{ key: "YYYY-MM", label: "2026년 10월", weeks: [[{ key, inMonth, on, dnum, col }] × 7] }]
 */
export const monthsOf = (dates) => {
  const on = new Set(dates);
  const seen = [...new Set(dates.map((d) => d.slice(0, 7)))].sort();
  return seen.map((ym) => {
    const [y, m] = ym.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    const last = new Date(y, m, 0);
    const weeks = [];
    for (const w = new Date(start); w <= last; w.setDate(w.getDate() + 7)) {
      const week = [];
      for (let i = 0; i < 7; i += 1) {
        const d = new Date(w);
        d.setDate(w.getDate() + i);
        const key = ymd(d);
        week.push({ key, inMonth: d.getMonth() === m - 1, on: on.has(key), dnum: d.getDate(), col: i });
      }
      weeks.push(week);
    }
    return { key: ym, label: `${y}년 ${m}월`, weeks };
  });
};

/** 칸 진하기: 그날 되는 사람 ÷ 표 참여자 수(아직 안 넣은 사람도 셈). 아무도 없으면 0(흰 칸). 비율 숫자는 쓰지 않는다. */
export const dayFill = (count, total) => (count > 0 && total > 0 ? 0.12 + 0.88 * Math.min(1, count / total) : 0);

/** 입력 중 안 고른 칸의 바탕: 다른 사람 비율로 옅게. */
export const dayUnder = (others, total) => (others > 0 && total > 0 ? 0.06 + 0.24 * Math.min(1, others / total) : 0);

/** 날짜 순위. 많이 되는 순, 같으면 이른 날. 인원이 같으면 같은 순위. 아무도 없는 날은 뺀다. */
export const rankDays = (info, dates) => {
  const days = dates
    .map((date) => ({ date, count: info.get(date)?.count || 0, members: info.get(date)?.members || [] }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date));
  let rank = 0;
  let prev = -1;
  return days.map((d) => {
    if (d.count !== prev) rank += 1;
    prev = d.count;
    return { d, rank };
  });
};

/** 고른 사람들이 모두 되는 날(이른 순). */
export const commonDaysOf = (picks, info, dates) =>
  dates.filter((date) => {
    const members = info.get(date)?.members || [];
    return picks.length > 0 && picks.every((p) => members.includes(p));
  });

/** 날짜 칸 수 → "3일". */
export const dayCount = (n) => `${n}일`;

/** "금 10/9" */
export const shortDate = (d) => shortDay(d);

/** 1위 날 요약(읽기 프로그램). */
export const daySummaryOf = (ranked, total) => {
  const top = ranked[0]?.d;
  if (!top) return "아직 아무도 날짜를 넣지 않았어요.";
  return `가장 많이 모이는 날은 ${fmtDay(top.date)}, ${total}명 중 ${top.count}명 가능이에요.`;
};
