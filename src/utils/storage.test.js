import { clearTableScopedStorage, ADMIN_KEY, VISITOR_KEY, SOURCE_KEY } from "./storage";

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

test("보존 대상이 없어도 오류 없이 동작한다", () => {
  localStorage.setItem("name", "홍길동");

  expect(() => clearTableScopedStorage()).not.toThrow();
  expect(localStorage.getItem(ADMIN_KEY)).toBeNull();
});

test("보존 키들은 서로 다른 값을 쓴다", () => {
  // 키가 겹치면 한쪽을 덮어써서 조용히 데이터가 섞인다.
  const keys = [ADMIN_KEY, VISITOR_KEY, SOURCE_KEY];
  expect(new Set(keys).size).toBe(keys.length);
});
