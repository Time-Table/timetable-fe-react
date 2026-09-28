import { getLastSelectableDate, monthIndex } from "./dateLimit";

const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

test.each([
  ["2026-09-28T14:00:00", "2027-09-30"],
  ["2026-10-30T14:00:00", "2027-10-31"],
  // 예전 계산(오늘 + 11개월)은 이 날 2027-11-30까지 열렸다.
  ["2026-10-31T14:00:00", "2027-10-31"],
  ["2027-03-31T14:00:00", "2028-03-31"],
  ["2026-12-15T09:00:00", "2027-12-31"],
  ["2027-01-31T23:59:00", "2028-01-31"],
])("%s에 열면 %s까지 고를 수 있다", (now, last) => {
  expect(key(getLastSelectableDate(new Date(now)))).toBe(last);
});

test("달 번호는 해가 바뀌어도 순서대로 커진다", () => {
  expect(monthIndex(new Date(2027, 0, 1)) - monthIndex(new Date(2026, 11, 31))).toBe(1);
});
