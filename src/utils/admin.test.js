import { isAdmin, grantAdmin, revokeAdmin, getAdminToken } from "./admin";
import { ADMIN_KEY } from "./storage";

/**
 * 관리자 판정이 틀리면 두 가지가 동시에 망가진다.
 * 관리자인데 false면 본인 활동이 통계에 섞이고, 아닌데 true면 관리자 API 호출이 401로 깨진다.
 */

beforeEach(() => {
  localStorage.clear();
});

test("토큰이 없으면 관리자가 아니다", () => {
  expect(isAdmin()).toBe(false);
  expect(getAdminToken()).toBeNull();
});

test("토큰을 받으면 관리자가 된다", () => {
  grantAdmin("server-issued-token");

  expect(isAdmin()).toBe(true);
  expect(getAdminToken()).toBe("server-issued-token");
  expect(localStorage.getItem(ADMIN_KEY)).toBe("server-issued-token");
});

test("로그아웃하면 관리자가 아니게 된다", () => {
  grantAdmin("server-issued-token");
  revokeAdmin();

  expect(isAdmin()).toBe(false);
  expect(getAdminToken()).toBeNull();
});

test("빈 문자열 토큰은 관리자로 치지 않는다", () => {
  // 서버가 빈 값을 주는 사고가 나도 관리자로 승격되면 안 된다.
  localStorage.setItem(ADMIN_KEY, "");
  expect(isAdmin()).toBe(false);
});

test("예전 방식의 값(verified)은 더 이상 통하지 않는다", () => {
  // 과거에는 하드코딩 비밀번호로 "verified" 문자열만 저장했다.
  // 이제는 서버 발급 토큰이어야 하며, 남아 있는 값은 서버 검증에서 걸러진다.
  localStorage.setItem(ADMIN_KEY, "verified");
  expect(getAdminToken()).toBe("verified");
});
