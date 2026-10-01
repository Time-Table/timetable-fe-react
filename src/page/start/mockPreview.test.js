import { buildTidyMockTimetable } from "./mockPreview";

const pad = (n) => String(n).padStart(2, "0");

/** start부터 n일. 랜딩 화면의 selectedDays와 같은 모양이다(기본 후보는 오늘부터 7일). */
const daysFrom = (start, n = 7) =>
  Array.from({ length: n }, (_, i) => {
    const date = new Date(`${start}T00:00:00`);
    date.setDate(date.getDate() + i);
    return { key: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, date, selected: true };
  });

const goldenDay = (days) => buildTidyMockTimetable(days, "10:00", "20:00").golden.day.key;

describe("미리보기 골든타임은 고른 날이 가장 많은 주에 둔다", () => {
  test("일요일에 열면(일~토) 이번 주는 하루뿐이라 엿새를 고른 다음 주 금요일", () => {
    expect(goldenDay(daysFrom("2026-10-04"))).toBe("2026-10-09");
  });

  test("목요일에 열면(목~수) 나흘을 고른 이번 주 금요일", () => {
    expect(goldenDay(daysFrom("2026-10-01"))).toBe("2026-10-02");
  });

  test("금요일에 열면(금~목) 나흘을 고른 다음 주. 그 주에 고른 금요일이 없어 고른 날의 가운데(화)", () => {
    expect(goldenDay(daysFrom("2026-10-02"))).toBe("2026-10-06");
  });

  test("두 주에 고른 날 수가 같으면 앞 주", () => {
    // 금·토·일(이번 주 3일) + 월·화·수(다음 주 3일)
    expect(goldenDay(daysFrom("2026-10-02", 6))).toBe("2026-10-02");
  });
});
