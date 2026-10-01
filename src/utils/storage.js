// localStorage 키를 한 곳에서 관리한다.
// 테이블을 이동하면 이전 테이블의 참여 정보(name 등)는 지워야 하지만,
// 관리자 토큰과 방문자 식별/유입 정보는 테이블과 무관하므로 살아남아야 한다.
export const ADMIN_KEY = "admin_token";
export const VISITOR_KEY = "visitor_id";
export const SOURCE_KEY = "visitor_source";
// 테이블 A/B(2026-09-29): 사용자가 표마다 고른 화면(A/B). 다른 표에 다녀와도 그 표의 선택이 남아야 한다.
export const TABLE_UI_KEY = "table_ui_choice";
// 대화 읽음(2026-09-30): 표마다 이 기기에서 마지막으로 본 대화 시각. 다른 표에 다녀와도 남아야 안 읽은 수가 맞다.
export const CHAT_SEEN_KEY = "tt_chat_seen";

const PERSISTENT_KEYS = [ADMIN_KEY, VISITOR_KEY, SOURCE_KEY, TABLE_UI_KEY, CHAT_SEEN_KEY];

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
