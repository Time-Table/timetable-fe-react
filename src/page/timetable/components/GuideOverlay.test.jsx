import { act, fireEvent, render, screen } from "@testing-library/react";
import GuideOverlay from "./GuideOverlay";

jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"), act: require("react").act,
}));
// 계측 모듈이 서버 전송 함수를 불러온다. 네트워크 없이 Clarity 호출만 본다.
jest.mock("../../../api/event", () => ({ sendEvent: jest.fn() }));
jest.mock("../../../api/blogView", () => ({ sendBlogView: jest.fn() }));
jest.mock("framer-motion", () => {
  const React = require("react");
  const components = {};
  return {
    AnimatePresence: ({ children }) => children,
    motion: new Proxy({}, { get: (_, tag) => {
      if (!components[tag]) components[tag] = React.forwardRef(({
        initial, animate, exit, transition, whileHover, whileTap,
        currentStepPosition, arrowLeft, ...props
      }, ref) => React.createElement(tag, { ...props, ref }));
      return components[tag];
    } }),
  };
});

const renderGuide = (tableId) => render(
  <>
    <div id="guide-invite" />
    <div id="guide-all-timetable" />
    <GuideOverlay isDesktop tableId={tableId} />
  </>,
);

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  sessionStorage.clear();
  window.clarity = jest.fn();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  delete window.clarity;
});

const clarityEvents = () => window.clarity.mock.calls.map(([, name]) => name);

test("가이드가 뜨면 1회, 다음·시작하기를 누르면 각각 Clarity 보조 이벤트를 남긴다", () => {
  renderGuide("table-one");
  act(() => jest.advanceTimersByTime(1000));
  // 스크롤·크기 변화로 위치를 다시 계산해도 뜬 횟수는 늘지 않는다.
  act(() => { window.dispatchEvent(new Event("resize")); });
  expect(clarityEvents()).toEqual(["tt_guide_show"]);

  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  fireEvent.click(screen.getByRole("button", { name: "시작하기" }));
  expect(clarityEvents()).toEqual(["tt_guide_show", "tt_guide_next", "tt_guide_done"]);
});

test("다시 보지 않기를 누르면 따로 남긴다", () => {
  renderGuide("table-one");
  act(() => jest.advanceTimersByTime(1000));
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  fireEvent.click(screen.getByRole("button", { name: "다시 보지 않기" }));
  expect(clarityEvents()).toEqual(["tt_guide_show", "tt_guide_next", "tt_guide_never"]);
});

test("안내할 대상이 화면에 없으면 가이드도, 뜬 기록도 남지 않는다", () => {
  render(<GuideOverlay isDesktop tableId="table-one" />);
  act(() => jest.advanceTimersByTime(1000));
  expect(screen.queryByRole("heading", { name: "초대" })).not.toBeInTheDocument();
  expect(window.clarity).not.toHaveBeenCalled();
});

test("안내를 완료한 표에서는 화면 재생성 후 다시 뜨지 않고 새 표에서는 뜬다", () => {
  let view = renderGuide("table-one");
  act(() => jest.advanceTimersByTime(1000));
  expect(screen.getByRole("heading", { name: "초대" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  fireEvent.click(screen.getByRole("button", { name: "시작하기" }));
  view.unmount();

  view = renderGuide("table-one");
  act(() => jest.advanceTimersByTime(1000));
  expect(screen.queryByRole("heading", { name: "초대" })).not.toBeInTheDocument();
  view.unmount();

  renderGuide("table-two");
  act(() => jest.advanceTimersByTime(1000));
  expect(screen.getByRole("heading", { name: "초대" })).toBeInTheDocument();
});
