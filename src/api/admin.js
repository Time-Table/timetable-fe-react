import { instance as axios } from "./interceptors";

/** 비밀번호를 서버에서 검증하고, 이후 요청에 쓸 토큰을 받아온다. */
export const adminLogin = async (password) => {
  try {
    return await axios.post("/api/admin/login", { password });
  } catch (error) {
    return error.response?.data || { success: false, message: "서버에 연결할 수 없습니다." };
  }
};

/** 저장된 토큰이 아직 유효한지 확인한다. */
export const adminVerify = async () => {
  try {
    return await axios.get("/api/admin/verify");
  } catch (error) {
    return { success: false };
  }
};

const get = async (path, params) => {
  try {
    const res = await axios.get(path, { params });
    return res?.data || null;
  } catch (error) {
    console.error(`${path} error: `, error.response);
    return null;
  }
};

export const getTrends = (days) => get("/api/admin/trends", { days });

export const getAudience = (days) => get("/api/admin/audience", { days });

export const getChatFeed = (limit) => get("/api/admin/chats", { limit });

export const getTableDetail = (tableId) => get(`/api/admin/tables/${tableId}`);

/**
 * 블로그 조회 통계. 다른 조회와 달리 실패를 null로 뭉개지 않는다.
 * 404는 재시도로 안 풀리는 "BE 미배포"라서, 화면이 "백엔드부터 배포하라"고 말할 수 있게 구분한다.
 */
export const getBlogStats = async (days) => {
  try {
    const res = await axios.get("/api/blog-views/stats", { params: { days } });
    return res?.data || { error: "failed" };
  } catch (error) {
    if (error.response?.status === 404) return { error: "notDeployed" };
    console.error("/api/blog-views/stats error: ", error.response);
    return { error: "failed" };
  }
};

/** 문의함. 최신순 { total, inquiries }. 실패와 BE 미배포(404)를 구분한다. */
export const getInquiries = async (limit = 100) => {
  try {
    const res = await axios.get("/api/admin/inquiries", { params: { limit } });
    return res?.data || { error: "failed" };
  } catch (error) {
    if (error.response?.status === 404) return { error: "notDeployed" };
    console.error("/api/admin/inquiries error: ", error.response);
    return { error: "failed" };
  }
};

/**
 * 문의 상태 변경·삭제. 실패하면 { error }를 돌려준다.
 * 404는 두 가지다: 라우트가 없으면(BE 미배포) Express 기본 응답이라 success 필드가 없고,
 * 문의가 이미 지워졌으면 컨트롤러가 { success: false }를 준다.
 */
const writeInquiry = async (request) => {
  try {
    const res = await request();
    return res?.success ? res : { error: "failed" };
  } catch (error) {
    const { status, data } = error.response || {};
    if (status === 404) return { error: data?.success === false ? "notFound" : "notDeployed" };
    console.error("/api/admin/inquiries write error: ", error.response);
    return { error: "failed" };
  }
};

export const updateInquiryStatus = (id, status) =>
  writeInquiry(() => axios.patch(`/api/admin/inquiries/${encodeURIComponent(id)}`, { status }));

export const deleteInquiry = (id) =>
  writeInquiry(() => axios.delete(`/api/admin/inquiries/${encodeURIComponent(id)}`));
