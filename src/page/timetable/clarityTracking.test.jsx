import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Swal from "sweetalert2";
import TimetablePage from "./TimetablePage";
import GroupTimeGrid from "./components/GroupTimeGrid";
import RankingList from "./components/RankingList";
import DashboardPanel from "./components/DashboardPanel";
import PersonalSchedule from "./components/PersonalSchedule";
import { getTableInfo } from "../../api/table";
import { getAllSchedule } from "../../api/user";
import { addSchedule, getSchedule } from "../../api/schedule";
import { getChating, postChat } from "../../api/chat";
import { sendEvent } from "../../api/event";

// 표 화면의 Clarity 보조 이벤트(2026-09-29). 합성 데이터와 mock API만 쓴다. 네트워크·DB 접근 없음.
const TABLE_ID = "313fcb21-583e-4e82-942c-713eeb3d607d";
jest.mock("react-router-dom", () => ({ ...jest.requireActual("react-router-dom"), useParams: () => ({ tableId: TABLE_ID }) }));
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
// 가이드는 1초 뒤에 떠서 테스트 길이에 따라 이벤트 순서가 흔들린다. 가이드 계측은 GuideOverlay.test.jsx가 본다.
jest.mock("./components/GuideOverlay", () => () => null);
// 칸 누르기와 시간 고르기만 흉내 낸다. 실제 격자 동작은 TimeGrid.test.jsx가 본다.
// 시간 칸 버튼은 TimeGrid처럼 이미 고른 칸이면 해제, 아니면 추가하는 갱신 함수를 넘긴다.
jest.mock("../../component/TimeGrid", () => ({ onCellClick, selectedCells = [], setSelectedCells }) => {
  const toggle = (cellKey) => {
    const action = selectedCells.includes(cellKey) ? "deselect" : "select";
    setSelectedCells((prev) => {
      if (action === "select") return prev.includes(cellKey) ? prev : [...prev, cellKey];
      return prev.includes(cellKey) ? prev.filter((cell) => cell !== cellKey) : prev;
    });
  };
  return (
    <div>
      {onCellClick && (
        <>
          <button type="button" onClick={(e) => onCellClick({ _id: "cell-1", time: "2026-09-28-10:00", count: 2, members: ["민준", "서연"] }, e)}>사람 있는 칸</button>
          <button type="button" onClick={(e) => onCellClick(null, e)}>빈 칸</button>
        </>
      )}
      {setSelectedCells && ["10:00", "11:00"].map((time) => (
        <button key={time} type="button" aria-pressed={selectedCells.includes(`2026-09-28-${time}`)}
          onClick={() => toggle(`2026-09-28-${time}`)}>{time} 칸</button>
      ))}
    </div>
  );
});
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

const clarityEvents = () => window.clarity.mock.calls.filter(([method]) => method === "event").map(([, name]) => name);
// 표 화면에 들어오면 서버 이벤트 table_view가 Clarity에도 가므로 흐름 비교에서는 뺀다.
const tableEvents = () => clarityEvents().filter((name) => name !== "tt_table_view");
const serverEvents = () => sendEvent.mock.calls.map(([event]) => event.name);
const users = [
  { name: "민준", availableTimes: ["2026-09-28-10:00"] },
  { name: "서연", availableTimes: ["2026-09-28-10:00"] },
];

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.clarity = jest.fn();
  sendEvent.mockResolvedValue({ success: true });
  // 채팅이 없는 표는 201과 함께 안내 말풍선을 보여 준다(DashboardPanel fetchData).
  getChating.mockResolvedValue({ status: 201 });
});

afterEach(() => { delete window.clarity; });

const renderPersonalSchedule = () => render(
  <PersonalSchedule tableId={TABLE_ID} usersScheduleList={users} dates={["2026-09-28"]} startHour="09:00"
    endHour="12:00" onSaveSuccess={jest.fn()} />,
);

// 휴대폰 표 화면을 그리고 데이터가 들어와 "전체 시간표 보기"가 켜질 때까지 기다린다.
const renderTablePage = async () => {
  getTableInfo.mockResolvedValue({
    success: true,
    data: { tableId: TABLE_ID, title: "표", dates: ["2026-09-28"], startHour: "09:00", endHour: "12:00", banedCells: [] },
  });
  getAllSchedule.mockResolvedValue({ success: true, code: 200, data: users });
  getSchedule.mockResolvedValue([{ time: "2026-09-28-10:00", count: 2, members: ["민준", "서연"], _id: "s1" }]);
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TimetablePage /></MemoryRouter>);
  const openButton = await screen.findByRole("button", { name: /전체 시간표 보기/ });
  await waitFor(() => expect(openButton).toBeEnabled());
};

test("전체 시간표: 사람 있는 칸은 명단 열기, 빈 칸은 따로, 드롭다운에서 한 사람 고르기를 남긴다", () => {
  const setSelectedName = jest.fn();
  render(
    <GroupTimeGrid title="표" dates={["2026-09-28"]} startHour="09:00" endHour="12:00" timeInfo={[]}
      selectedName={null} setSelectedName={setSelectedName} usersSchedule={users} tableId={TABLE_ID} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "사람 있는 칸" }));
  fireEvent.click(screen.getByRole("button", { name: "빈 칸" }));
  fireEvent.click(screen.getByRole("button", { name: /전체 참여자/ }));
  fireEvent.click(screen.getByText("서연"));
  expect(clarityEvents()).toEqual(["tt_timetable_cell", "tt_timetable_cell_empty", "tt_timetable_member_filter"]);
  expect(setSelectedName).toHaveBeenCalledWith("서연");
});

test("순위: 항목을 펼칠 때만, 안의 이름은 고를 때만 남긴다", () => {
  const setSelectedName = jest.fn();
  render(
    <RankingList timeInfo={[{ time: "2026-09-28-10:00", count: 2, members: ["민준", "서연"] }]}
      selectedName={null} setSelectedName={setSelectedName} usersCount={2} setRightScreen={jest.fn()} />,
  );
  const block = screen.getByText(/10:00 ~ 10:30/);
  fireEvent.click(block);
  fireEvent.click(screen.getByRole("button", { name: "민준" }));
  fireEvent.click(block); // 접기는 남기지 않는다
  expect(clarityEvents()).toEqual(["tt_ranking_expand", "tt_ranking_member_view"]);
});

test("인원: 참여자 칩으로 그 사람 보기, 채팅 보내기 성공을 남긴다", async () => {
  postChat.mockResolvedValue({ success: true });
  // 보낸 뒤 다시 불러오면 방금 쓴 말이 보인다.
  getChating
    .mockResolvedValueOnce({ status: 201 })
    .mockResolvedValueOnce({ status: 200, data: [{ name: "민준", message: "안녕" }] });
  const setSelectedName = jest.fn();
  render(
    <DashboardPanel tableId={TABLE_ID} name="민준" setRightScreen={jest.fn()} setSelectedName={setSelectedName}
      usersSchedule={users} selectedName={null} />,
  );
  await screen.findByText("공지사항이나 의견을 자유롭게 공유해 보세요.");
  fireEvent.click(screen.getByRole("button", { name: "서연" }));
  const input = screen.getByPlaceholderText("메시지를 입력하세요...");
  fireEvent.change(input, { target: { value: "안녕" } });
  fireEvent.keyDown(input, { key: "Enter" });
  await screen.findByText("안녕");
  expect(clarityEvents()).toEqual(["tt_member_view", "tt_chat_send"]);
  expect(postChat).toHaveBeenCalledWith(TABLE_ID, "민준", "안녕");
});

test("인원: 채팅 보내기가 실패하면 남기지 않는다", async () => {
  postChat.mockResolvedValue({ success: false });
  render(
    <DashboardPanel tableId={TABLE_ID} name="민준" setRightScreen={jest.fn()} setSelectedName={jest.fn()}
      usersSchedule={users} selectedName={null} />,
  );
  await screen.findByText("공지사항이나 의견을 자유롭게 공유해 보세요.");
  const input = screen.getByPlaceholderText("메시지를 입력하세요...");
  fireEvent.change(input, { target: { value: "안녕" } });
  fireEvent.keyDown(input, { key: "Enter" });
  await waitFor(() => expect(postChat).toHaveBeenCalled());
  expect(input).toHaveValue("안녕"); // 실패하면 입력은 그대로 남는다
  expect(clarityEvents()).toEqual([]);
});

test("내 일정: 시간을 처음 더한 순간만 화면을 열 때마다 1회 남긴다", () => {
  localStorage.setItem("name", "민준");
  const view = renderPersonalSchedule();
  fireEvent.click(screen.getByRole("button", { name: "11:00 칸" })); // 더하기
  fireEvent.click(screen.getByRole("button", { name: "11:00 칸" })); // 해제
  fireEvent.click(screen.getByRole("button", { name: "11:00 칸" })); // 다시 더하기
  expect(clarityEvents()).toEqual(["tt_schedule_select"]);
  view.unmount();

  renderPersonalSchedule();
  fireEvent.click(screen.getByRole("button", { name: "11:00 칸" }));
  expect(clarityEvents()).toEqual(["tt_schedule_select", "tt_schedule_select"]);
});

test("내 일정: 저장된 시간을 해제만 하면 남기지 않고, 되돌려 다시 고르면 그때 남긴다", () => {
  localStorage.setItem("name", "민준");
  renderPersonalSchedule();
  const savedCell = screen.getByRole("button", { name: "10:00 칸" });
  expect(savedCell).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(savedCell); // 해제
  expect(savedCell).toHaveAttribute("aria-pressed", "false");
  expect(clarityEvents()).toEqual([]);

  fireEvent.click(savedCell); // 되돌리기(다시 고르기)
  expect(savedCell).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "11:00 칸" }));
  expect(clarityEvents()).toEqual(["tt_schedule_select"]);
});

test("내 일정: 켜진 저장 버튼을 누르면 서버 결과와 무관하게 1회씩, 성공은 따로 남긴다", async () => {
  localStorage.setItem("name", "민준");
  addSchedule
    .mockResolvedValueOnce({ success: false })
    .mockRejectedValueOnce(new Error("network"))
    .mockResolvedValueOnce({ success: true });
  renderPersonalSchedule();
  const [topSave, bottomSave] = screen.getAllByRole("button", { name: "저장하기" });

  // 바뀐 시간이 없으면 버튼이 꺼져 있어 누를 수 없다.
  expect(topSave).toBeDisabled();
  fireEvent.click(topSave);
  expect(clarityEvents()).toEqual([]);

  fireEvent.click(screen.getByRole("button", { name: "11:00 칸" }));
  fireEvent.click(topSave); // 서버가 실패로 답함
  await waitFor(() => expect(Swal.fire).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(bottomSave).toBeEnabled());
  fireEvent.click(bottomSave); // 네트워크 오류
  await waitFor(() => expect(Swal.fire).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(topSave).toBeEnabled());
  expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: "error", title: "저장에 실패했습니다." }));
  expect(clarityEvents()).toEqual(["tt_schedule_select", "tt_schedule_save_click", "tt_schedule_save_click"]);

  fireEvent.click(topSave); // 성공
  await waitFor(() => expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: "success" })));
  expect(clarityEvents()).toEqual([
    "tt_schedule_select", "tt_schedule_save_click", "tt_schedule_save_click", "tt_schedule_save_click", "tt_schedule_save",
  ]);
  expect(addSchedule).toHaveBeenCalledTimes(3);
  expect(serverEvents()).toEqual(["schedule_save"]);
});

test("휴대폰 표 화면: 초대 복사, 전체 시간표 열기, 인원, 팁 접기·펼치기를 남긴다", async () => {
  let recordedAtCopy;
  const writeText = jest.fn(() => {
    recordedAtCopy = { clarity: clarityEvents(), server: serverEvents() };
    return Promise.resolve();
  });
  Object.assign(navigator, { clipboard: { writeText } });
  await renderTablePage();

  fireEvent.click(screen.getByRole("button", { name: "복사하기" }));
  const openButton = screen.getByRole("button", { name: /전체 시간표 보기/ });
  fireEvent.click(openButton);
  fireEvent.click(openButton); // 열린 모달 뒤에서 한 번 더 불려도 다시 세지 않는다
  fireEvent.click(screen.getByText(/^인원/));
  // 인원 화면이 채팅을 불러와 그릴 때까지 기다린다.
  await screen.findByText("공지사항이나 의견을 자유롭게 공유해 보세요.");
  const tipsHeader = screen.getByText(/모임 시간 조율을 위한 팁/);
  fireEvent.click(tipsHeader); // 처음에는 펼쳐져 있다
  fireEvent.click(tipsHeader);

  expect(tableEvents()).toEqual(["tt_invite_share_table", "tt_timetable_open", "tt_members_open", "tt_tips_close", "tt_tips_open"]);
  // 복사 시도는 클립보드를 부르기 전에 서버·Clarity 모두 남아 있다.
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(recordedAtCopy.clarity).toContain("tt_invite_share_table");
  expect(recordedAtCopy.server).toContain("invite_share");
  // 서버의 invite_share는 그대로 1회 간다.
  expect(serverEvents().filter((name) => name === "invite_share")).toHaveLength(1);
});

test("휴대폰 표 화면: 클립보드 호출이 바로 예외를 던져도 복사 시도는 남는다", async () => {
  // 예외는 React가 브라우저에 알리므로 콘솔 오류 출력만 막는다.
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  const swallow = (event) => event.preventDefault();
  window.addEventListener("error", swallow);
  Object.assign(navigator, { clipboard: { writeText: jest.fn(() => { throw new Error("clipboard blocked"); }) } });
  try {
    await renderTablePage();
    fireEvent.click(screen.getByRole("button", { name: "복사하기" }));
    expect(tableEvents()).toEqual(["tt_invite_share_table"]);
    expect(serverEvents().filter((name) => name === "invite_share")).toHaveLength(1);
    // 사용자에게 보이는 동작은 전과 같다(복사됨 표시가 뜨지 않는다).
    expect(screen.getByRole("button", { name: "복사하기" })).toBeInTheDocument();
  } finally {
    window.removeEventListener("error", swallow);
    consoleError.mockRestore();
  }
});

test("휴대폰 전체 시간표 열기: 버튼은 닫혔다 열릴 때마다 센다", async () => {
  await renderTablePage();
  fireEvent.click(screen.getByRole("button", { name: /전체 시간표 보기/ }));
  fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
  expect(screen.queryByRole("button", { name: "Close modal" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /전체 시간표 보기/ }));
  expect(tableEvents()).toEqual(["tt_timetable_open", "tt_timetable_open"]);
});

test("휴대폰 전체 시간표 열기: 인원 화면 참여자 칩·전체 칩으로 열 때도 닫힘에서 열림만 센다", async () => {
  await renderTablePage();
  fireEvent.click(screen.getByText(/^인원/));
  await screen.findByText("공지사항이나 의견을 자유롭게 공유해 보세요.");

  fireEvent.click(screen.getByRole("button", { name: "서연" }));
  // 모달이 열린 채로 다른 칩이 눌리면 그 사람 보기만 남고 모달 열림은 다시 세지 않는다.
  fireEvent.click(screen.getByRole("button", { name: "민준" }));
  fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
  fireEvent.click(screen.getByRole("button", { name: "전체" }));
  expect(screen.getByRole("button", { name: "Close modal" })).toBeInTheDocument();

  expect(tableEvents()).toEqual([
    "tt_members_open", "tt_member_view", "tt_timetable_open", "tt_member_view", "tt_timetable_open",
  ]);
});

test("휴대폰 전체 시간표 열기: 골든타임 순위 안 이름으로 열 때도 센다", async () => {
  await renderTablePage();
  fireEvent.click(screen.getByRole("button", { name: /골든타임 순위/ }));
  fireEvent.click(screen.getByText(/10:00 ~ 10:30/));
  fireEvent.click(screen.getByRole("button", { name: "민준" }));
  // 순위 창은 닫히고 전체 시간표 모달이 열린다.
  expect(screen.queryByRole("button", { name: "닫기" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Close modal" })).toBeInTheDocument();
  expect(tableEvents()).toEqual(["tt_ranking_open", "tt_ranking_expand", "tt_ranking_member_view", "tt_timetable_open"]);
});
