import { getShellWidth, setShellWidth, subscribeShellWidth } from "./siteShell";

// 새 표 화면(B)이 떠 있는 동안 사이트 머리말을 B 폭으로 줄이는 신호(2026-10-02).
test("폭을 걸면 알리고, 해제하면 원래대로, 늦게 해제한 옛 등록은 지금 값을 지우지 않는다", () => {
  const listener = jest.fn();
  const unsubscribe = subscribeShellWidth(listener);
  expect(getShellWidth()).toBeNull();
  const offFirst = setShellWidth(480);
  expect(getShellWidth()).toBe(480);
  const offSecond = setShellWidth(400);
  offFirst();
  expect(getShellWidth()).toBe(400);
  offSecond();
  expect(getShellWidth()).toBeNull();
  expect(listener).toHaveBeenCalledTimes(3);
  unsubscribe();
});
