// localStorage 키를 한 곳에서 관리한다.
// 테이블을 이동하면 이전 테이블의 참여 정보(name 등)는 지워야 하지만,
// 관리자 토큰과 방문자 식별/유입 정보는 테이블과 무관하므로 살아남아야 한다.
export const ADMIN_KEY = "admin_token";
export const VISITOR_KEY = "visitor_id";
export const SOURCE_KEY = "visitor_source";

const PERSISTENT_KEYS = [ADMIN_KEY, VISITOR_KEY, SOURCE_KEY];

/**
 * 다른 테이블로 이동했을 때 테이블에 종속된 값만 비운다.
 * localStorage.clear()를 그대로 쓰면 관리자 인증과 방문자 ID까지 날아간다.
 */
export const clearTableScopedStorage = () => {
  const preserved = PERSISTENT_KEYS.map((key) => [key, localStorage.getItem(key)]);
  localStorage.clear();
  preserved.forEach(([key, value]) => {
    if (value !== null) localStorage.setItem(key, value);
  });
};
