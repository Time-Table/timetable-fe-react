import { StrictMode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StartPage from "./start/StartPage";
import QuickCreatePage from "./create/QuickCreatePage";
import { createTable } from "../api/table";
import { sendEvent } from "../api/event";
import Swal from "sweetalert2";

jest.mock("../api/table", () => ({ createTable: jest.fn() }));
jest.mock("../api/event", () => ({ sendEvent: jest.fn() }));
jest.mock("../api/blogView", () => ({ sendBlogView: jest.fn() }));
jest.mock("../api/visit", () => ({ trackVisit: jest.fn() }));
jest.mock("../Seo", () => () => null);
jest.mock("sweetalert2", () => ({ fire: jest.fn(), showValidationMessage: jest.fn() }));
// 현재 testing-library 버전과 React 18.3의 act API를 맞춘다.
jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"), act: require("react").act,
}));
jest.mock("../component/TimeGrid", () => () => null);
jest.mock("../component/Calendar.jsx", () => ({ setSelectedDates }) => (
  <button onClick={() => setSelectedDates(["2026-09-25"])}>테스트 날짜 선택</button>
));
jest.mock("framer-motion", () => {
  const React = require("react");
  const components = {};
  // 랜딩의 스크롤 연출(useScroll 등)은 jsdom에 스크롤이 없어 0에 머무는 값으로 둔다.
  const still = { get: () => 0, on: () => () => {} };
  return {
    useReducedMotion: () => true,
    useScroll: () => ({ scrollYProgress: still }),
    useTransform: () => still,
    useMotionValueEvent: () => {},
    AnimatePresence: ({ children }) => children,
    motion: new Proxy({}, { get: (_, tag) => {
      if (!components[tag]) {
        components[tag] = React.forwardRef(({
          initial, animate, exit, transition, whileInView, viewport,
          whileHover, whileTap, layout, ...props
        }, ref) => React.createElement(tag, { ...props, ref }));
      }
      return components[tag];
    } }),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  window.clarity = jest.fn();
  Swal.fire.mockResolvedValue({ isConfirmed: true });
});

afterEach(() => { delete window.clarity; });

const mount = (Page) => render(
  <StrictMode><MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Page /></MemoryRouter></StrictMode>,
);

// 랜딩은 폼 끝과 휴대폰 하단 막대에 같은 만들기 버튼이 있다. 첫 번째(폼 끝)를 누른다.
const landingCta = () => screen.getAllByRole("button", { name: "이대로 만들기" })[0];

const submit = (path) => {
  if (path === "landing") {
    fireEvent.click(landingCta());
  } else {
    fireEvent.click(screen.getByRole("button", { name: "테스트 날짜 선택" }));
    fireEvent.change(screen.getByPlaceholderText("예: 캡스톤 디자인 3조 회의"), { target: { value: "테스트 모임" } });
  }
  fireEvent.click(screen.getByRole("button", { name: path === "landing" ? "링크 만들기" : "생성하기" }));
};

describe.each([["landing", StartPage], ["quick_create", QuickCreatePage]])("%s 생성 계측", (path, Page) => {
  test("첫 렌더는 폼 조회만 1회 기록하고 클릭·성공을 만들지 않는다", () => {
    mount(Page);
    expect(sendEvent.mock.calls.filter(([e]) => e.name === "create_view")).toHaveLength(1);
    expect(sendEvent.mock.calls.some(([e]) => e.name === "create_cta_click" || e.name === "create_success")).toBe(false);
    expect(window.clarity).toHaveBeenCalledWith("event", `tt_create_view_${path}`);
  });

  test("응답 전에는 전환하지 않고 성공 응답 후 공통·경로별 성공을 1회 기록한다", async () => {
    let resolve;
    createTable.mockImplementation(() => new Promise((done) => { resolve = done; }));
    mount(Page);
    submit(path);
    expect(window.clarity).not.toHaveBeenCalledWith("event", "tt_create_success");
    resolve({ success: true, data: { tableId: "test-table" } });
    await waitFor(() => expect(window.clarity).toHaveBeenCalledWith("event", "tt_create_success"));
    expect(window.clarity.mock.calls.filter(([, name]) => name === "tt_create_success")).toHaveLength(1);
    expect(window.clarity).toHaveBeenCalledWith("event", `tt_create_success_${path}`);
    // 서버에도 생성 경로를 함께 보낸다(랜딩 A/B에서 랜딩 생성과 빠른 생성을 나눠 세려고).
    expect(sendEvent.mock.calls.filter(([e]) => e.name === "create_success").map(([e]) => e.creationPath)).toEqual([path]);
  });

  test.each([undefined, { success: false }, { isRateLimit: true }, { success: true, data: {} }])("실패·빈 응답·429·ID 누락은 성공으로 세지 않는다: %p", async (response) => {
    createTable.mockResolvedValue(response);
    mount(Page);
    submit(path);
    await waitFor(() => expect(path === "landing" ? landingCta() : screen.getByRole("button", { name: "생성하기" })).toBeEnabled());
    expect(sendEvent.mock.calls.some(([e]) => e.name === "create_success")).toBe(false);
    expect(window.clarity).not.toHaveBeenCalledWith("event", "tt_create_success");
  });
});

test("랜딩 생성 확인창을 취소하면 생성 요청과 전환은 발생하지 않는다", () => {
  mount(StartPage);
  fireEvent.click(landingCta());
  fireEvent.click(screen.getByRole("button", { name: "취소" }));
  expect(createTable).not.toHaveBeenCalled();
  expect(window.clarity).not.toHaveBeenCalledWith("event", "tt_create_success");
});
