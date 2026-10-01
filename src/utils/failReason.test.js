import { joinFailReason, saveFailReason, joinTypeOf } from "./failReason";

// 표 화면 A/B 2회차 실패 이유(2026-10-01, 하네스 specs/table-ab-2.md). A·B가 같은 규칙으로 나눈다.
test("참여 실패 이유: 연결 끊김·비밀번호·요청 제한·서버", () => {
  expect(joinFailReason(undefined)).toBe("network");
  expect(joinFailReason({ success: false, code: 401 })).toBe("wrong_password");
  expect(joinFailReason({ message: "x", status: 401 })).toBe("wrong_password");
  expect(joinFailReason({ message: "많아요", status: 429 })).toBe("rate_limited");
  expect(joinFailReason({ success: false, code: 429 })).toBe("rate_limited");
  expect(joinFailReason({ success: false, status: 500 })).toBe("server");
});

test("저장 실패 이유: 응답 없는 예외는 연결, 응답 있는 예외는 서버, 성공 표시 없음은 거절", () => {
  expect(saveFailReason(new Error("offline"))).toBe("network");
  expect(saveFailReason({ response: { status: 500 } })).toBe("server");
  expect(saveFailReason(null, { success: false })).toBe("rejected");
  expect(saveFailReason(null, { success: true })).toBeNull();
});

test("참여 성공 종류: 201은 새 참여, 그 밖의 성공은 다시 들어옴", () => {
  expect(joinTypeOf({ code: 201 })).toBe("new");
  expect(joinTypeOf({ code: 200 })).toBe("returning");
});
