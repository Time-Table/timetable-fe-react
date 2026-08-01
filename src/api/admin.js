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
