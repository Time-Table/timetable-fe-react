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
    useScroll: () => ({ scrollY: still, scrollYProgress: still }),
    useTransform: () => still,
    useMotionValue: () => ({ ...still, set: () => {} }),
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

// 날짜 투표(2026-10-09 사람 결정): 시간 범위 스위치. 켬(기본) = 시간 범위까지, 끔 = 날짜만 고르는 표.
// 경로마다 시간 고르기 모양이 달라(랜딩 넓은 화면 = 선택 목록, 빠른 생성 = 펼침 단추) 찾는 법만 나눠 둔다.
const TIME_CONTROL = {
  landing: () => screen.queryByRole("combobox", { name: "시작 시간" }),
  quick_create: () => screen.queryByText("09:00"),
};
// 랜딩은 확인 창에서 "링크 만들기", 빠른 생성은 날짜·이름을 넣고 "생성하기".
const submitDateOnly = (path) => {
  fireEvent.click(screen.getByRole("switch", { name: "시간 범위 정하기" }));
  submit(path);
};

describe.each([["landing", StartPage], ["quick_create", QuickCreatePage]])("%s 날짜 투표", (path, Page) => {
  const toggle = () => screen.getByRole("switch", { name: "시간 범위 정하기" });

  test("스위치는 켬으로 시작하고, 끄면 '날짜만'을 보이고 시간 고르기를 감추며 Clarity에는 처음 한 번만 남긴다", () => {
    mount(Page);
    expect(toggle()).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("날짜만")).not.toBeInTheDocument();
    expect(TIME_CONTROL[path]()).toBeInTheDocument();

    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("날짜만")).toBeInTheDocument();
    expect(TIME_CONTROL[path]()).not.toBeInTheDocument();
    // 빠른 생성의 시간 잠금 카드도 감춘다(랜딩은 폼에 원래 없다).
    expect(screen.queryByText(/\(선택\)시간 잠금/)).not.toBeInTheDocument();
    fireEvent.click(toggle());
    fireEvent.click(toggle());
    expect(window.clarity.mock.calls.filter(([, name]) => name === "tt_time_switch_off")).toHaveLength(1);
  });

  test("날짜만이면 시작·끝 시각 없이 만들고, 생성 시도·성공에 표 유형 date를 붙인다", async () => {
    createTable.mockResolvedValue({ success: true, data: { tableId: "date-table" } });
    mount(Page);
    submitDateOnly(path);
    await waitFor(() => expect(createTable).toHaveBeenCalledTimes(1));
    const [, dates, startHour, endHour, banned] = createTable.mock.calls[0];
    expect(dates.length).toBeGreaterThan(0);
    expect([startHour, endHour, banned]).toEqual([null, null, undefined]);
    await waitFor(() => expect(sendEvent.mock.calls.some(([e]) => e.name === "create_success")).toBe(true));
    const typed = sendEvent.mock.calls.map(([e]) => e).filter((e) => ["create_submit", "create_success"].includes(e.name));
    expect(typed.map((e) => [e.name, e.tableType, e.creationPath])).toEqual([
      ["create_submit", "date", path],
      ["create_success", "date", path],
    ]);
  });

  test("시간 범위를 켠 채 만들면 지금처럼 시각을 보내고 표 유형은 time이다", async () => {
    createTable.mockResolvedValue({ success: true, data: { tableId: "time-table" } });
    mount(Page);
    submit(path);
    await waitFor(() => expect(createTable).toHaveBeenCalledTimes(1));
    const [, , startHour, endHour] = createTable.mock.calls[0];
    expect(startHour).toMatch(/^\d{2}:00$/);
    expect(endHour).toMatch(/^\d{2}:00$/);
    await waitFor(() => expect(sendEvent.mock.calls.some(([e]) => e.name === "create_success")).toBe(true));
    expect(sendEvent.mock.calls.find(([e]) => e.name === "create_success")[0].tableType).toBe("time");
  });
});

test("랜딩 확인 창은 날짜만이면 시간 범위를 '정하지 않음 · 날짜만 투표'로 보이고 시간 잠금을 두지 않는다", () => {
  mount(StartPage);
  fireEvent.click(screen.getByRole("switch", { name: "시간 범위 정하기" }));
  fireEvent.click(landingCta());
  const dialog = screen.getByRole("dialog", { name: "이대로 만들까요?" });
  expect(dialog).toHaveTextContent("정하지 않음");
  expect(dialog).toHaveTextContent("날짜만 투표");
  expect(dialog).not.toHaveTextContent("시간 잠금");
});

test("랜딩 미리보기는 날짜만이면 달력으로 바뀌고, 1위 날에 명단 안내를 둔다", () => {
  mount(StartPage);
  expect(screen.queryByText(/날짜만 고르는 표예요/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("switch", { name: "시간 범위 정하기" }));
  // 폼 달력에도 달 이름이 있어 미리보기 달 이름(문단)만 본다.
  expect(screen.getByText(/^\d{4}년 \d{1,2}월$/, { selector: "p" })).toBeInTheDocument();
  expect(screen.getByText("눌러서 명단 보기")).toBeInTheDocument();
  expect(screen.getByText(/날짜만 고르는 표예요/)).toBeInTheDocument();
  // 날짜를 누르면 달력 아래에 명단이 나오고 미리보기 직접 열기를 한 번 남긴다.
  fireEvent.click(screen.getAllByRole("button", { name: /가장 많이 모여요$/ })[0]);
  expect(screen.getByText("명 돼요")).toBeInTheDocument();
  expect(window.clarity).toHaveBeenCalledWith("event", "tt_landing_preview_open");
});
