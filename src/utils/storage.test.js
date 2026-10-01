import { clearTableScopedStorage, ADMIN_KEY, VISITOR_KEY, SOURCE_KEY, TABLE_UI_KEY, CHAT_SEEN_KEY } from "./storage";

/**
 * 2026-07-29 실제 발생한 버그의 회귀 테스트.
 *
 * TimetablePage가 다른 테이블로 이동할 때 localStorage.clear()를 호출했고,
 * 그 바람에 관리자 인증과 방문자 ID까지 지워졌다. 관리자가 테이블을 하나만 열어도
 * "통계에서 제외" 상태가 조용히 풀렸고, 화면에는 아무 티가 나지 않았다.
 */

beforeEach(() => {
  localStorage.clear();
});

test("테이블에 종속된 값은 지운다", () => {
  localStorage.setItem("name", "홍길동");
  localStorage.setItem("tableId", "old-table");
  localStorage.setItem("hasClickedMembers", "true");

  clearTableScopedStorage();

  expect(localStorage.getItem("name")).toBeNull();
  expect(localStorage.getItem("tableId")).toBeNull();
  expect(localStorage.getItem("hasClickedMembers")).toBeNull();
});

test("관리자 토큰은 테이블을 옮겨도 살아남는다", () => {
  localStorage.setItem(ADMIN_KEY, "secret-token");
  localStorage.setItem("name", "홍길동");

  clearTableScopedStorage();

  expect(localStorage.getItem(ADMIN_KEY)).toBe("secret-token");
  expect(localStorage.getItem("name")).toBeNull();
});

test("방문자 ID와 유입 경로도 살아남는다", () => {
  localStorage.setItem(VISITOR_KEY, "visitor-123");
  localStorage.setItem(SOURCE_KEY, "google.com");

  clearTableScopedStorage();

  expect(localStorage.getItem(VISITOR_KEY)).toBe("visitor-123");
  expect(localStorage.getItem(SOURCE_KEY)).toBe("google.com");
});

test("표마다 고른 화면(테이블 A/B)도 살아남는다", () => {
  localStorage.setItem(TABLE_UI_KEY, JSON.stringify({ "old-table": "B" }));
  localStorage.setItem("name", "홍길동");

  clearTableScopedStorage();

  expect(JSON.parse(localStorage.getItem(TABLE_UI_KEY))).toEqual({ "old-table": "B" });
  expect(localStorage.getItem("name")).toBeNull();
});

test("보존 대상이 없어도 오류 없이 동작한다", () => {
  localStorage.setItem("name", "홍길동");

  expect(() => clearTableScopedStorage()).not.toThrow();
  expect(localStorage.getItem(ADMIN_KEY)).toBeNull();
});

test("보존 키들은 서로 다른 값을 쓴다", () => {
  // 키가 겹치면 한쪽을 덮어써서 조용히 데이터가 섞인다.
  const keys = [ADMIN_KEY, VISITOR_KEY, SOURCE_KEY, TABLE_UI_KEY];
  expect(new Set(keys).size).toBe(keys.length);
});

test("대화 읽음 기록도 다른 표에 다녀와도 살아남는다(안 읽은 수가 다시 늘지 않게)", () => {
  localStorage.setItem(CHAT_SEEN_KEY, JSON.stringify({ "table-a": "2026-09-30T11:00:00.000Z" }));
  localStorage.setItem("name", "홍길동");

  clearTableScopedStorage();

  expect(JSON.parse(localStorage.getItem(CHAT_SEEN_KEY))).toEqual({ "table-a": "2026-09-30T11:00:00.000Z" });
  expect(localStorage.getItem("name")).toBeNull();
});

test("쓰기만 막힌 브라우저에서 표를 옮겨도 영구 키는 사라지지 않고 표 값만 지운다(Codex 2026-10-02)", () => {
  localStorage.setItem(VISITOR_KEY, "visitor-123");
  localStorage.setItem(ADMIN_KEY, "secret-token");
  localStorage.setItem(TABLE_UI_KEY, JSON.stringify({ key: "table-ab-2", ui: "B" }));
  localStorage.setItem("name", "홍길동");
  const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceededError");
  });
  const clear = jest.spyOn(Storage.prototype, "clear");

  expect(() => clearTableScopedStorage()).not.toThrow();

  expect(clear).not.toHaveBeenCalled();
  expect(localStorage.getItem(VISITOR_KEY)).toBe("visitor-123");
  expect(localStorage.getItem(ADMIN_KEY)).toBe("secret-token");
  expect(JSON.parse(localStorage.getItem(TABLE_UI_KEY))).toEqual({ key: "table-ab-2", ui: "B" });
  expect(localStorage.getItem("name")).toBeNull();
  setItem.mockRestore();
  clear.mockRestore();
});

test("저장소 접근이 전부 막혀도 오류 없이 넘어간다", () => {
  const spies = ["getItem", "setItem", "removeItem", "clear", "key"].map((method) =>
    jest.spyOn(Storage.prototype, method).mockImplementation(() => {
      throw new Error("SecurityError");
    }));
  expect(() => clearTableScopedStorage()).not.toThrow();
  spies.forEach((spy) => spy.mockRestore());
});
