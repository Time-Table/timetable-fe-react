import {
  TABLE_STATE_PREFIX,
  readTableState,
  writeTableState,
  clearTableDraft,
  clearTableState,
  validCellsOf,
  draftFor,
  weekKeysOf,
  timeInfoOf,
  chatSeenAt,
  markChatsSeen,
} from "./tableSession";
import { CHAT_SEEN_KEY } from "./storage";

// 표 화면 A/B 공유 상태(2026-09-30). 두 화면이 같은 탭의 sessionStorage 한 칸을 같은 규칙으로 읽고 쓴다.
const ID = "table-1";
const KEY = TABLE_STATE_PREFIX + ID;

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  jest.restoreAllMocks();
});

test("없거나 깨졌거나 버전이 다르면 빈 상태를 준다", () => {
  const empty = { v: 1, name: null, editing: false, draft: null, weekKey: null, picks: [] };
  expect(readTableState(ID)).toEqual(empty);
  sessionStorage.setItem(KEY, "{깨짐");
  expect(readTableState(ID)).toEqual(empty);
  sessionStorage.setItem(KEY, JSON.stringify({ v: 2, name: "민준" }));
  expect(readTableState(ID)).toEqual(empty);
  sessionStorage.setItem(KEY, JSON.stringify([1, 2]));
  expect(readTableState(ID)).toEqual(empty);
});

test("형식이 맞는 값만 남긴다(칸 형식·중복·주·사람)", () => {
  sessionStorage.setItem(KEY, JSON.stringify({
    v: 1, name: "민준", editing: true, weekKey: "2026-10-05",
    draft: ["2026-10-08-18:00", "2026-10-08-18:00", "잘못", 3, "2026-10-08-18:30"],
    picks: ["민준", "", null, "서연", "민준"],
  }));
  expect(readTableState(ID)).toEqual({
    v: 1, name: "민준", editing: true, weekKey: "2026-10-05",
    draft: ["2026-10-08-18:00", "2026-10-08-18:30"], picks: ["민준", "서연"],
  });
  sessionStorage.setItem(KEY, JSON.stringify({ v: 1, name: "민준", weekKey: "10월", editing: "yes" }));
  expect(readTableState(ID)).toMatchObject({ weekKey: null, editing: false });
});

test("[]는 '전부 지움'으로 남고 null은 '바뀐 것 없음'이다", () => {
  writeTableState(ID, { name: "민준", draft: [] });
  expect(readTableState(ID).draft).toEqual([]);
  clearTableDraft(ID);
  expect(readTableState(ID).draft).toBeNull();
  expect(readTableState(ID).name).toBe("민준"); // 비워도 이름·주는 남는다
});

test("일부만 바꿔 쓰고, 참여 취소 때는 통째로 지운다", () => {
  writeTableState(ID, { name: "민준", weekKey: "2026-10-05" });
  writeTableState(ID, { picks: ["서연"] });
  expect(readTableState(ID)).toMatchObject({ name: "민준", weekKey: "2026-10-05", picks: ["서연"] });
  clearTableState(ID);
  expect(sessionStorage.getItem(KEY)).toBeNull();
});

test("저장소가 막혀 있어도 예외를 던지지 않는다", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceeded"); });
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("SecurityError"); });
  expect(() => writeTableState(ID, { name: "민준" })).not.toThrow();
  expect(readTableState(ID).name).toBeNull();
});

test("표의 칸: 시 단위 범위 안이고 막힌 칸은 뺀다", () => {
  const cells = validCellsOf({ dates: ["2026-10-08"], startHour: "18:00", endHour: "20:00", banedCells: ["2026-10-08-19:00"] });
  expect([...cells]).toEqual(["2026-10-08-18:00", "2026-10-08-18:30", "2026-10-08-19:30"]);
  expect(validCellsOf({ dates: ["2026-10-08"], startHour: "20:00", endHour: "18:00" }).size).toBe(0);
});

test("저장 안 한 선택: 같은 이름만, 표 밖 칸은 빼고, 저장한 시간과 같으면 없음", () => {
  const valid = validCellsOf({ dates: ["2026-10-08"], startHour: "18:00", endHour: "20:00" });
  const state = { name: "민준", draft: ["2026-10-08-18:00", "2026-11-01-10:00"] };
  expect(draftFor(state, "민준", valid, [])).toEqual(["2026-10-08-18:00"]);
  expect(draftFor(state, "서연", valid, [])).toBeNull();
  expect(draftFor(state, "민준", valid, ["2026-10-08-18:00"])).toBeNull();
  expect(draftFor({ name: "민준", draft: [] }, "민준", valid, ["2026-10-08-18:00"])).toEqual([]);
  expect(draftFor({ name: "민준", draft: null }, "민준", valid, [])).toBeNull();
});

test("주 키는 월요일 기준이고 새 화면과 같다", () => {
  expect(weekKeysOf(["2026-10-14", "2026-09-28", "2026-10-04", "2026-10-05"])).toEqual(["2026-09-28", "2026-10-05", "2026-10-12"]);
});

test("칸별 인원: 참여자 목록으로 세고, 표 밖·막은 칸은 빼고, 같은 시간은 한 번만 센다(새 화면과 같다)", () => {
  const valid = validCellsOf({ dates: ["2026-10-08"], startHour: "18:00", endHour: "20:00", banedCells: ["2026-10-08-19:00"] });
  const users = [
    { name: "민준", availableTimes: ["2026-10-08-18:00", "2026-10-08-18:00", "2026-10-08-19:00", "2026-12-31-10:00"] },
    { name: "서연", availableTimes: ["2026-10-08-18:00", "2026-10-08-19:30"] },
    { name: "지훈" },
  ];
  expect(timeInfoOf(users, valid)).toEqual([
    { time: "2026-10-08-18:00", count: 2, members: ["민준", "서연"], _id: "2026-10-08-18:00" },
    { time: "2026-10-08-19:30", count: 1, members: ["서연"], _id: "2026-10-08-19:30" },
  ]);
  // 칸 제한 없이 부르면 모두 센다(중복은 여전히 한 번).
  expect(timeInfoOf(users).find((item) => item.time === "2026-10-08-18:00").count).toBe(2);
  expect(timeInfoOf(null, valid)).toEqual([]);
});

test("대화 읽음: 가장 늦은 글 시각을 표마다 남기고, 뒤로 가지 않고, 깨진 값은 없던 것으로 본다", () => {
  expect(chatSeenAt(ID)).toBeNull();
  markChatsSeen(ID, [{ timestamp: "2026-09-30T10:00:00.000Z" }, { timestamp: "2026-09-30T11:00:00.000Z" }, {}]);
  expect(chatSeenAt(ID)).toBe(Date.parse("2026-09-30T11:00:00.000Z"));
  markChatsSeen(ID, [{ timestamp: "2026-09-30T09:00:00.000Z" }]);
  expect(chatSeenAt(ID)).toBe(Date.parse("2026-09-30T11:00:00.000Z"));
  markChatsSeen("table-2", [{ timestamp: "2026-09-30T12:00:00.000Z" }]);
  expect(JSON.parse(localStorage.getItem(CHAT_SEEN_KEY))).toEqual({
    "table-2": "2026-09-30T12:00:00.000Z",
    [ID]: "2026-09-30T11:00:00.000Z",
  });
  localStorage.setItem(CHAT_SEEN_KEY, "{깨짐");
  expect(chatSeenAt(ID)).toBeNull();
});

test("대화 읽음은 표 50개까지만 남긴다(늦은 글 순)", () => {
  for (let i = 0; i < 55; i += 1) {
    markChatsSeen(`t-${i}`, [{ timestamp: new Date(Date.UTC(2026, 8, 1, 0, i)).toISOString() }]);
  }
  const kept = Object.keys(JSON.parse(localStorage.getItem(CHAT_SEEN_KEY)));
  expect(kept).toHaveLength(50);
  expect(kept).not.toContain("t-0");
  expect(kept).toContain("t-54");
});
