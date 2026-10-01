import { formatDayLabel } from "./presets";

/**
 * /start 미리보기에 채워 넣을 가짜 참여자와 일정.
 *
 * 기존 미리보기는 빈 격자였다. 실제 `/table` 화면은 참여자가 각자 시간을 칠해 넣은
 * 히트맵인데, 빈 격자만 보면 "무엇이 만들어지는지"가 전달되지 않는다.
 * 그래서 실제 화면과 같은 구성을 가짜 데이터로 재현한다.
 *
 * 값은 난수 없이 규칙으로만 만든다. 리렌더마다 격자가 바뀌면
 * 미리보기가 아니라 소음이 되기 때문이다. 같은 날짜·시간이면 언제나 같은 그림이 나온다.
 */

export const MOCK_MEMBERS = ["지현", "민준", "서연", "도윤", "하은", "준호"];

/** 미리보기용 가짜 테이블 주소. 실제로 존재하는 id가 아니다. */
export const MOCK_TABLE_ID = "a1b2c3d4";

/** 순위 목록에 보여줄 개수. 좁은 미리보기 폭에서 3개를 넘으면 읽히지 않는다. */
const RANKING_LIMIT = 3;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const pad = (n) => String(n).padStart(2, "0");

/**
 * 정돈된 예시 분포. 랜딩(`/`) 미리보기가 쓴다.
 *
 * 이전 분포(사람·날짜마다 시작 시각과 길이를 해시로 흔들고 일부를 통째로 뺌)는 칸이 흩어져 보여
 * 2026-09-27 새 랜딩 채택과 함께 지웠다. 여기서는 두 가지 규칙만 쓴다.
 * - 하루 안: 사람마다 폭이 다른 가용 시간을 같은 중심에 겹친다. 가운데가 가장 진하고 위아래로 옅어진다.
 *   가장 좁은 두 사람은 폭이 같고(= 모두가 되는 핵심 구간), 그다음부터 한 사람마다 한 칸씩 넓힌다.
 * - 날짜 사이: 골든타임 날(고른 날이 가장 많은 주의 금요일, 없으면 그 주의 가운데 날)에서 하루 멀어질 때마다
 *   넓게 되는 사람부터 두 명씩 빠진다. 후보 기간 밖으로 밀려나는 부분은 그대로 잘린다.
 *   끝쪽 날은 아무도 없는 빈 열이 된다. 칸이 다 차 있으면 어디가 겹치는지 오히려 안 보인다.
 * 그래서 골든타임을 꼭짓점으로 한 언덕 하나와 빈칸이 남는다. 기본 시간 범위(10~20시)에서
 * 골든타임은 금요일 14~17시(14·15·16시 칸)다(2026-09-26 사람 지정).
 * @param {{key: string, date: Date}[]} days 선택된 날짜
 * @param {string} startHour "10:00"
 * @param {string} endHour   "20:00"
 * @returns {null | { hours: number[], cells: Record<string, string[]>, maxCount: number, total: number, ranking: Block[], golden: null | Block }}
 */
export function buildTidyMockTimetable(days, startHour, endHour) {
  const from = parseInt(startHour, 10);
  const to = parseInt(endHour, 10);
  if (!days.length || !Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;

  const hours = Array.from({ length: to - from }, (_, i) => from + i);
  const len = hours.length;
  const center = Math.floor(len / 2);
  // 모두가 되는 핵심 구간 폭. 시간 범위 길이에 비례한다(10시간이면 3시간).
  const core = clamp(Math.round(len * 0.3), 1, len);
  const windows = MOCK_MEMBERS.map((_, k) => {
    const width = Math.min(core + Math.max(0, k - 1), len);
    const start = clamp(center - Math.floor(width / 2), 0, len - width);
    return [start, start + width];
  });

  // 골든타임 날은 고른 날이 가장 많은 달력 주(월~일)에 둔다(2026-10-02 사람 지시: 미리보기는 기본으로 그 주를 보여 준다).
  // 그 주에 고른 금요일이 있으면 금요일, 없으면 그 주에서 고른 날의 가운데 날이다. 고른 날 수가 같으면 앞 주다.
  // 화면은 골든타임이 있는 주를 먼저 펼친다. 일요일에 열면 오늘 하루뿐인 이번 주 대신 엿새를 고른 다음 주가 보인다.
  const weekOf = (date) => {
    const monday = new Date(date);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return monday.getTime();
  };
  const perWeek = new Map();
  days.forEach((day, i) => {
    const week = weekOf(day.date);
    if (!perWeek.has(week)) perWeek.set(week, []);
    perWeek.get(week).push(i);
  });
  let focus = [];
  perWeek.forEach((indexes) => {
    if (indexes.length > focus.length) focus = indexes;
  });
  const friday = focus.find((i) => days[i].date.getDay() === 5);
  const hero = friday !== undefined ? friday : focus[Math.floor((focus.length - 1) / 2)];
  const cells = {};
  // 거리는 선택된 날짜의 순서가 아니라 실제 달력 날짜 차이로 센다.
  // 후보에서 뺀 날이 있어도 모양이 달력 위에서 그대로 유지된다.
  const DAY_MS = 24 * 60 * 60 * 1000;
  const heroTime = days[hero].date.getTime();
  days.forEach((day) => {
    const distance = Math.round(Math.abs(day.date.getTime() - heroTime) / DAY_MS);
    const present = Math.max(0, MOCK_MEMBERS.length - 2 * distance);
    MOCK_MEMBERS.slice(0, present).forEach((member, k) => {
      const [start, end] = windows[k];
      for (let i = start; i < end; i += 1) {
        const cellKey = `${day.key}|${hours[i]}`;
        if (!cells[cellKey]) cells[cellKey] = [];
        cells[cellKey].push(member);
      }
    });
  });

  const maxCount = Object.values(cells).reduce((max, members) => Math.max(max, members.length), 0);
  const ranking = buildRanking(days, hours, cells);

  return {
    hours,
    cells,
    maxCount,
    total: MOCK_MEMBERS.length,
    ranking,
    golden: ranking[0] || null,
  };
}

/**
 * 인접한 칸 중 "참여자 명단이 완전히 같은" 것들을 하나의 구간으로 묶는다.
 *
 * 실제 화면의 `RankingList`가 30분 슬롯에 대해 하는 일과 같다. 미리보기는 1시간 단위다.
 * `sigOf`가 `null`을 돌려주면 그 칸은 구간에 넣지 않는다.
 */
function collectBlocks(days, hours, cells, sigOf) {
  const blocks = [];

  days.forEach((day) => {
    let current = null;
    hours.forEach((hour) => {
      const members = cells[`${day.key}|${hour}`] || [];
      const sig = sigOf(members);

      if (!sig) {
        current = null;
        return;
      }
      if (current && current.sig === sig && current.to === hour) {
        current.to = hour + 1;
        return;
      }
      current = {
        id: `${day.key}-${hour}`,
        day,
        from: hour,
        to: hour + 1,
        sig,
        members,
        count: members.length,
      };
      blocks.push(current);
    });
  });

  return blocks.map((b) => ({ ...b, label: formatBlockLabel(b) }));
}

/** "8월 5일 (목) 14:00~17:00" */
function formatBlockLabel({ day, from, to }) {
  return `${day.date.getMonth() + 1}월 ${day.date.getDate()}일 (${formatDayLabel(
    day.date,
  )}) ${pad(from)}:00~${pad(to)}:00`;
}

/**
 * 골든타임 순위. 인원 많은 순 → 오래 이어지는 순 → 이른 시간 순.
 * 동점은 같은 순위를 받는다(`displayRank`).
 */
function buildRanking(days, hours, cells) {
  const blocks = collectBlocks(days, hours, cells, (members) =>
    members.length ? [...members].sort().join("|") : null,
  );

  blocks.sort(
    (a, b) =>
      b.count - a.count ||
      b.to - b.from - (a.to - a.from) ||
      (a.day.key === b.day.key ? a.from - b.from : a.day.key < b.day.key ? -1 : 1),
  );

  let rank = 0;
  let prevCount = -1;
  return blocks.slice(0, RANKING_LIMIT).map((b) => {
    if (b.count !== prevCount) rank += 1;
    prevCount = b.count;
    return { ...b, displayRank: rank };
  });
}

/** 한 사람이 가능한 시간대 구간. 참여자를 골랐을 때의 요약 문장에 쓴다. */
export function buildMemberBlocks(mock, days, name) {
  if (!mock || !name) return [];
  return collectBlocks(days, mock.hours, mock.cells, (members) =>
    members.includes(name) ? name : null,
  );
}
