import { TABLE_STATE_PREFIX, isDateOnlyTable, readTableState, validCellsOf, draftFor, timeInfoOf } from "./tableSession";

// 날짜 투표 표(2026-10-09): 시작·끝 시각이 둘 다 없는 표. 칸은 날짜 "YYYY-MM-DD"다.
describe("날짜 투표 표", () => {
  test("시작·끝 시각이 둘 다 없을 때만 날짜 투표 표", () => {
    expect(isDateOnlyTable({ dates: ["2026-10-20"] })).toBe(true);
    expect(isDateOnlyTable({ dates: ["2026-10-20"], startHour: "", endHour: null })).toBe(true);
    expect(isDateOnlyTable({ dates: ["2026-10-20"], startHour: "09:00", endHour: "18:00" })).toBe(false);
    expect(isDateOnlyTable({ startHour: "09:00" })).toBe(false);
    expect(isDateOnlyTable(null)).toBe(false);
  });

  test("칸 목록은 후보 날짜 그대로이고, 시간 표는 지금처럼 30분 칸이다", () => {
    expect([...validCellsOf({ dates: ["2026-10-20", "2026-10-21", "bad"] })]).toEqual(["2026-10-20", "2026-10-21"]);
    expect([...validCellsOf({ dates: ["2026-10-20"], startHour: "09:00", endHour: "10:00" })]).toEqual([
      "2026-10-20-09:00",
      "2026-10-20-09:30",
    ]);
    expect([...validCellsOf({})]).toEqual([]);
  });

  test("칸마다 되는 사람을 날짜로 센다(후보 밖·시간 칸은 뺀다)", () => {
    const valid = validCellsOf({ dates: ["2026-10-20", "2026-10-21"] });
    const info = timeInfoOf(
      [
        { name: "민준", availableTimes: ["2026-10-20", "2026-10-22", "2026-10-20-09:00"] },
        { name: "서연", availableTimes: ["2026-10-20", "2026-10-21"] },
      ],
      valid,
    );
    expect(info.map(({ time, count }) => [time, count])).toEqual([
      ["2026-10-20", 2],
      ["2026-10-21", 1],
    ]);
  });

  test("저장 안 한 선택(공유 상태)은 날짜 값도 되살린다", () => {
    sessionStorage.setItem(
      `${TABLE_STATE_PREFIX}t`,
      JSON.stringify({ v: 1, name: "민준", editing: true, draft: ["2026-10-21", "bad", "2026-10-20-09:00"] }),
    );
    const state = readTableState("t");
    expect(state.draft).toEqual(["2026-10-21", "2026-10-20-09:00"]);
    const valid = validCellsOf({ dates: ["2026-10-20", "2026-10-21"] });
    expect(draftFor(state, "민준", valid, ["2026-10-20"])).toEqual(["2026-10-21"]);
    sessionStorage.clear();
  });
});
