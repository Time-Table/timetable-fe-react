import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TimetablePage from "./TimetablePage";
import { getTableInfo } from "../../api/table";
import { getAllSchedule } from "../../api/user";
import { getSchedule } from "../../api/schedule";
import { getChating } from "../../api/chat";
import { sendEvent } from "../../api/event";
import { TABLE_AB } from "../../utils/tableExperiment";
import { trackEvent, EVENTS } from "../../utils/analytics";
import { grantAdmin } from "../../utils/admin";
import { TABLE_UI_KEY } from "../../utils/storage";

// 테이블 A/B 1회차 전환 띠(2026-09-29). 합성 데이터와 mock API만 쓴다. 네트워크·DB 접근 없음.
// 표 ID는 명세 확인값: TABLE_A는 칸 79(A), TABLE_B는 칸 19(B).
const TABLE_A = "313fcb21-583e-4e82-942c-713eeb3d607d";
const TABLE_B = "00000000-0000-4000-8000-000000000000";
const START = "2026-09-01T00:00:00+09:00";
const AFTER = "2026-09-10T00:00:00.000Z";
const BEFORE = "2026-08-01T00:00:00.000Z";

let mockTableId = TABLE_A;
jest.mock("react-router-dom", () => ({ ...jest.requireActual("react-router-dom"), useParams: () => ({ tableId: mockTableId }) }));
jest.mock("../../api/table", () => ({ getTableInfo: jest.fn() }));
jest.mock("../../api/user", () => ({ joinUser: jest.fn(), getAllSchedule: jest.fn() }));
jest.mock("../../api/schedule", () => ({ addSchedule: jest.fn(), getSchedule: jest.fn() }));
jest.mock("../../api/chat", () => ({ getChating: jest.fn(), postChat: jest.fn() }));
jest.mock("../../api/event", () => ({ sendEvent: jest.fn() }));
jest.mock("../../api/blogView", () => ({ sendBlogView: jest.fn() }));
jest.mock("../../api/visit", () => ({ trackVisit: jest.fn() }));
// 휴대폰 배치(1024px 미만)로 그린다.
jest.mock("../../hooks/useMediaQuery", () => ({ useMediaQuery: () => false }));
jest.mock("../../Seo", () => () => null);
jest.mock("../../component/AdSense", () => () => null);
jest.mock("./components/GuideOverlay", () => () => null);
jest.mock("../../component/TimeGrid", () => () => null);
jest.mock("sweetalert2", () => ({ fire: jest.fn(), mixin: () => ({ fire: jest.fn() }) }));
jest.mock("react-dom/test-utils", () => ({ ...jest.requireActual("react-dom/test-utils"), act: require("react").act }));
jest.mock("framer-motion", () => {
  const React = require("react");
  const components = {};
  return {
    AnimatePresence: ({ children }) => children,
    motion: new Proxy({}, { get: (_, tag) => {
      if (!components[tag]) components[tag] = React.forwardRef(({
        initial, animate, exit, transition, whileHover, whileTap, currentStepPosition, arrowLeft, ...props
      }, ref) => React.createElement(tag, { ...props, ref }));
      return components[tag];
    } }),
  };
});

const users = [
  { name: "민준", availableTimes: ["2026-09-28-10:00"] },
  { name: "서연", availableTimes: ["2026-09-28-10:00"] },
];
const originalStart = TABLE_AB.startAt;
const sentEvents = (name) => sendEvent.mock.calls.map(([payload]) => payload).filter((payload) => payload.name === name);
const band = () => screen.queryByRole("region", { name: "화면 바꾸기" });

const renderTable = async ({ tableId = TABLE_A, createdAt = AFTER } = {}) => {
  mockTableId = tableId;
  getTableInfo.mockResolvedValue({
    success: true,
    data: { tableId, title: "표", dates: ["2026-09-28"], startHour: "09:00", endHour: "12:00", banedCells: [], createdAt },
  });
  getAllSchedule.mockResolvedValue({ success: true, code: 200, data: users });
  getSchedule.mockResolvedValue([{ time: "2026-09-28-10:00", count: 2, members: ["민준", "서연"], _id: "s1" }]);
  const view = render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TimetablePage /></MemoryRouter>);
  const ranking = await screen.findByRole("button", { name: /골든타임 순위/ });
  await waitFor(() => expect(screen.getByRole("button", { name: /전체 시간표 보기/ })).toBeEnabled());
  return { ...view, ranking };
};

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.clarity = jest.fn();
  sendEvent.mockResolvedValue({ success: true });
  getChating.mockResolvedValue({ status: 201 });
  TABLE_AB.startAt = START;
});

afterEach(() => {
  TABLE_AB.startAt = originalStart;
  delete window.clarity;
});

test("꺼져 있으면(운영 기본값) 띠가 없고 이벤트에 화면을 붙이지 않는다", async () => {
  TABLE_AB.startAt = "";
  const { ranking } = await renderTable();
  expect(band()).not.toBeInTheDocument();
  fireEvent.click(ranking);
  expect(sentEvents("ranking_open")[0]).not.toHaveProperty("uiVersion");
  expect(window.clarity).not.toHaveBeenCalledWith("set", "tt_table_ui", expect.anything());
});

test("켜져 있으면 배정대로 띠를 보이고, 누르면 바꾼 화면을 남기고 이후 이벤트에 붙인다", async () => {
  await renderTable({ tableId: TABLE_A });
  expect(band()).toHaveTextContent("새 화면을 먼저 써 볼 수 있어요");
  await waitFor(() => expect(window.clarity).toHaveBeenCalledWith("set", "tt_table_ui", "A"));
  // 표 정보를 받기 전에 남기는 table_view에는 화면이 없다(서버가 배정으로 되살린다).
  expect(sentEvents("table_view")[0]).not.toHaveProperty("uiVersion");

  fireEvent.click(screen.getByRole("button", { name: "새 화면 써 보기" }));
  expect(band()).toHaveTextContent("새 화면을 쓰는 중이에요");
  expect(screen.getByRole("status")).toHaveTextContent("새 화면으로 바꿨어요.");
  expect(sentEvents("ui_switch")).toEqual([expect.objectContaining({ tableId: TABLE_A, uiVersion: "B" })]);
  expect(JSON.parse(localStorage.getItem(TABLE_UI_KEY))).toEqual({ [TABLE_A]: "B" });
  expect(window.clarity).toHaveBeenCalledWith("event", "tt_ui_switch_b");
  expect(window.clarity).toHaveBeenLastCalledWith("set", "tt_table_ui", "B");

  fireEvent.click(screen.getByRole("button", { name: /골든타임 순위/ }));
  expect(sentEvents("ranking_open")[0]).toEqual(expect.objectContaining({ uiVersion: "B" }));

  fireEvent.click(screen.getByRole("button", { name: "기존 화면으로" }));
  expect(band()).toHaveTextContent("새 화면을 먼저 써 볼 수 있어요");
  expect(sentEvents("ui_switch")[1]).toEqual(expect.objectContaining({ uiVersion: "A" }));
});

test("B로 배정된 표는 처음부터 새 화면이고, 고른 적이 있으면 그 선택을 쓴다", async () => {
  const view = await renderTable({ tableId: TABLE_B });
  expect(band()).toHaveTextContent("새 화면을 쓰는 중이에요");
  view.unmount();

  localStorage.setItem(TABLE_UI_KEY, JSON.stringify({ [TABLE_B]: "A" }));
  await renderTable({ tableId: TABLE_B });
  expect(band()).toHaveTextContent("새 화면을 먼저 써 볼 수 있어요");
});

test("실험 시작 전에 만든 표는 B 칸이어도 기존 화면으로 시작한다", async () => {
  await renderTable({ tableId: TABLE_B, createdAt: BEFORE });
  expect(band()).toHaveTextContent("새 화면을 먼저 써 볼 수 있어요");
});

test("표 화면을 떠나면 그 표의 화면 값을 비운다", async () => {
  const view = await renderTable({ tableId: TABLE_B });
  // 열려 있는 동안에는 그 표의 이벤트에 화면이 붙는다.
  await waitFor(() => {
    trackEvent(EVENTS.RANKING_OPEN, TABLE_B);
    expect(sendEvent).toHaveBeenLastCalledWith(expect.objectContaining({ name: "ranking_open", uiVersion: "B" }));
  });
  view.unmount();
  sendEvent.mockClear();
  trackEvent(EVENTS.RANKING_OPEN, TABLE_B);
  expect(sentEvents("ranking_open")[0]).not.toHaveProperty("uiVersion");
});

test("표를 못 찾으면 띠가 없다", async () => {
  mockTableId = TABLE_A;
  getTableInfo.mockResolvedValue({ status: 404 });
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TimetablePage /></MemoryRouter>);
  await waitFor(() => expect(getTableInfo).toHaveBeenCalled());
  await waitFor(() => expect(screen.queryByText("테이블 정보를 불러오는 중입니다...")).not.toBeInTheDocument());
  expect(band()).not.toBeInTheDocument();
});

test("관리자는 띠가 보이고 바꿀 수 있지만 서버·Clarity 기록은 나가지 않는다", async () => {
  grantAdmin("admin-token");
  await renderTable({ tableId: TABLE_A });
  fireEvent.click(screen.getByRole("button", { name: "새 화면 써 보기" }));
  expect(band()).toHaveTextContent("새 화면을 쓰는 중이에요");
  expect(sendEvent).not.toHaveBeenCalled();
  expect(window.clarity).not.toHaveBeenCalled();
});
