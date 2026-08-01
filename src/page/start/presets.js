/**
 * /start 페이지의 초기값.
 *
 * 빈 화면 대신 "그럴듯한 값"을 먼저 보여주고 고치게 하는 것이 이 페이지의 요지다.
 * 값은 화면 로직과 분리해 둔다 — 문구를 바꾸려고 컴포넌트를 열 필요가 없게.
 */

export const HOURS = Array.from({ length: 25 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 키워드는 이름과 시간대만 채운다. **날짜는 건드리지 않는다.**
 * 언제 모일지는 키워드가 알 수 없는 것이고, 고르는 재미도 사용자 몫이다.
 */
export const PRESETS = [
  { key: "team", label: "팀 프로젝트", title: "팀 프로젝트 회의", startHour: "10:00", endHour: "20:00" },
  { key: "dinner", label: "회식 · 모임", title: "이번 달 회식", startHour: "17:00", endHour: "23:00" },
  { key: "study", label: "스터디", title: "주간 스터디", startHour: "09:00", endHour: "22:00" },
  { key: "trip", label: "여행 · 나들이", title: "주말 나들이", startHour: "09:00", endHour: "21:00" },
];

/** 후보 날짜는 주 단위로 늘리고 줄인다. */
export const DAYS_PER_WEEK = 7;
export const MIN_WEEKS = 1;
export const MAX_WEEKS = 8;

/** 서버가 받는 형식은 YYYY-MM-DD 고정이다. 로컬 시간 기준으로 만든다. */
export const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const formatDayLabel = (date) => DAY_NAMES[date.getDay()];

/**
 * `from` 다음 날부터 `count`일치 후보를 만든다. 전부 선택된 상태로 시작한다.
 *
 * 기준일에 i를 더하는 대신 하루씩 누적한다. 날짜 하나가 통째로 사라지는
 * 시간대(예: Pacific/Apia 2011-12-30)에서 같은 키가 두 번 나오는 것을 막는다.
 */
export const buildDatesAfter = (from, count) => {
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, () => {
    cursor.setDate(cursor.getDate() + 1);
    const date = new Date(cursor);
    return { key: formatDateKey(date), date, selected: true };
  });
};

/**
 * 내일부터 한 주치. 오늘을 넣지 않는 이유: 오늘 잡는 약속을 조율할 일은 거의 없다.
 */
export const buildDefaultDates = () => buildDatesAfter(new Date(), DAYS_PER_WEEK);
