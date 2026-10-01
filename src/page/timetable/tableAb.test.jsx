import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TimetablePage from "./TimetablePage";
import { getTableInfo } from "../../api/table";
import { getAllSchedule } from "../../api/user";
import { getChating } from "../../api/chat";
import { addSchedule } from "../../api/schedule";
import { sendEvent, sendEventKeepalive } from "../../api/event";
import { getTableAbState } from "../../api/experiment";
import { grantAdmin } from "../../utils/admin";
import { TABLE_UI_KEY } from "../../utils/storage";

// 표 화면 A/B 2회차(2026-10-01, 하네스 specs/table-ab-2.md). 합성 데이터와 mock API만 쓴다. 네트워크·DB 접근 없음.
// 브라우저 ID는 명세 확인값: V_A는 table-ab-2 칸 56(A), V_B는 칸 14(B).
const V_A = "00000000-0000-4000-8000-000000000000";
const V_B = "11111111-1111-4111-8111-111111111111";
const TABLE_1 = "313fcb21-583e-4e82-942c-713eeb3d607d";
const TABLE_2 = "22222222-2222-4222-8222-222222222222";
const RUNNING = { ok: true, running: true, state: "running" };

let mockTableId = TABLE_1;
jest.mock("react-router-dom", () => ({ ...jest.requireActual("react-router-dom"), useParams: () => ({ tableId: mockTableId }) }));
jest.mock("../../api/table", () => ({ getTableInfo: jest.fn() }));
jest.mock("../../api/user", () => ({ joinUser: jest.fn(), getAllSchedule: jest.fn() }));
jest.mock("../../api/schedule", () => ({ addSchedule: jest.fn(), getSchedule: jest.fn() }));
jest.mock("../../api/chat", () => ({ getChating: jest.fn(), postChat: jest.fn() }));
jest.mock("../../api/event", () => ({ sendEvent: jest.fn(), sendEventKeepalive: jest.fn() }));
jest.mock("../../api/blogView", () => ({ sendBlogView: jest.fn() }));
jest.mock("../../api/visit", () => ({ trackVisit: jest.fn() }));
// 휴대폰 배치(1024px 미만)로 그린다.
jest.mock("../../hooks/useMediaQuery", () => ({ useMediaQuery: () => false }));
jest.mock("../../Seo", () => () => null);
jest.mock("../../component/AdSense", () => () => null);
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
const sentEvents = (name) => sendEvent.mock.calls.map(([payload]) => payload).filter((payload) => payload.name === name);
const kept = (name) => sendEventKeepalive.mock.calls.map(([payload]) => payload).filter((payload) => payload.name === name);
const band = () => screen.queryByRole("region", { name: "화면 바꾸기" });

// ui는 처음 보일 화면이다. 새 화면(B)은 골든이 제목 옆 버튼이다.
const renderTable = async ({ tableId = TABLE_1, ui = "A" } = {}) => {
  mockTableId = tableId;
  getTableInfo.mockResolvedValue({
    success: true,
    data: { tableId, title: "표", dates: ["2026-09-28"], startHour: "09:00", endHour: "12:00", banedCells: [], createdAt: "2026-09-10T00:00:00.000Z" },
  });
  getAllSchedule.mockResolvedValue({ success: true, code: 200, data: users });
  const view = render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TimetablePage /></MemoryRouter>);
  if (ui === "B") {
    const ranking = await screen.findByRole("button", { name: /^가장 많이 모이는 시간/ });
    await waitFor(() => expect(getChating).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    return { ...view, ranking };
  }
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
  getTableAbState.mockResolvedValue({ ok: true, running: false, state: "off" });
});

afterEach(() => {
  delete window.clarity;
  jest.restoreAllMocks();
});

test("꺼져 있으면(서버 상태 off) 띠가 없고 실험 기록·화면 값이 없다", async () => {
  localStorage.setItem("visitor_id", V_B);
  const { ranking } = await renderTable();
  expect(band()).not.toBeInTheDocument();
  fireEvent.click(ranking);
  expect(sentEvents("ranking_open")[0]).not.toHaveProperty("uiVersion");
  expect(sentEvents("ui_view")).toHaveLength(0);
  expect(sentEvents("ab_state_fail")).toHaveLength(0);
});

test("상태를 못 받으면 이번 화면은 꺼짐(A)으로 그리고 ab_state_fail만 남긴다", async () => {
  localStorage.setItem("visitor_id", V_B);
  getTableAbState.mockResolvedValue({ ok: false, running: false, reason: "timeout" });
  await renderTable();
  expect(band()).not.toBeInTheDocument();
  await waitFor(() => expect(sentEvents("ab_state_fail")).toHaveLength(1));
  expect(sentEvents("ab_state_fail")[0]).toEqual(expect.objectContaining({ tableId: TABLE_1, reason: "timeout" }));
  expect(sentEvents("ui_view")).toHaveLength(0);
});

test("진행 중이면 브라우저 배정대로 그리고, 화면이 그려진 뒤 ui_view(구간 ID·탭 순번)를 남긴다", async () => {
  getTableAbState.mockResolvedValue(RUNNING);
  localStorage.setItem("visitor_id", V_A);
  await renderTable();
  expect(band()).toHaveTextContent("새 화면을 먼저 써 볼 수 있어요");
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(1));
  expect(sentEvents("ui_view")[0]).toEqual(expect.objectContaining({
    tableId: TABLE_1, uiVersion: "A", viewId: expect.any(String), tabId: expect.any(String), seq: expect.any(Number),
  }));
  expect(sentEvents("ui_view")[0]).not.toHaveProperty("source");
  // 기존 화면의 결과 카드는 다시 그릴 때 새로 만들어지므로 누를 때 다시 찾는다.
  fireEvent.click(screen.getByRole("button", { name: /골든타임 순위/ }));
  expect(sentEvents("ranking_open")[0]).toEqual(expect.objectContaining({ uiVersion: "A" }));
});

test.each([
  ["A", V_A],
  ["B", V_B],
])("%s: 참여자 자료를 받기 전 오류 화면만 보면 ui_view가 없고, 다시 불러와 그려진 뒤 한 번 남긴다", async (ui, visitor) => {
  getTableAbState.mockResolvedValue(RUNNING);
  localStorage.setItem("visitor_id", visitor);
  mockTableId = TABLE_1;
  getTableInfo.mockResolvedValue({
    success: true,
    data: { tableId: TABLE_1, title: "표", dates: ["2026-09-28"], startHour: "09:00", endHour: "12:00", banedCells: [], createdAt: "2026-09-10T00:00:00.000Z" },
  });
  getAllSchedule.mockResolvedValueOnce({ success: false, code: 500 });
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TimetablePage /></MemoryRouter>);
  const retry = await screen.findByRole("button", { name: "다시 불러오기" });
  // 화면 기록 효과가 다 돈 뒤에 본다(바로 보면 고치기 전 코드도 아직 보내기 전이라 통과한다).
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  expect(band()).toBeInTheDocument();
  expect(sentEvents("ui_view")).toHaveLength(0);
  getAllSchedule.mockResolvedValue({ success: true, code: 200, data: users });
  fireEvent.click(retry);
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(1));
  expect(sentEvents("ui_view")[0].uiVersion).toBe(ui);
  await act(async () => {
    await Promise.resolve();
  });
  expect(sentEvents("ui_view")).toHaveLength(1);
});

test("A에서 시간표 새로고침으로 표를 다시 불러와도 같은 화면이라 ui_view를 다시 남기지 않는다", async () => {
  getTableAbState.mockResolvedValue(RUNNING);
  localStorage.setItem("visitor_id", V_A);
  await renderTable();
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(1));
  const calls = getTableInfo.mock.calls.length;
  // 휴대폰 배치에서는 전체 시간표 창 안에 새로고침 단추가 있다.
  fireEvent.click(screen.getByRole("button", { name: /전체 시간표 보기/ }));
  fireEvent.click(await screen.findByRole("button", { name: "시간표 새로고침" }));
  await waitFor(() => expect(getTableInfo.mock.calls.length).toBeGreaterThan(calls));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  expect(sentEvents("ui_view")).toHaveLength(1);
});

test("B에서 저장 뒤 재조회가 실패한 채 A로 바꾸면 A는 오류 안내뿐이라 ui_view A를 남기지 않는다", async () => {
  getTableAbState.mockResolvedValue(RUNNING);
  localStorage.setItem("visitor_id", V_B);
  localStorage.setItem("tableId", TABLE_1);
  localStorage.setItem("name", "민준");
  await renderTable({ ui: "B" });
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(1));
  fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기/ }));
  fireEvent.click(screen.getByRole("button", { name: "9월 28일 (월) 하루 전체 칠하기·지우기" }));
  addSchedule.mockResolvedValue({ success: true, data: { userAvailableTimes: [] } });
  getAllSchedule.mockResolvedValue({ success: false, code: 500 });
  fireEvent.click(screen.getByRole("button", { name: /^저장하기/ }));
  await waitFor(() => expect(getAllSchedule.mock.calls.length).toBeGreaterThan(1));
  fireEvent.click(screen.getByRole("button", { name: "기존 화면으로" }));
  expect(await screen.findByText("참여자와 일정을 불러오지 못했습니다.")).toBeInTheDocument();
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  expect(sentEvents("ui_view").map((v) => v.uiVersion)).toEqual(["B"]);
  expect(sentEvents("ui_switch").map((v) => v.uiVersion)).toEqual(["A"]);
});

test("B 배정 브라우저는 새 화면을 그리고, 새 화면이 그려진 뒤 ui_view B를 남긴다", async () => {
  getTableAbState.mockResolvedValue(RUNNING);
  localStorage.setItem("visitor_id", V_B);
  await renderTable({ ui: "B" });
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(1));
  expect(sentEvents("ui_view")[0].uiVersion).toBe("B");
});

test("띠로 바꾸면 ui_switch(떠나는 화면) → 새 화면 ui_view 순서이고, 다른 표도 고른 화면으로 연다", async () => {
  getTableAbState.mockResolvedValue(RUNNING);
  localStorage.setItem("visitor_id", V_A);
  const { unmount } = await renderTable();
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(1));
  const firstView = sentEvents("ui_view")[0];
  fireEvent.click(screen.getByRole("button", { name: "새 화면 써 보기" }));
  await screen.findByRole("button", { name: /^가장 많이 모이는 시간/ });
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(2));
  const [switched] = sentEvents("ui_switch");
  expect(switched).toEqual(expect.objectContaining({ uiVersion: "B", viewId: firstView.viewId }));
  const secondView = sentEvents("ui_view")[1];
  expect(secondView.uiVersion).toBe("B");
  expect(secondView.viewId).not.toBe(firstView.viewId);
  expect(switched.seq < secondView.seq).toBe(true);
  expect(kept("ui_leave")).toHaveLength(0);
  expect(JSON.parse(localStorage.getItem(TABLE_UI_KEY))).toEqual({ key: "table-ab-2", ui: "B" });
  unmount();
  await act(async () => {
    await Promise.resolve();
  });
  // 다른 표로 옮겨도(표 범위 저장소를 비워도) 고른 화면이 남는다.
  await renderTable({ tableId: TABLE_2, ui: "B" });
  expect(screen.getByRole("button", { name: /^가장 많이 모이는 시간/ })).toBeInTheDocument();
});

test("다른 화면을 열어 봤다가 돌아오면 마지막 ui_view가 원래 화면이다(마감 때 유지한 화면)", async () => {
  getTableAbState.mockResolvedValue(RUNNING);
  localStorage.setItem("visitor_id", V_A);
  await renderTable();
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(1));
  fireEvent.click(screen.getByRole("button", { name: "새 화면 써 보기" }));
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(2));
  fireEvent.click(screen.getByRole("button", { name: "기존 화면으로" }));
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(3));
  expect(sentEvents("ui_view").map((v) => v.uiVersion)).toEqual(["A", "B", "A"]);
  expect(sentEvents("ui_switch").map((v) => v.uiVersion)).toEqual(["B", "A"]);
  expect(JSON.parse(localStorage.getItem(TABLE_UI_KEY))).toEqual({ key: "table-ab-2", ui: "A" });
  expect(sentEvents("ui_engaged")).toHaveLength(0);
});

test("띠 하트: 지금 화면에 ui_vote(vote), 다른 화면으로 옮기면 그 화면 vote, 다시 누르면 cancel. 다른 표에서도 표가 남는다", async () => {
  getTableAbState.mockResolvedValue(RUNNING);
  localStorage.setItem("visitor_id", V_A);
  const { unmount } = await renderTable();
  await waitFor(() => expect(sentEvents("ui_view")).toHaveLength(1));
  fireEvent.click(screen.getByRole("button", { name: "기존 화면 쪽에 투표" }));
  expect(screen.getByRole("status")).toHaveTextContent("기존 화면 쪽에 투표했어요!");
  fireEvent.click(screen.getByRole("button", { name: "새 화면 써 보기" }));
  await screen.findByRole("button", { name: /^가장 많이 모이는 시간/ });
  fireEvent.click(screen.getByRole("button", { name: "새 화면 쪽에 투표" }));
  fireEvent.click(screen.getByRole("button", { name: "새 화면 투표 취소" }));
  fireEvent.click(screen.getByRole("button", { name: "새 화면 쪽에 투표" }));
  expect(sentEvents("ui_vote").map((e) => [e.uiVersion, e.reason])).toEqual([
    ["A", "vote"], ["B", "vote"], ["B", "cancel"], ["B", "vote"],
  ]);
  expect(sentEvents("ui_vote")[0]).toEqual(expect.objectContaining({ tableId: TABLE_1, tabId: expect.any(String), seq: expect.any(Number) }));
  unmount();
  await act(async () => {
    await Promise.resolve();
  });
  await renderTable({ tableId: TABLE_2, ui: "B" });
  expect(screen.getByRole("button", { name: "새 화면 투표 취소" })).toHaveAttribute("aria-pressed", "true");
});

test("관리자 브라우저는 띠로 바꿀 수 있지만 실험 기록을 보내지 않는다", async () => {
  getTableAbState.mockResolvedValue(RUNNING);
  localStorage.setItem("visitor_id", V_A);
  grantAdmin("test-token");
  await renderTable();
  expect(band()).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "기존 화면 쪽에 투표" }));
  fireEvent.click(screen.getByRole("button", { name: "새 화면 써 보기" }));
  await screen.findByRole("button", { name: /^가장 많이 모이는 시간/ });
  expect(sendEvent).not.toHaveBeenCalled();
  expect(sendEventKeepalive).not.toHaveBeenCalled();
});

test("저장소 접근이 전부 막혀도 표 화면은 멈추지 않고 참여 화면(A)을 그리며 실험에서 빠진다", async () => {
  getTableAbState.mockResolvedValue(RUNNING);
  const blocked = () => {
    throw new Error("SecurityError");
  };
  ["getItem", "setItem", "removeItem", "clear", "key"].forEach((method) => jest.spyOn(Storage.prototype, method).mockImplementation(blocked));
  await renderTable();
  expect(screen.getByRole("button", { name: /참여|등록/ })).toBeInTheDocument();
  expect(band()).not.toBeInTheDocument();
  expect(sentEvents("ui_view")).toHaveLength(0);
});

test("저장소를 못 쓰는 브라우저는 실험에서 뺀다(A, 띠·기록 없음)", async () => {
  getTableAbState.mockResolvedValue(RUNNING);
  const original = Storage.prototype.getItem;
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(function getItem(key) {
    if (key === "visitor_id") throw new Error("blocked");
    return original.call(this, key);
  });
  await renderTable();
  expect(band()).not.toBeInTheDocument();
  expect(sentEvents("ui_view")).toHaveLength(0);
});
