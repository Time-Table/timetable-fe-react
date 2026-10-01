import { act, renderHook } from "@testing-library/react";
import useUiSegment from "./useUiSegment";
import { sendEvent, sendEventKeepalive } from "../../api/event";

jest.mock("../../api/event", () => ({ sendEvent: jest.fn(), sendEventKeepalive: jest.fn() }));
jest.mock("../../api/blogView", () => ({ sendBlogView: jest.fn() }));

// 표 화면 A/B 2회차 화면 기록(2026-10-01, 하네스 specs/table-ab-2.md). 2026-10-02부터 머문 시간은 재지 않는다.
const sent = (name) => sendEvent.mock.calls.map(([p]) => p).filter((p) => p.name === name);

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  jest.useRealTimers();
});

test("켜지면 ui_view 한 번, 시간이 가고 누르고 숨기고 떠나도 다른 기록은 없다", () => {
  const { result, unmount } = renderHook(() => useUiSegment({ tableId: "t1", uiVersion: "B", active: true }));
  const [view] = sent("ui_view");
  expect(view).toEqual(expect.objectContaining({ tableId: "t1", uiVersion: "B", viewId: expect.any(String) }));
  expect(result.current()).toBe(view.viewId);
  act(() => jest.advanceTimersByTime(60000));
  act(() => {
    document.body.click();
    window.dispatchEvent(new Event("pagehide"));
  });
  unmount();
  expect(sendEvent).toHaveBeenCalledTimes(1);
  expect(sendEventKeepalive).not.toHaveBeenCalled();
  expect(result.current()).toBeUndefined();
});

test("꺼져 있으면 아무것도 보내지 않고, 화면이 바뀌면 새 화면 ID로 ui_view", () => {
  const { rerender } = renderHook((props) => useUiSegment(props), { initialProps: { tableId: "t1", uiVersion: "A", active: false } });
  expect(sendEvent).not.toHaveBeenCalled();
  rerender({ tableId: "t1", uiVersion: "A", active: true });
  rerender({ tableId: "t1", uiVersion: "B", active: true });
  const views = sent("ui_view");
  expect(views.map((v) => v.uiVersion)).toEqual(["A", "B"]);
  expect(views[0].viewId).not.toBe(views[1].viewId);
});

test("같은 표·같은 화면이 잠깐 꺼졌다 켜지면(새로고침) 다시 보내지 않고 화면 ID를 이어 쓴다, A→B→A는 매번 보낸다", () => {
  const { result, rerender } = renderHook((props) => useUiSegment(props), { initialProps: { tableId: "t1", uiVersion: "A", active: true } });
  const first = result.current();
  rerender({ tableId: "t1", uiVersion: "A", active: false });
  rerender({ tableId: "t1", uiVersion: "A", active: true });
  expect(sent("ui_view")).toHaveLength(1);
  expect(result.current()).toBe(first);
  rerender({ tableId: "t1", uiVersion: "B", active: true });
  rerender({ tableId: "t1", uiVersion: "A", active: true });
  expect(sent("ui_view").map((v) => v.uiVersion)).toEqual(["A", "B", "A"]);
});
