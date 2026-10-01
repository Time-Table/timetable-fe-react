import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TimetablePage from "../TimetablePage";
import { getTableInfo } from "../../../api/table";
import { getAllSchedule, joinUser } from "../../../api/user";
import { addSchedule } from "../../../api/schedule";
import { getChating } from "../../../api/chat";
import { sendEvent } from "../../../api/event";
import { getTableAbState } from "../../../api/experiment";
import { TABLE_STATE_PREFIX, readTableState } from "../../../utils/tableSession";
import { fireConfetti } from "./confetti";

// 표 화면 엣지 케이스(2026-10-01, B를 실제 앱에 넣은 뒤 점검). 합성 자료와 가짜 API만 쓴다. 네트워크·DB 접근 없음.
const TABLE_B = "00000000-0000-4000-8000-000000000000"; // 명세 확인값: 칸 19 → B
const KEY = TABLE_STATE_PREFIX + TABLE_B;
const AFTER = "2026-09-10T00:00:00.000Z";

let mockTableId = TABLE_B;
jest.mock("react-router-dom", () => ({ ...jest.requireActual("react-router-dom"), useParams: () => ({ tableId: mockTableId }) }));
jest.mock("../../../api/table", () => ({ getTableInfo: jest.fn() }));
jest.mock("../../../api/user", () => ({ joinUser: jest.fn(), getAllSchedule: jest.fn(), getUserInfo: jest.fn(), deleteUser: jest.fn() }));
jest.mock("../../../api/schedule", () => ({ addSchedule: jest.fn(), getSchedule: jest.fn() }));
jest.mock("../../../api/chat", () => ({ getChating: jest.fn(), postChat: jest.fn() }));
jest.mock("../../../api/event", () => ({ sendEvent: jest.fn(), sendEventKeepalive: jest.fn() }));
jest.mock("../../../api/blogView", () => ({ sendBlogView: jest.fn() }));
jest.mock("../../../api/visit", () => ({ trackVisit: jest.fn() }));
jest.mock("../../../hooks/useMediaQuery", () => ({ useMediaQuery: () => false }));
jest.mock("../../../Seo", () => () => null);
jest.mock("../../../component/AdSense", () => ({ isReady }) => <div data-testid="ad" data-ready={String(isReady)} />);
jest.mock("../../../component/TimeGrid", () => () => null);
jest.mock("./confetti", () => ({ fireConfetti: jest.fn() }));
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

const baseTable = { tableId: TABLE_B, title: "모임", dates: ["2026-09-28"], startHour: "10:00", endHour: "12:00", banedCells: [], createdAt: AFTER };
const clarityEvents = () => window.clarity.mock.calls.filter(([kind]) => kind === "event").map(([, name]) => name);

const renderB = async ({ table = baseTable, users = [], me = null, usersResponse } = {}) => {
  mockTableId = TABLE_B;
  if (me) {
    localStorage.setItem("tableId", TABLE_B);
    localStorage.setItem("name", me);
  }
  getTableInfo.mockResolvedValue({ success: true, data: table });
  if (usersResponse) getAllSchedule.mockImplementation(usersResponse);
  else getAllSchedule.mockResolvedValue(users.length ? { success: true, code: 200, data: users } : { success: true, code: 201 });
  const view = render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TimetablePage />
    </MemoryRouter>,
  );
  return view;
};
const ready = async (title = "모임") => {
  await screen.findByRole("heading", { name: title });
  await waitFor(() => expect(readTableState(TABLE_B).weekKey).not.toBeNull());
  await act(async () => {
    await Promise.resolve();
  });
};

// 표 화면 A/B 2회차 확인값: table-ab-2 해시 칸 14 → B.
const B_VISITOR = "11111111-1111-4111-8111-111111111111";
beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.clarity = jest.fn();
  window.scrollTo = jest.fn();
  sendEvent.mockResolvedValue({ success: true });
  getChating.mockResolvedValue({ status: 201 });
  fireConfetti.mockReturnValue(false);
  // 표 화면 A/B 2회차: 실험 진행 중, 이 브라우저는 B 배정(visitorId 해시 칸 14).
  getTableAbState.mockResolvedValue({ ok: true, running: true, state: "running" });
  localStorage.setItem("visitor_id", B_VISITOR);
});

afterEach(() => {
  delete window.clarity;
  jest.useRealTimers();
});

test("참여자가 없으면 빈 안내를 보이고 골든·순위도 비어 있으며 광고는 준비 전이다", async () => {
  await renderB();
  await ready();
  expect(screen.getByText("아직 아무도 없어요. 첫 번째로 참여해 보세요!")).toBeInTheDocument();
  expect(screen.queryByText("눌러서 명단 보기")).not.toBeInTheDocument();
  expect(screen.getByTestId("ad")).toHaveAttribute("data-ready", "false");
  fireEvent.click(screen.getByRole("button", { name: "가장 많이 모이는 시간 보기" }));
  expect(screen.getByText("아직 겹치는 시간이 없어요. 첫 번째로 시간을 넣어 보세요.")).toBeInTheDocument();
});

test("하루짜리 표는 주 넘기기와 주 수가 없고 기간은 한 날짜다", async () => {
  await renderB({ users: [{ name: "민준", availableTimes: ["2026-09-28-10:00"] }] });
  await ready();
  expect(screen.getByLabelText("기간 9.28")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "다음 주" })).not.toBeInTheDocument();
  expect(screen.queryByText(/주$/)).not.toBeInTheDocument();
});

// 기존 화면(TimeGrid)과 같은 시 단위 규칙이다(명세 "테이블 A/B 공유 상태"의 칸 범위, 2026-09-30 결정: B를 운영 중인 A에 맞춤).
// 만들기 화면은 정각만 만들어 :30 표는 API로만 생긴다. 분 단위로 바꾸려면 A·B를 함께 바꾸는 별도 결정이 필요하다(Codex 재검증 2026-10-01 지적).
test("시작이 :30인 표는 :30 칸부터 그리고, 표 밖 칸에 저장된 시간은 세지 않는다", async () => {
  await renderB({
    table: { ...baseTable, startHour: "10:30", endHour: "11:00" },
    users: [{ name: "민준", availableTimes: ["2026-09-28-10:00", "2026-09-28-10:30"] }],
  });
  await ready();
  expect(screen.getByRole("button", { name: "9월 28일 (월) 10:30 · 1명 가능" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /10:00 · / })).not.toBeInTheDocument();
});

test("막은 칸은 명단 칸이 아니고, 가장 많은 인원·골든에서도 빠지며, 하루 칠하기도 건너뛴다", async () => {
  const table = { ...baseTable, banedCells: ["2026-09-28-11:00"] };
  const users = [
    { name: "민준", availableTimes: ["2026-09-28-10:00", "2026-09-28-11:00"] },
    { name: "서연", availableTimes: ["2026-09-28-11:00"] },
  ];
  await renderB({ table, users, me: "민준" });
  await ready();
  expect(screen.queryByRole("button", { name: /11:00 · 2명 가능/ })).not.toBeInTheDocument();
  expect(screen.getAllByLabelText("잠긴 시간").length).toBeGreaterThan(0);
  // 막은 칸을 빼면 가장 많은 인원은 1명이라 골든 안내가 없다.
  expect(screen.queryByText("눌러서 명단 보기")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기/ }));
  fireEvent.click(screen.getByRole("button", { name: "9월 28일 (월) 하루 전체 칠하기·지우기" }));
  // 하루 칠하기는 막은 11:00을 건너뛴다. 전에 저장해 둔 11:00은 기존 화면(내 일정)과 같게 건드리지 않는다.
  // 막은 칸을 나중에 정한 표에서만 생기는 경우이고, 저장할 때 정리하려면 A·B를 함께 바꾸는 별도 결정이다(Codex 재검증 2026-10-01 지적).
  expect(readTableState(TABLE_B).draft).toEqual(["2026-09-28-10:00", "2026-09-28-10:30", "2026-09-28-11:00", "2026-09-28-11:30"]);
});

test("참여자 30명: 칩 31개, 세 명 넘게 고르면 '첫 사람 외 N명 모두'로 줄인다", async () => {
  const users = Array.from({ length: 30 }, (_, i) => ({ name: `사람${i + 1}`, availableTimes: ["2026-09-28-10:00"] }));
  await renderB({ users });
  await ready();
  expect(within(screen.getByRole("group", { name: /^참여자/ })).getAllByRole("button")).toHaveLength(31);
  ["사람1", "사람2", "사람3", "사람4"].forEach((n) => fireEvent.click(screen.getByRole("button", { name: `${n}. 고르기` })));
  expect(screen.getByText("사람1 외 3명 모두")).toBeInTheDocument();
});

test("이름은 있는데 서버 목록에서 지워졌으면 내 시간 넣기가 이름을 지우고 참여 창을 연다", async () => {
  sessionStorage.setItem(KEY, JSON.stringify({ v: 1, name: "지운사람", editing: false, draft: ["2026-09-28-10:00"], weekKey: null, picks: [] }));
  await renderB({ users: [{ name: "민준", availableTimes: [] }], me: "지운사람" });
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "내 시간 넣기" }));
  expect(screen.getByRole("dialog", { name: "참여하기" })).toBeInTheDocument();
  expect(localStorage.getItem("name")).toBeNull();
  expect(readTableState(TABLE_B).draft).toBeNull();
});

test("참여자 목록을 처음부터 못 불러오면 안내와 다시 불러오기, 누르면 그린다", async () => {
  let calls = 0;
  await renderB({
    usersResponse: async () => {
      calls += 1;
      return calls === 1 ? undefined : { success: true, code: 200, data: [{ name: "민준", availableTimes: [] }] };
    },
  });
  fireEvent.click(await screen.findByRole("button", { name: "다시 불러오기" }));
  await ready();
  expect(screen.getByRole("button", { name: /^민준/ })).toBeInTheDocument();
});

test("1분 새로고침이 실패하면 한 번만 알리고 화면은 이전 자료 그대로다", async () => {
  jest.useFakeTimers();
  await renderB({ users: [{ name: "민준", availableTimes: ["2026-09-28-10:00"] }] });
  await act(async () => {
    await Promise.resolve();
  });
  await screen.findByRole("heading", { name: "모임" });
  getAllSchedule.mockResolvedValue(undefined);
  await act(async () => {
    jest.advanceTimersByTime(60000);
  });
  expect(await screen.findByText("새 정보를 불러오지 못했어요. 연결을 확인해 주세요.")).toBeInTheDocument();
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  await act(async () => {
    jest.advanceTimersByTime(60000);
  });
  expect(screen.queryByText("새 정보를 불러오지 못했어요. 연결을 확인해 주세요.")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^민준/ })).toBeInTheDocument();
});

test("참여 요청이 막히면(429·연결 끊김) 창에 알리고 참여 성공으로 세지 않는다", async () => {
  await renderB({ users: [{ name: "민준", availableTimes: [] }] });
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "내 시간 넣기" }));
  fireEvent.change(screen.getByRole("textbox", { name: "이름" }), { target: { value: "지우" } });
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "1" } });
  joinUser.mockResolvedValue(undefined);
  fireEvent.click(screen.getByRole("button", { name: "시간 고르기" }));
  expect(await screen.findByText("인터넷 연결을 확인하고 다시 해 주세요.")).toBeInTheDocument();
  joinUser.mockResolvedValue({ success: false, code: 429, message: "요청이 많아요." });
  fireEvent.click(screen.getByRole("button", { name: "시간 고르기" }));
  expect(await screen.findByText("요청이 많아요.")).toBeInTheDocument();
  const sent = sendEvent.mock.calls.map(([p]) => p.name);
  expect(sent.filter((n) => n === "join_submit")).toHaveLength(2);
  expect(sent).not.toContain("join_success");
  // 표 화면 A/B 2회차: 실패 이유를 화면(B)과 함께 남긴다.
  const fails = sendEvent.mock.calls.map(([p]) => p).filter((p) => p.name === "join_fail");
  expect(fails.map((p) => [p.reason, p.uiVersion])).toEqual([["network", "B"], ["rate_limited", "B"]]);
});

test("참여 입력 형식 오류·비밀번호 실패도 이유를 남기고, 성공은 새 참여/다시 들어옴을 붙인다", async () => {
  await renderB({ users: [{ name: "민준", availableTimes: [] }] });
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "내 시간 넣기" }));
  fireEvent.click(screen.getByRole("button", { name: "시간 고르기" }));
  expect(await screen.findByText("이름과 비밀번호를 모두 넣어 주세요.")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox", { name: "이름" }), { target: { value: "민준" } });
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "1" } });
  joinUser.mockResolvedValue({ success: false, code: 401 });
  fireEvent.click(screen.getByRole("button", { name: "시간 고르기" }));
  expect(await screen.findByText("비밀번호가 달라요. 처음 정한 비밀번호를 넣어 주세요.")).toBeInTheDocument();
  joinUser.mockResolvedValue({ success: true, code: 200, data: { name: "민준", availableTimes: [] } });
  fireEvent.click(screen.getByRole("button", { name: "시간 고르기" }));
  await waitFor(() => expect(sendEvent.mock.calls.some(([p]) => p.name === "join_success")).toBe(true));
  const events = sendEvent.mock.calls.map(([p]) => p);
  expect(events.filter((p) => p.name === "join_fail").map((p) => p.reason)).toEqual(["invalid_input", "wrong_password"]);
  expect(events.find((p) => p.name === "join_success")).toEqual(expect.objectContaining({ joinType: "returning", uiVersion: "B" }));
});

test("대화: 빈 글·공백은 못 보내고, 400자부터 남은 양, 500자에서 알린다", async () => {
  await renderB({ users: [{ name: "민준", availableTimes: [] }], me: "민준" });
  await ready();
  fireEvent.click(screen.getByRole("button", { name: /^대화/ }));
  const input = await screen.findByRole("textbox", { name: "메시지" });
  const send = screen.getByRole("button", { name: "보내기" });
  expect(send).toBeDisabled();
  fireEvent.change(input, { target: { value: "   " } });
  expect(send).toBeDisabled();
  fireEvent.change(input, { target: { value: "가".repeat(400) } });
  expect(screen.getByText("400 / 500")).toBeInTheDocument();
  fireEvent.change(input, { target: { value: "가".repeat(500) } });
  expect(screen.getByText("500자까지 쓸 수 있어요")).toBeInTheDocument();
  expect(input).toHaveAttribute("maxLength", "500");
});

test("주 넘기기는 처음·끝에서 막힌다", async () => {
  const table = { ...baseTable, dates: ["2026-09-28", "2026-10-05"] };
  await renderB({ table, users: [{ name: "민준", availableTimes: ["2026-09-28-10:00"] }] });
  await ready();
  expect(screen.getByRole("button", { name: "이전 주" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "다음 주" }));
  expect(screen.getByRole("button", { name: "다음 주" })).toBeDisabled();
  expect(clarityEvents().filter((n) => n === "tt_b_week_nav")).toHaveLength(1);
});

test("저장 단추를 연달아 눌러도 한 번만 보낸다", async () => {
  await renderB({ users: [{ name: "민준", availableTimes: [] }, { name: "서연", availableTimes: ["2026-09-28-10:00"] }], me: "민준" });
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "내 시간 넣기" }));
  fireEvent.click(screen.getByRole("button", { name: "9월 28일 (월) 하루 전체 칠하기·지우기" }));
  let resolve;
  addSchedule.mockReturnValue(new Promise((r) => { resolve = r; }));
  const save = screen.getByRole("button", { name: /^저장하기/ });
  fireEvent.click(save);
  fireEvent.click(save);
  expect(addSchedule).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve({ success: true, data: { userAvailableTimes: ["2026-09-28-10:00"] } });
  });
  expect(await screen.findByText("참여 가능한 시간을 저장했어요. 이제 모두가 볼 수 있어요.")).toBeInTheDocument();
  expect(sendEvent.mock.calls.filter(([p]) => p.name === "schedule_save")).toHaveLength(1);
});

test("동작 줄이기(폭죽 없음)면 첫 번째 사람 권유 창이 기다리지 않고 바로 뜬다", async () => {
  await renderB({ users: [{ name: "민준", availableTimes: [] }], me: "민준" });
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "내 시간 넣기" }));
  fireEvent.click(screen.getByRole("button", { name: "9월 28일 (월) 하루 전체 칠하기·지우기" }));
  addSchedule.mockResolvedValue({ success: true, data: { userAvailableTimes: ["2026-09-28-10:00"] } });
  fireEvent.click(screen.getByRole("button", { name: /^저장하기/ }));
  expect(await screen.findByRole("dialog", { name: "첫 번째로 시간을 넣었어요" }, { timeout: 300 })).toBeInTheDocument();
});

test("뒤로 가기로 돌아와 사파리가 페이지를 되살리면 바로 다시 불러온다", async () => {
  await renderB({ users: [{ name: "민준", availableTimes: [] }] });
  await ready();
  getAllSchedule.mockResolvedValue({ success: true, code: 200, data: [{ name: "민준", availableTimes: [] }, { name: "서연", availableTimes: [] }] });
  await act(async () => {
    window.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true }));
  });
  expect(await screen.findByRole("button", { name: /^서연/ })).toBeInTheDocument();
});

test("B에서 고른 사람·보던 주는 기존 화면으로 갔다 와도 그대로다", async () => {
  const table = { ...baseTable, dates: ["2026-09-28", "2026-10-05"] };
  const users = [
    { name: "민준", availableTimes: ["2026-09-28-10:00"] },
    { name: "서연", availableTimes: ["2026-10-05-10:00"] },
  ];
  await renderB({ table, users });
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "서연. 고르기" }));
  fireEvent.click(screen.getByRole("button", { name: "다음 주" }));
  fireEvent.click(screen.getByRole("button", { name: "다른 화면 보기" }));
  expect(await screen.findByRole("button", { name: /골든타임 순위/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "다른 화면 보기" }));
  expect(await screen.findByRole("button", { name: "서연. 빼기" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText(/^2 \/ 2주/)).toBeInTheDocument();
});
