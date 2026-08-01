import { formatDayLabel } from "./presets";

/**
 * /start 미리보기에 채워 넣을 가짜 참여자와 일정.
 *
 * 기존 미리보기는 빈 격자였다. 실제 `/table` 화면은 참여자가 각자 시간을 칠해 넣은
 * 히트맵인데, 빈 격자만 보면 "무엇이 만들어지는지"가 전달되지 않는다.
 * 그래서 실제 화면과 같은 구성을 가짜 데이터로 재현한다.
 *
 * 값은 난수가 아니라 문자열 해시로 만든다. 리렌더마다 격자가 바뀌면
 * 미리보기가 아니라 소음이 되기 때문이다. 같은 날짜·시간이면 언제나 같은 그림이 나온다.
 */

export const MOCK_MEMBERS = ["지현", "민준", "서연", "도윤", "하은", "준호"];

/** 미리보기용 가짜 테이블 주소. 실제로 존재하는 id가 아니다. */
export const MOCK_TABLE_ID = "a1b2c3d4";

/** 순위 목록에 보여줄 개수. 좁은 미리보기 폭에서 3개를 넘으면 읽히지 않는다. */
const RANKING_LIMIT = 3;

/** FNV-1a. 암호용이 아니라 "같은 입력이면 같은 그림"만 보장하면 된다. */
const hash = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const pick = (seed, max) => hash(seed) % max;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const pad = (n) => String(n).padStart(2, "0");

/**
 * 선택된 날짜/시간 범위에 맞춰 가짜 참여 현황을 만든다.
 *
 * @param {{key: string, date: Date}[]} days 선택된 날짜
 * @param {string} startHour "10:00"
 * @param {string} endHour   "20:00"
 * @returns {null | {
 *   hours: number[],
 *   cells: Record<string, string[]>,
 *   maxCount: number,
 *   total: number,
 *   ranking: Block[],
 *   golden: null | Block,
 * }}
 */
export function buildMockTimetable(days, startHour, endHour) {
  const from = parseInt(startHour, 10);
  const to = parseInt(endHour, 10);
  if (!days.length || !Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;

  const hours = Array.from({ length: to - from }, (_, i) => from + i);
  const cells = {};

  // 사람이 몰리는 지점. 범위 앞쪽 45% 언저리에 두면 저녁 모임이든 낮 회의든 자연스럽다.
  const anchor = Math.floor(hours.length * 0.45);

  // 하루는 "다들 되는 날"로 만든다. 그래야 골든타임이 또렷하게 하나 잡힌다.
  const heroIndex = days.length > 1 ? pick(days.map((d) => d.key).join(), days.length) : 0;

  days.forEach((day, dayIndex) => {
    const isHero = dayIndex === heroIndex;
    // 날마다 몰리는 시간을 조금씩 흔들어 같은 그림이 반복되지 않게 한다.
    const dayShift = isHero ? 0 : pick(`${day.key}|shift`, 5) - 2;

    MOCK_MEMBERS.forEach((member) => {
      const seed = `${day.key}|${member}`;
      // 그날 아예 안 되는 사람. 다 되는 그림은 오히려 가짜처럼 보인다.
      if (!isHero && pick(`${seed}|skip`, 100) < 22) return;

      const spread = isHero ? 3 : 5;
      const offset = pick(`${seed}|offset`, spread) - Math.floor(spread / 2);
      const start = clamp(anchor + dayShift + offset, 0, Math.max(hours.length - 2, 0));
      const span = (isHero ? 3 : 2) + pick(`${seed}|span`, 4);
      const end = Math.min(start + span, hours.length);

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
