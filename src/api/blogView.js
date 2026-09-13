import { instance as axios } from "./interceptors";

/** 블로그 글 조회를 기록한다. 수집 실패가 읽기 흐름을 막으면 안 되므로 조용히 넘어간다. */
export const sendBlogView = async (payload) => {
  try {
    // silent: 429여도 공용 인터셉터가 경고 모달을 띄우지 않게 한다. 글 읽는 흐름을 막으면 안 된다.
    return await axios.post("/api/blog-views", payload, { silent: true });
  } catch (error) {
    return null;
  }
};
