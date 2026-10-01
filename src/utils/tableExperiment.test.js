import { TABLE_AB, assignedTableUi, resolveTableUi, switchTableUi, experimentVisitorId } from "./tableExperiment";
import { setActiveTableUi } from "./analytics";
import { grantAdmin } from "./admin";
import { TABLE_UI_KEY, VISITOR_KEY, clearTableScopedStorage } from "./storage";
import { sendEvent } from "../api/event";

jest.mock("../api/event", () => ({ sendEvent: jest.fn(), sendEventKeepalive: jest.fn() }));
jest.mock("../api/blogView", () => ({ sendBlogView: jest.fn() }));

// 표 화면 A/B 2회차(2026-10-01, 하네스 specs/table-ab-2.md). BE test/tableAb2.test.js와 같은 확인값이다.
const V_A = "00000000-0000-4000-8000-000000000000"; // 칸 56 → A
const V_B = "11111111-1111-4111-8111-111111111111"; // 칸 14 → B

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.resetAllMocks();
  window.clarity = jest.fn();
});
afterEach(() => {
  setActiveTableUi(null);
  delete window.clarity;
});

describe("배정", () => {
  test("브라우저(visitorId) 단위로 table-ab-2 해시 % 100 < 50이면 B", () => {
    expect(TABLE_AB.key).toBe("table-ab-2");
    expect(assignedTableUi(V_A)).toBe("A");
    expect(assignedTableUi(V_B)).toBe("B");
  });

  test("실험이 꺼져 있거나 브라우저를 식별 못 하면 A", () => {
    expect(resolveTableUi({ running: false, visitorId: V_B })).toBe("A");
    expect(resolveTableUi({ running: true, visitorId: null })).toBe("A");
    expect(resolveTableUi({ running: true, visitorId: V_B })).toBe("B");
  });

  test("저장소를 못 쓰면 실험용 ID가 없다(실험에서 뺀다)", () => {
    const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(experimentVisitorId()).toBeNull();
    spy.mockRestore();
    localStorage.setItem(VISITOR_KEY, V_A);
    expect(experimentVisitorId()).toBe(V_A);
  });
});

describe("고른 화면", () => {
  test("띠로 고른 화면은 모든 표에서 배정보다 먼저 쓰고, 다른 회차 키·깨진 값은 무시한다", () => {
    localStorage.setItem(TABLE_UI_KEY, JSON.stringify({ key: "table-ab-2", ui: "B" }));
    expect(resolveTableUi({ running: true, visitorId: V_A })).toBe("B");
    localStorage.setItem(TABLE_UI_KEY, JSON.stringify({ key: "table-ab-1", ui: "B" }));
    expect(resolveTableUi({ running: true, visitorId: V_A })).toBe("A");
    localStorage.setItem(TABLE_UI_KEY, "{깨진");
    expect(resolveTableUi({ running: true, visitorId: V_A })).toBe("A");
  });

  test("바꾸면 선택을 남기고 서버 ui_switch에 바꾼 뒤 화면과 떠나는 구간을 싣는다", () => {
    switchTableUi("table-1", "B", { viewId: "view-1" });
    expect(JSON.parse(localStorage.getItem(TABLE_UI_KEY))).toEqual({ key: "table-ab-2", ui: "B" });
    expect(sendEvent).toHaveBeenCalledWith(expect.objectContaining({ name: "ui_switch", tableId: "table-1", uiVersion: "B", viewId: "view-1" }));
    expect(window.clarity).toHaveBeenCalledWith("event", "tt_ui_switch_b");
  });

  test("다른 표로 옮겨도 고른 화면은 남는다(보존 목록)", () => {
    switchTableUi("table-1", "B", {});
    localStorage.setItem("name", "민준");
    clearTableScopedStorage();
    expect(localStorage.getItem("name")).toBeNull();
    expect(JSON.parse(localStorage.getItem(TABLE_UI_KEY))).toEqual({ key: "table-ab-2", ui: "B" });
  });

  test("관리자 브라우저는 선택은 남기되 서버·Clarity 기록은 보내지 않는다", () => {
    grantAdmin("test-token");
    switchTableUi("table-1", "B", {});
    expect(resolveTableUi({ running: true, visitorId: V_A })).toBe("B");
    expect(sendEvent).not.toHaveBeenCalled();
    expect(window.clarity).not.toHaveBeenCalled();
  });
});
