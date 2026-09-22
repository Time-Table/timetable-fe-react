import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TimetablePage from "./TimetablePage";
import { getTableInfo } from "../../api/table";
import { getAllSchedule } from "../../api/user";
import { getSchedule } from "../../api/schedule";

// 실제 페이지의 조회·갱신 흐름을 검증한다. 모든 데이터는 합성이며 광고 요청과 DB 접근은 없다.
const TABLE_ID = "313fcb21-583e-4e82-942c-713eeb3d607d";
let mockIsDesktop = true;
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ tableId: "313fcb21-583e-4e82-942c-713eeb3d607d" }),
}));
jest.mock("../../api/table", () => ({ getTableInfo: jest.fn() }));
jest.mock("../../api/user", () => ({ getAllSchedule: jest.fn() }));
jest.mock("../../api/schedule", () => ({ getSchedule: jest.fn() }));
jest.mock("../../api/visit", () => ({ trackVisit: jest.fn() }));
jest.mock("../../utils/analytics", () => ({
  trackEvent: jest.fn(),
  EVENTS: { TABLE_VIEW: "table_view", RANKING_OPEN: "ranking_open", INVITE_SHARE: "invite_share" },
}));
jest.mock("../../hooks/useMediaQuery", () => ({ useMediaQuery: () => mockIsDesktop }));
jest.mock("../../Seo", () => () => null);
jest.mock("../../component/AdSense", () => ({ isReady }) => (
  isReady ? <div data-testid="eligible-ad">광고 표시 가능</div> : null
));
jest.mock("../NotFoundTable", () => () => <div>표를 불러올 수 없습니다</div>);
jest.mock("./components/InviteSection", () => () => null);
jest.mock("./components/GuideOverlay", () => () => null);
jest.mock("./components/DashboardPanel", () => () => null);
jest.mock("./components/GroupTimeGrid", () => ({ usersSchedule, onRefresh }) => (
  <>
    <div data-testid="member-count">{usersSchedule.length}</div>
    <button onClick={onRefresh}>전체 시간표 새로고침</button>
  </>
));
jest.mock("./components/TimeGridModal", () => () => null);
jest.mock("./components/RankingModal", () => () => null);
jest.mock("./components/JoinForm", () => ({ refreshData }) => (
  <button onClick={refreshData}>참여자 변경 후 갱신</button>
));
jest.mock("./components/PersonalSchedule", () => ({ onSaveSuccess }) => (
  <button onClick={onSaveSuccess}>일정 저장 후 갱신</button>
));
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
        initial, animate, exit, transition, whileHover, whileTap, ...props
      }, ref) => React.createElement(tag, { ...props, ref }));
      return components[tag];
    } }),
  };
});

const table = {
  tableId: TABLE_ID,
  title: "광고 조건 검증",
  dates: ["2026-09-22"],
  startHour: "09:00",
  endHour: "12:00",
  banedCells: [],
};
const members = [
  { name: "검증1", availableTimes: ["2026-09-22T10:00"] },
  { name: "검증2", availableTimes: ["2026-09-22T10:00"] },
];
const aggregate = [{ time: "2026-09-22T10:00", count: 2, colorNumber: 10, members: ["검증1", "검증2"] }];
const usersResponse = (data) => ({ success: true, code: 200, data });
const renderPage = () => render(
  <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <TimetablePage />
  </MemoryRouter>,
);
// 동기 render/fireEvent 이후 mock API의 Promise에 따른 상태 갱신까지 기다린다.
const settleRequests = () => act(async () => { await Promise.resolve(); });
const renderSettledPage = async () => {
  renderPage();
  await settleRequests();
};

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  mockIsDesktop = true;
  getTableInfo.mockResolvedValue({ success: true, data: table });
  getAllSchedule.mockResolvedValue(usersResponse(members));
  getSchedule.mockResolvedValue(aggregate);
});

test.each([true, false])("정상 일정표는 광고를 유지한다 (데스크탑: %s)", async (isDesktop) => {
  mockIsDesktop = isDesktop;
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
});

test("참여자 2명 중 1명만 시간을 저장해도 유효한 집계가 있으면 광고를 유지한다", async () => {
  getAllSchedule.mockResolvedValue(usersResponse([members[0], { ...members[1], availableTimes: [] }]));
  getSchedule.mockResolvedValue([{ ...aggregate[0], count: 1, members: ["검증1"] }]);
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
});

test("count와 members가 없는 기존 집계 형식도 광고를 유지한다", async () => {
  getSchedule.mockResolvedValue([{ time: "2026-09-22T10:00", colorNumber: 100 }]);
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
});

test.each([
  ["참여자 없음", { success: true, code: 201 }],
  ["참여자 1명", usersResponse([members[0]])],
  ["2명 모두 입력 전", usersResponse(members.map((member) => ({ ...member, availableTimes: [] })))],
  ["참여자 조회 500", { success: false, message: "서버 오류" }],
  ["참여자 응답 없음", undefined],
])("%s이면 이전 집계 데이터가 있어도 광고를 표시하지 않는다", async (_, response) => {
  getAllSchedule.mockResolvedValue(response);
  await renderSettledPage();
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
});

test.each([
  ["표 조회 500", { status: 500, data: { success: false, message: "서버 오류" } }],
  ["표 응답 없음", undefined],
])("%s이면 광고를 표시하지 않는다", async (_, response) => {
  getTableInfo.mockResolvedValue(response);
  await renderSettledPage();
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
});

test.each([
  ["빈 집계", []],
  ["집계 조회 500", { success: false, message: "서버 오류" }],
  ["집계 응답 없음", undefined],
])("%s이면 참여자가 2명이어도 광고를 표시하지 않는다", async (_, response) => {
  getSchedule.mockResolvedValue(response);
  await renderSettledPage();
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
});

test("참여자 조회가 끝나기 전에는 광고를 표시하지 않는다", async () => {
  let resolveMembers;
  getAllSchedule.mockImplementation(() => new Promise((resolve) => { resolveMembers = resolve; }));
  renderPage();
  await waitFor(() => expect(getAllSchedule).toHaveBeenCalledWith(TABLE_ID));
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
  await act(async () => { resolveMembers(usersResponse(members)); });
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
});

test.each([
  ["참여 취소 후 201 빈 응답", { success: true, code: 201 }],
  ["참여자 조회 실패", { success: false, message: "서버 오류" }],
  ["참여자 응답 없음", undefined],
])("%s 갱신 시 이전 인원과 광고가 남지 않는다", async (_, response) => {
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
  expect(screen.getByTestId("member-count")).toHaveTextContent("2");
  getAllSchedule.mockResolvedValue(response);
  fireEvent.click(screen.getByRole("button", { name: "참여자 변경 후 갱신" }));
  await settleRequests();
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
  expect(screen.getByTestId("member-count")).toHaveTextContent("0");
});

test("일정 저장 후 집계 조회 실패 시 이전 광고를 숨기고, 정상 재조회 후 복구한다", async () => {
  localStorage.setItem("tableId", TABLE_ID);
  localStorage.setItem("name", members[0].name);
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
  getSchedule.mockResolvedValue(undefined);
  fireEvent.click(screen.getByRole("button", { name: "일정 저장 후 갱신" }));
  await settleRequests();
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
  getSchedule.mockResolvedValue(aggregate);
  fireEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
  await settleRequests();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
});

test("일정 저장 후 재조회가 진행 중이면 이전 광고를 숨긴다", async () => {
  localStorage.setItem("tableId", TABLE_ID);
  localStorage.setItem("name", members[0].name);
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
  let resolveAggregate;
  getSchedule.mockImplementation(() => new Promise((resolve) => { resolveAggregate = resolve; }));
  fireEvent.click(screen.getByRole("button", { name: "일정 저장 후 갱신" }));
  await settleRequests();
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
  await act(async () => { resolveAggregate(aggregate); });
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
});

test("전체 시간표 새로고침에서 표 조회가 실패하면 광고를 숨기고 재시도로 복구한다", async () => {
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
  getTableInfo.mockResolvedValue({ status: 500, data: { success: false, message: "서버 오류" } });
  fireEvent.click(screen.getByRole("button", { name: "전체 시간표 새로고침" }));
  await settleRequests();
  expect(screen.getByRole("alert")).toHaveTextContent("표 정보를 불러오지 못했습니다.");
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
  getTableInfo.mockResolvedValue({ success: true, data: table });
  fireEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
  await settleRequests();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
});

test("늦게 도착한 이전 집계 응답이 최신 빈 목록과 광고 차단을 되돌리지 않는다", async () => {
  localStorage.setItem("tableId", TABLE_ID);
  localStorage.setItem("name", members[0].name);
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();

  let resolvePreviousAggregate;
  getSchedule.mockImplementationOnce(() => new Promise((resolve) => { resolvePreviousAggregate = resolve; }));
  fireEvent.click(screen.getByRole("button", { name: "일정 저장 후 갱신" }));
  await settleRequests();
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();

  getAllSchedule.mockResolvedValue({ success: true, code: 201 });
  getSchedule.mockResolvedValue([]);
  fireEvent.click(screen.getByRole("button", { name: "전체 시간표 새로고침" }));
  await settleRequests();
  expect(screen.getByTestId("member-count")).toHaveTextContent("0");
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();

  await act(async () => { resolvePreviousAggregate(aggregate); });
  expect(screen.getByTestId("member-count")).toHaveTextContent("0");
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
});
