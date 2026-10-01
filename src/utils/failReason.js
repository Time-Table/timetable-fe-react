/**
 * 표 화면 A/B 2회차 실패 기록의 이유 값(2026-10-01, 하네스 specs/table-ab-2.md). A·B가 같은 규칙으로 나눈다.
 * 이름·입력값은 담지 않고 정해진 값만 쓴다.
 */

/** 참여 요청 결과 → 이유. res는 joinUser가 돌려준 값(실패면 서버 본문 + status, 연결 끊김이면 없음). */
export const joinFailReason = (res) => {
  if (!res) return "network";
  if (res.code === 401 || res.status === 401) return "wrong_password";
  if (res.status === 429 || res.code === 429) return "rate_limited";
  return "server";
};

/** 저장 결과 → 이유. 요청이 예외로 끝났으면 응답 유무로 서버·연결을, 성공 표시 없이 끝났으면 rejected. */
export const saveFailReason = (error, result) => {
  if (error) return error.response ? "server" : "network";
  return result?.success === true ? null : "rejected";
};

/** 참여 성공 응답 → 새 참여(201) / 다시 들어옴(200). */
export const joinTypeOf = (res) => (res?.code === 201 ? "new" : "returning");
