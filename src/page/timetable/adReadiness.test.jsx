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
  // 표 유형 계측(2026-10-09)
  setActiveTableType: jest.fn(),
  getActiveTableType: jest.fn(),
  tagTableType: jest.fn(),
  EVENTS: { TABLE_VIEW: "table_view", RANKING_OPEN: "ranking_open", INVITE_SHARE: "invite_share" },
}));
jest.mock("../../hooks/useMediaQuery", () => ({ useMediaQuery: () => mockIsDesktop }));
jest.mock("../../Seo", () => () => null);
jest.mock("../../component/AdSense", () => ({ isReady }) => (
  isReady ? <div data-testid="eligible-ad">광고 표시 가능</div> : null
));
jest.mock("../NotFoundTable", () => () => <div>표를 불러올 수 없습니다</div>);
jest.mock("./components/InviteSection", () => () => null);
jest.mock("./components/DashboardPanel", () => () => null);
jest.mock("./components/GroupTimeGrid", () => ({ usersSchedule, startHour, endHour, onRefresh, timeInfo }) => (
  <>
    <div data-testid="member-count">{usersSchedule.length}</div>
    <div data-testid="table-hours">{startHour}-{endHour}</div>
    <div data-testid="cells">{(timeInfo || []).map((item) => `${item.time}:${item.count}`).join(",")}</div>
    <button onClick={onRefresh}>전체 시간표 새로고침</button>
  </>
));
jest.mock("./components/TimeGridModal", () => () => null);
jest.mock("./components/RankingModal", () => () => null);
jest.mock("./components/JoinForm", () => ({ refreshData }) => (
  <button onClick={refreshData}>참여자 변경 후 갱신</button>
));
jest.mock("./components/PersonalSchedule", () => ({ onSaveSuccess }) => (
  <button onClick={() => onSaveSuccess({ name: "검증1", availableTimes: ["2026-09-22-10:00", "2026-09-22-10:30"] })}>
    일정 저장 후 갱신
  </button>
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
// 칸 형식은 실제와 같은 YYYY-MM-DD-HH:MM이다(전에는 "2026-09-22T10:00"을 썼다).
const members = [
  { name: "검증1", availableTimes: ["2026-09-22-10:00"] },
  { name: "검증2", availableTimes: ["2026-09-22-10:00"] },
];
const saved = [
  { name: "검증1", availableTimes: ["2026-09-22-10:00", "2026-09-22-10:30"] },
  members[1],
];
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
});

test.each([true, false])("정상 일정표는 광고를 유지한다 (데스크탑: %s)", async (isDesktop) => {
  mockIsDesktop = isDesktop;
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
});

test("참여자 2명 중 1명만 시간을 저장해도 칠할 칸이 있으면 광고를 유지한다", async () => {
  getAllSchedule.mockResolvedValue(usersResponse([members[0], { ...members[1], availableTimes: [] }]));
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
});

test("서버 집계(GET /api/schedules)는 부르지 않고 참여자 목록으로 칸과 광고 조건을 본다", async () => {
  // 새 화면과 같은 자료를 쓴다. 집계는 명단 없이 저장될 수 있어 두 화면이 달라졌다(Codex 재검증 2026-09-30).
  await renderSettledPage();
  expect(getSchedule).not.toHaveBeenCalled();
  expect(screen.getByTestId("cells")).toHaveTextContent("2026-09-22-10:00:2");
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
});

test.each([
  ["참여자 없음", { success: true, code: 201 }],
  ["참여자 1명", usersResponse([members[0]])],
  ["2명 모두 입력 전", usersResponse(members.map((member) => ({ ...member, availableTimes: [] })))],
  ["참여자 조회 500", { success: false, message: "서버 오류" }],
  ["참여자 응답 없음", undefined],
])("%s이면 광고를 표시하지 않는다", async (_, response) => {
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
  ["참여자 시간이 모두 표 날짜 밖", ["2026-12-31-10:00"], []],
  ["참여자 시간이 모두 표 시간 밖", ["2026-09-22-15:00"], []],
  ["참여자 시간이 모두 막은 칸", ["2026-09-22-10:00"], ["2026-09-22-10:00"]],
])("%s이면 참여자가 2명이어도 칠할 칸이 없어 광고를 표시하지 않는다", async (_, times, banedCells) => {
  getTableInfo.mockResolvedValue({ success: true, data: { ...table, banedCells } });
  getAllSchedule.mockResolvedValue(usersResponse(members.map((member) => ({ ...member, availableTimes: times }))));
  await renderSettledPage();
  expect(screen.getByTestId("cells")).toHaveTextContent(/^$/);
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

test("참여 후에는 관리자가 수정했을 수 있는 표 시간도 다시 가져온다", async () => {
  await renderSettledPage();
  const tableReads = getTableInfo.mock.calls.length;
  const memberReads = getAllSchedule.mock.calls.length;
  getTableInfo.mockResolvedValue({ success: true, data: { ...table, startHour: "10:00", endHour: "13:00" } });

  fireEvent.click(screen.getByRole("button", { name: "참여자 변경 후 갱신" }));
  await settleRequests();

  expect(getTableInfo).toHaveBeenCalledTimes(tableReads + 1);
  expect(getAllSchedule).toHaveBeenCalledTimes(memberReads + 1);
  expect(getSchedule).not.toHaveBeenCalled();
  expect(screen.getByTestId("table-hours")).toHaveTextContent("10:00-13:00");
  expect(screen.getByTestId("member-count")).toHaveTextContent("2");
});

test("일정 저장 후 참여자 재조회가 실패하면 광고는 숨기되 확인된 저장 시간과 인원은 남기고, 다시 불러오면 복구한다", async () => {
  // Codex 계획 검토(2026-09-30): 전에는 재조회가 실패하면 목록을 비워 방금 저장한 시간이 사라졌다(새 화면은 남긴다).
  localStorage.setItem("tableId", TABLE_ID);
  localStorage.setItem("name", members[0].name);
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
  getAllSchedule.mockResolvedValue(undefined);
  fireEvent.click(screen.getByRole("button", { name: "일정 저장 후 갱신" }));
  await settleRequests();
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
  expect(screen.getByTestId("member-count")).toHaveTextContent("2");
  expect(screen.getByTestId("cells")).toHaveTextContent("2026-09-22-10:00:2,2026-09-22-10:30:1");
  // 다시 불러오기가 또 실패해도 확인된 값은 남는다.
  fireEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
  await settleRequests();
  expect(screen.getByTestId("cells")).toHaveTextContent("2026-09-22-10:30:1");
  getAllSchedule.mockResolvedValue(usersResponse(saved));
  fireEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
  await settleRequests();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
  expect(screen.getByTestId("cells")).toHaveTextContent("2026-09-22-10:00:2,2026-09-22-10:30:1");
});

test("일정 저장 후 재조회가 진행 중이면 광고를 숨기고, 그동안에도 확인된 저장 시간을 보인다", async () => {
  localStorage.setItem("tableId", TABLE_ID);
  localStorage.setItem("name", members[0].name);
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();
  let resolveMembers;
  getAllSchedule.mockImplementation(() => new Promise((resolve) => { resolveMembers = resolve; }));
  fireEvent.click(screen.getByRole("button", { name: "일정 저장 후 갱신" }));
  await settleRequests();
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
  expect(screen.getByTestId("cells")).toHaveTextContent("2026-09-22-10:30:1");
  await act(async () => { resolveMembers(usersResponse(saved)); });
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

test("늦게 도착한 이전 참여자 응답이 최신 빈 목록과 광고 차단을 되돌리지 않는다", async () => {
  localStorage.setItem("tableId", TABLE_ID);
  localStorage.setItem("name", members[0].name);
  await renderSettledPage();
  expect(screen.getByTestId("eligible-ad")).toBeInTheDocument();

  let resolvePreviousMembers;
  getAllSchedule.mockImplementationOnce(() => new Promise((resolve) => { resolvePreviousMembers = resolve; }));
  fireEvent.click(screen.getByRole("button", { name: "일정 저장 후 갱신" }));
  await settleRequests();
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();

  getAllSchedule.mockResolvedValue({ success: true, code: 201 });
  fireEvent.click(screen.getByRole("button", { name: "전체 시간표 새로고침" }));
  await settleRequests();
  expect(screen.getByTestId("member-count")).toHaveTextContent("0");
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();

  await act(async () => { resolvePreviousMembers(usersResponse(saved)); });
  expect(screen.getByTestId("member-count")).toHaveTextContent("0");
  expect(screen.getByTestId("cells")).toHaveTextContent(/^$/);
  expect(screen.queryByTestId("eligible-ad")).not.toBeInTheDocument();
});
