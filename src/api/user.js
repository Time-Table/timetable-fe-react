import { instance as axios } from "./interceptors";

export const joinUser = async (tableId, name, password) => {
  try {
    const res = await axios.post("/api/users", {
      tableId,
      name,
      password,
    });
    return res;
  } catch (error) {
    console.error("joinUser error: ", error.response);
    // 상태 코드도 함께 돌려 요청 제한(429)·비밀번호(401)를 나눌 수 있게 한다(표 화면 A/B 2회차 실패 기록).
    if (!error.response) return undefined;
    const data = error.response.data;
    return { ...(data && typeof data === "object" ? data : { message: data }), status: error.response.status };
  }
};

export const getUserInfo = async (tableId, name, password) => {
  try {
    const res = await axios.post("/api/users/verify", {
      tableId,
      name,
      password,
    });
    return res;
  } catch (error) {
    if (error.response?.status === 401) {
      return error.response?.data;
    }
    return error.response?.data;
  }
};

export const deleteUser = async (tableId, name, password) => {
  try {
    const res = await axios.delete("/api/users", {
      data: { tableId, name, password },
    });
    return res;
  } catch (error) {
    console.error("deleteUser error:", error.response);
    return error.response?.data;
  }
};

export const getAllSchedule = async (tableId) => {
  try {
    const res = await axios.get("/api/users", {
      params: { tableId },
    });
    return res;
  } catch (error) {
    console.error("getAllSchedule error: ", error.response);
    return error.response?.data;
  }
};
