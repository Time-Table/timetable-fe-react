import { act, fireEvent, render, screen } from "@testing-library/react";
import GuideOverlay from "./GuideOverlay";

jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"), act: require("react").act,
}));
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
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
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
