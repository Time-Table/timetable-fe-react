import { DAYS_PER_WEEK, buildDatesAfter, buildDefaultDates } from "./presets";

afterEach(() => {
  jest.useRealTimers();
});

const at = (iso) => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(iso));
};

test("기본 후보 날짜는 오늘부터 한 주(7일)이고 모두 선택된 상태다", () => {
  at("2026-09-28T16:30:00");
  const dates = buildDefaultDates();
  expect(dates).toHaveLength(DAYS_PER_WEEK);
  expect(dates.map((d) => d.key)).toEqual([
    "2026-09-28",
    "2026-09-29",
    "2026-09-30",
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
    "2026-10-04",
  ]);
  expect(dates.every((d) => d.selected)).toBe(true);
});

test("새벽·아침에 열어도 오늘은 기기 날짜 기준이다", () => {
  at("2026-09-28T07:10:00");
  expect(buildDefaultDates()[0].key).toBe("2026-09-28");
});

test("buildDatesAfter는 기준일 다음 날부터 이어 붙인다", () => {
  at("2026-09-28T16:30:00");
  const dates = buildDefaultDates();
  const next = buildDatesAfter(dates[dates.length - 1].date, DAYS_PER_WEEK);
  expect(next[0].key).toBe("2026-10-05");
  expect(next).toHaveLength(DAYS_PER_WEEK);
});
