import { monthlyCreationSeries } from "./monthlyTrend";

const now = new Date("2026-09-26T15:00:00Z"); // 한국시간 9월 27일
const visits = [
  { date: "2025-03-17", todayTableCreateCount: 2 },
  { date: "2026-07-01", todayTableCreateCount: 3 },
  { date: "2026-07-31", todayTableCreateCount: 2 },
  { date: "2026-09-26", todayTableCreateCount: 4 },
];

test("최근 3·6·12개월은 이번 달을 포함하고 생성 없는 달도 0으로 채운다", () => {
  expect(monthlyCreationSeries(visits, 3, now)).toEqual([
    { month: "2026-07", count: 5 },
    { month: "2026-08", count: 0 },
    { month: "2026-09", count: 4 },
  ]);
  expect(monthlyCreationSeries(visits, 6, now)).toHaveLength(6);
  expect(monthlyCreationSeries(visits, 12, now)).toHaveLength(12);
  expect(monthlyCreationSeries(visits, 0, now)[0]).toEqual({ month: "2025-03", count: 2 });
});

test("한국시간 월 경계와 미래·잘못된 기록을 처리한다", () => {
  const october = new Date("2026-09-30T15:00:00Z"); // 한국시간 10월 1일
  expect(monthlyCreationSeries([
    { date: "2026-09-30", todayTableCreateCount: 2 },
    { date: "2026-10-01", todayTableCreateCount: 1 },
    { date: "2026-11-01", todayTableCreateCount: 10 },
    { date: "bad", todayTableCreateCount: 10 },
  ], 3, october)).toEqual([
    { month: "2026-08", count: 0 },
    { month: "2026-09", count: 2 },
    { month: "2026-10", count: 1 },
  ]);
  expect(monthlyCreationSeries([], 0, now)).toEqual([]);
});
