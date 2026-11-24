// localStorage 키를 한 곳에서 관리한다.
// 테이블을 이동하면 이전 테이블의 참여 정보(name 등)는 지워야 하지만,
// 관리자 토큰과 방문자 식별/유입 정보는 테이블과 무관하므로 살아남아야 한다.
export const ADMIN_KEY = "admin_token";
export const VISITOR_KEY = "visitor_id";
export const SOURCE_KEY = "visitor_source";
// 표 화면 A/B 2회차(2026-10-01): 이 브라우저가 띠로 고른 화면 { key, ui }. 모든 표에 쓰므로 표를 옮겨도 남아야 한다.
// 1회차(표별 table_ui_choice)는 켠 적이 없어 읽지 않는다.
export const TABLE_UI_KEY = "table_ui_choice_v2";
// 띠 하트 투표(2026-10-02): 이 브라우저가 하트를 누른 화면 { key, ui }. 사람당 한 표라 표를 옮겨도 남아야 한다.
export const TABLE_UI_VOTE_KEY = "table_ui_vote_v2";
// 대화 읽음(2026-09-30): 표마다 이 기기에서 마지막으로 본 대화 시각. 다른 표에 다녀와도 남아야 안 읽은 수가 맞다.
export const CHAT_SEEN_KEY = "tt_chat_seen";
// 랜딩 신뢰 표시(2026-10-04): 지난번에 숫자가 100명 이하라 숨겼으면 "1". 다음 방문에서 받기 전부터 자리를 비워 둔다.
export const LANDING_STATS_HIDDEN_KEY = "tt_landing_stats_hidden";

const PERSISTENT_KEYS = [ADMIN_KEY, VISITOR_KEY, SOURCE_KEY, TABLE_UI_KEY, TABLE_UI_VOTE_KEY, CHAT_SEEN_KEY, LANDING_STATS_HIDDEN_KEY];

/**
 * 저장소 읽기·쓰기·지우기. 브라우저가 사이트 저장소를 막으면(접근 자체가 예외) 값이 없는 것으로 보고 화면을 계속 그린다
 * (Codex 2026-10-02). 쓰기는 성공 여부를 돌려준다.
 */
export const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
export const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};
export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // 막힌 저장소에는 지울 값도 없다.
  }
};

/**
 * 다른 테이블로 이동했을 때 테이블에 종속된 값만 비운다.
 * 표에 딸린 키만 하나씩 지우고 관리자 인증·방문자 ID·고른 화면 같은 영구 키는 건드리지 않는다.
 * (전에는 전체를 비우고 영구 키를 다시 썼는데, 쓰기만 막힌 브라우저에서는 영구 키가 사라졌다. Codex 2026-10-02)
 * 저장소가 막혀 있으면 할 수 있는 만큼만 하고 표 화면은 멈추지 않는다.
 */
export const clearTableScopedStorage = () => {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) keys.push(localStorage.key(i));
  } catch {
    return;
  }
  keys.filter((key) => key !== null && !PERSISTENT_KEYS.includes(key)).forEach(removeStorage);
};
