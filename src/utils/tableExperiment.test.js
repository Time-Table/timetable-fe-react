import { TABLE_AB, isTableAbOn, assignedTableUi, resolveTableUi, switchTableUi, tagTableUi } from "./tableExperiment";
import { trackEvent, EVENTS, setActiveTableUi } from "./analytics";
import { ADMIN_KEY, TABLE_UI_KEY } from "./storage";
import { sendEvent } from "../api/event";

jest.mock("../api/event", () => ({ sendEvent: jest.fn() }));
jest.mock("../api/blogView", () => ({ sendBlogView: jest.fn() }));

// 명세 specs/api-contract.md "테이블 A/B 1회차"의 확인값.
const TABLE_A = "313fcb21-583e-4e82-942c-713eeb3d607d"; // 칸 79
const TABLE_B = "00000000-0000-4000-8000-000000000000"; // 칸 19
const TABLE_A2 = "11111111-1111-4111-8111-111111111111"; // 칸 53
const START = "2026-09-01T00:00:00+09:00";
const AFTER = "2026-09-10T00:00:00.000Z";
const BEFORE = "2026-08-31T14:59:59.000Z"; // 시작 1초 전

const originalStart = TABLE_AB.startAt;

beforeEach(() => {
  localStorage.clear();
  sendEvent.mockReset();
  sendEvent.mockResolvedValue({ success: true });
  window.clarity = jest.fn();
  TABLE_AB.startAt = START;
});

afterEach(() => {
  TABLE_AB.startAt = originalStart;
  setActiveTableUi(null);
  delete window.clarity;
});

describe("켜고 끄기", () => {
  test("시작 시각이 비었거나 잘못됐거나 아직 오지 않았으면 꺼져 있다", () => {
    TABLE_AB.startAt = "";
    expect(isTableAbOn()).toBe(false);
    TABLE_AB.startAt = "언젠가";
    expect(isTableAbOn()).toBe(false);
    TABLE_AB.startAt = START;
    expect(isTableAbOn(Date.parse(START) - 1)).toBe(false);
    expect(isTableAbOn(Date.parse(START))).toBe(true);
  });

  test("운영 기본값은 꺼짐이다(B가 준비되면 사람이 켠다)", () => {
    expect(originalStart).toBe("");
  });

  test("꺼져 있으면 고른 적이 있어도 모두 A다", () => {
    localStorage.setItem(TABLE_UI_KEY, JSON.stringify({ [TABLE_B]: "B" }));
    TABLE_AB.startAt = "";
    expect(resolveTableUi(TABLE_B, AFTER)).toBe("A");
  });
});

describe("배정", () => {
  test("시작 뒤에 만든 표는 표 ID 해시로 반반 나뉜다(명세 확인값)", () => {
    expect(assignedTableUi(TABLE_A, AFTER)).toBe("A");
    expect(assignedTableUi(TABLE_B, AFTER)).toBe("B");
    expect(assignedTableUi(TABLE_A2, AFTER)).toBe("A");
  });

  test("시작 전에 만든 표와 만든 시각을 모르는 표는 A다", () => {
    expect(assignedTableUi(TABLE_B, BEFORE)).toBe("A");
    expect(assignedTableUi(TABLE_B, undefined)).toBe("A");
    expect(assignedTableUi(TABLE_B, "잘못된 시각")).toBe("A");
  });

  test("많은 표를 넣으면 대략 반반이다", () => {
    const ids = Array.from({ length: 2000 }, (_, i) => `table-${i}`);
    const b = ids.filter((id) => assignedTableUi(id, AFTER) === "B").length;
    expect(b).toBeGreaterThan(900);
    expect(b).toBeLessThan(1100);
  });
});

describe("고른 화면", () => {
  test("띠로 고른 적이 있으면 배정보다 먼저 쓰고, 틀린 값·깨진 저장값은 무시한다", () => {
    localStorage.setItem(TABLE_UI_KEY, JSON.stringify({ [TABLE_B]: "A", [TABLE_A]: "X" }));
    expect(resolveTableUi(TABLE_B, AFTER)).toBe("A");
    expect(resolveTableUi(TABLE_A, AFTER)).toBe("A");
    localStorage.setItem(TABLE_UI_KEY, "{깨짐");
    expect(resolveTableUi(TABLE_B, AFTER)).toBe("B");
  });

  test("바꾸면 다른 표의 선택은 두고 이 표만 남기며, 서버 ui_switch에 바꾼 뒤 화면이 붙는다", () => {
    localStorage.setItem(TABLE_UI_KEY, JSON.stringify({ other: "B" }));
    setActiveTableUi(TABLE_A, "A");
    switchTableUi(TABLE_A, "B");
    expect(JSON.parse(localStorage.getItem(TABLE_UI_KEY))).toEqual({ other: "B", [TABLE_A]: "B" });
    expect(resolveTableUi(TABLE_A, AFTER)).toBe("B");
    expect(sendEvent).toHaveBeenCalledWith(expect.objectContaining({ name: "ui_switch", tableId: TABLE_A, uiVersion: "B" }));
    expect(window.clarity).toHaveBeenCalledWith("event", "tt_ui_switch_b");

    // 바꾼 뒤 이 표의 다른 이벤트에도 새 화면이 붙는다.
    trackEvent(EVENTS.SCHEDULE_SAVE, TABLE_A);
    expect(sendEvent).toHaveBeenLastCalledWith(expect.objectContaining({ name: "schedule_save", uiVersion: "B" }));

    switchTableUi(TABLE_A, "A");
    expect(window.clarity).toHaveBeenCalledWith("event", "tt_ui_switch_a");
    expect(sendEvent).toHaveBeenLastCalledWith(expect.objectContaining({ name: "ui_switch", uiVersion: "A" }));
  });

  test("저장소가 막혀도 바꾸기는 오류 없이 기록까지 간다", () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      expect(() => switchTableUi(TABLE_A, "B")).not.toThrow();
    } finally {
      setItem.mockRestore();
    }
  });

  test("관리자 브라우저는 선택은 남기되 서버·Clarity 기록은 보내지 않는다", () => {
    localStorage.setItem(ADMIN_KEY, "token");
    switchTableUi(TABLE_A, "B");
    tagTableUi("B");
    expect(resolveTableUi(TABLE_A, AFTER)).toBe("B");
    expect(sendEvent).not.toHaveBeenCalled();
    expect(window.clarity).not.toHaveBeenCalled();
  });
});

test("Clarity 태그 tt_table_ui에 지금 화면을 남긴다", () => {
  tagTableUi("A");
  expect(window.clarity).toHaveBeenCalledWith("set", "tt_table_ui", "A");
  delete window.clarity;
  expect(() => tagTableUi("B")).not.toThrow();
});
