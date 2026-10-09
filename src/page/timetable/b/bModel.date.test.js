import { commonDaysOf, dateInfoOf, dayCount, dayFill, dayUnder, daySummaryOf, monthsOf, rankDays } from "./bModel";

// 날짜 투표 표 계산(2026-10-09, 시안 FinalSpec 규칙).
const TABLE = { dates: ["2026-10-23", "2026-10-20", "2026-10-21"] };
const USERS = [
  { name: "민준", availableTimes: ["2026-10-21", "2026-10-23"] },
  { name: "서연", availableTimes: ["2026-10-21", "2026-10-20", "2026-10-22"] },
  { name: "지호", availableTimes: [] },
];

test("달력은 후보가 있는 달마다 한 장, 그 달의 모든 주(월요일 시작)를 넣는다", () => {
  const [oct] = monthsOf(["2026-10-20", "2026-10-21"]);
  expect(oct.label).toBe("2026년 10월");
  expect(oct.weeks).toHaveLength(5); // 9/28(월) ~ 11/1(일)
  expect(oct.weeks[0][0]).toEqual(expect.objectContaining({ key: "2026-09-28", inMonth: false }));
  expect(oct.weeks[0][3]).toEqual(expect.objectContaining({ key: "2026-10-01", inMonth: true, on: false, dnum: 1, col: 3 }));
  expect(oct.weeks.flat().filter((c) => c.on).map((c) => c.key)).toEqual(["2026-10-20", "2026-10-21"]);
  // 후보 없는 주도 건너뛰지 않고, 여러 달이면 달마다
  expect(monthsOf(["2026-10-30", "2026-12-01"]).map((m) => m.label)).toEqual(["2026년 10월", "2026년 12월"]);
});

test("칸 진하기는 참여자 수 대비 비율(0.12 + 0.88 × 비율), 아무도 없으면 0", () => {
  expect(dayFill(0, 5)).toBe(0);
  expect(dayFill(5, 5)).toBeCloseTo(1);
  expect(dayFill(1, 5)).toBeCloseTo(0.296);
  expect(dayUnder(0, 5)).toBe(0);
  expect(dayUnder(5, 5)).toBeCloseTo(0.3);
});

test("날짜별 인원·순위·모두 되는 날", () => {
  const info = dateInfoOf(USERS, TABLE);
  expect([...info.keys()].sort()).toEqual(["2026-10-20", "2026-10-21", "2026-10-23"]);
  expect(info.get("2026-10-21")).toEqual({ count: 2, members: ["민준", "서연"] });
  const ranked = rankDays(info, ["2026-10-20", "2026-10-21", "2026-10-23"]);
  expect(ranked.map(({ d, rank }) => [d.date, d.count, rank])).toEqual([
    ["2026-10-21", 2, 1],
    ["2026-10-20", 1, 2],
    ["2026-10-23", 1, 2],
  ]);
  expect(commonDaysOf(["민준", "서연"], info, ["2026-10-20", "2026-10-21", "2026-10-23"])).toEqual(["2026-10-21"]);
  expect(commonDaysOf([], info, ["2026-10-21"])).toEqual([]);
  expect(dayCount(3)).toBe("3일");
  expect(daySummaryOf(ranked, 3)).toBe("가장 많이 모이는 날은 10월 21일 (수), 3명 중 2명 가능이에요.");
  expect(daySummaryOf([], 3)).toBe("아직 아무도 날짜를 넣지 않았어요.");
});
