import { StrictMode } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TimetablePage from "./TimetablePage";
import JoinForm from "./components/JoinForm";
import PersonalSchedule from "./components/PersonalSchedule";
import { getTableInfo } from "../../api/table";
import { joinUser } from "../../api/user";
import { addSchedule } from "../../api/schedule";
import { sendEvent } from "../../api/event";
import Swal from "sweetalert2";

// 합성 데이터와 mock API만 사용한다. 브라우저 탐색·실제 표 생성·DB 접근 없음.
let mockTableId = "313fcb21-583e-4e82-942c-713eeb3d607d";
jest.mock("react-router-dom", () => ({ ...jest.requireActual("react-router-dom"), useParams: () => ({ tableId: mockTableId }) }));
jest.mock("../../api/table", () => ({ getTableInfo: jest.fn() }));
jest.mock("../../api/user", () => ({ joinUser: jest.fn(), getAllSchedule: jest.fn() }));
jest.mock("../../api/schedule", () => ({ addSchedule: jest.fn(), getSchedule: jest.fn() }));
jest.mock("../../api/event", () => ({ sendEvent: jest.fn() }));
jest.mock("../../api/blogView", () => ({ sendBlogView: jest.fn() }));
jest.mock("../../api/visit", () => ({ trackVisit: jest.fn() }));
jest.mock("../../hooks/useMediaQuery", () => ({ useMediaQuery: () => true }));
jest.mock("../../Seo", () => () => null);
jest.mock("../../component/AdSense", () => () => null);
jest.mock("./components/DashboardPanel", () => () => null);
jest.mock("../../component/TimeGrid", () => ({ setSelectedCells }) => (
  <button onClick={() => setSelectedCells(["2026-09-25T09:00"])}>테스트 시간 선택</button>
));
jest.mock("sweetalert2", () => ({ fire: jest.fn(), mixin: () => ({ fire: jest.fn() }) }));
jest.mock("react-dom/test-utils", () => ({ ...jest.requireActual("react-dom/test-utils"), act: require("react").act }));
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

const wrap = (element) => <StrictMode><MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{element}</MemoryRouter></StrictMode>;

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  mockTableId = "313fcb21-583e-4e82-942c-713eeb3d607d";
  window.clarity = jest.fn();
  sendEvent.mockResolvedValue({ success: true, tableRole: "participant" });
  getTableInfo.mockResolvedValue({ status: 404 });
  Swal.fire.mockResolvedValue({});
});

afterEach(() => { delete window.clarity; });

test("StrictMode에서 표 방문 1회, 같은 컴포넌트의 표 ID 변경 시 새 표 방문도 기록한다", async () => {
  const view = render(wrap(<TimetablePage />));
  await waitFor(() => expect(window.clarity).toHaveBeenCalledWith("set", "tt_table_view_role", "participant"));
  expect(sendEvent.mock.calls.filter(([e]) => e.name === "table_view")).toHaveLength(1);
  mockTableId = "mock-only-second-table";
  view.rerender(wrap(<TimetablePage />));
  await screen.findByText("Table-Not Found");
  await waitFor(() => expect(getTableInfo).toHaveBeenCalledWith(mockTableId));
  expect(sendEvent.mock.calls.filter(([e]) => e.name === "table_view").map(([e]) => e.tableId))
    .toEqual(["313fcb21-583e-4e82-942c-713eeb3d607d", "mock-only-second-table"]);
});

test.each([200, 201, 401])("참여 API code %s: 성공 응답에서만 참여 역할 태그가 생긴다", async (code) => {
  let finish;
  joinUser.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  render(wrap(<JoinForm tableId={mockTableId} setName={jest.fn()} setRightScreen={jest.fn()} setSelectedToggle={jest.fn()} />));
  fireEvent.change(screen.getByPlaceholderText("이름을 입력해주세요."), { target: { value: "테스트" } });
  fireEvent.change(screen.getByPlaceholderText("비밀번호를 입력해주세요(1자리 이상)"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "참여 / 수정" }));
  expect(window.clarity).not.toHaveBeenCalledWith("event", "tt_join_success");
  await act(async () => { finish({ code, data: { name: "테스트" } }); });
  const expectedTags = code === 401 ? [] : [["set", "tt_join_success_role", "participant"]];
  expect(window.clarity.mock.calls.filter(([method]) => method === "set")).toEqual(expectedTags);
  expect(sendEvent.mock.calls.filter(([e]) => e.name === "join_success")).toHaveLength(code === 401 ? 0 : 1);
  expect(sessionStorage.getItem(`hasCompletedTimetableGuide:${mockTableId}`))
    .toBe(code === 401 ? null : "true");
});

test.each(["success", "failed-response", "rejected"])("일정 저장 %s: 실제 성공에서만 저장 역할을 기록한다", async (result) => {
  localStorage.setItem("name", "테스트");
  let finish, fail;
  addSchedule.mockImplementation(() => new Promise((resolve, reject) => { finish = resolve; fail = reject; }));
  render(wrap(<PersonalSchedule tableId={mockTableId} usersScheduleList={[]} dates={["2026-09-25"]} startHour="09:00" endHour="18:00" onSaveSuccess={jest.fn()} />));
  fireEvent.click(screen.getByRole("button", { name: "테스트 시간 선택" }));
  fireEvent.click(screen.getAllByRole("button", { name: "저장하기" })[0]);
  expect(window.clarity).not.toHaveBeenCalledWith("event", "tt_schedule_save");
  await act(async () => {
    if (result === "rejected") fail(new Error("offline"));
    else finish({ success: result === "success" });
  });
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: result === "success" ? "success" : "error" }));
  const expectedTags = result === "success" ? [["set", "tt_schedule_save_role", "participant"]] : [];
  expect(window.clarity.mock.calls.filter(([method]) => method === "set")).toEqual(expectedTags);
  expect(sendEvent.mock.calls.filter(([e]) => e.name === "schedule_save")).toHaveLength(result === "success" ? 1 : 0);
});
