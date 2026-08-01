import { ADMIN_KEY } from "./storage";

/**
 * 관리자 토큰은 서버 로그인에 성공했을 때만 발급된다.
 * 토큰을 가진 브라우저는 방문/조회수 집계와 퍼널 이벤트 수집에서 모두 제외된다.
 */
export const getAdminToken = () => localStorage.getItem(ADMIN_KEY);

export const isAdmin = () => !!getAdminToken();

export const grantAdmin = (token) => localStorage.setItem(ADMIN_KEY, token);

export const revokeAdmin = () => localStorage.removeItem(ADMIN_KEY);
