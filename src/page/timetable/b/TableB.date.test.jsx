import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TimetablePage from "../TimetablePage";
import { getTableInfo } from "../../../api/table";
import { getAllSchedule } from "../../../api/user";
import { addSchedule } from "../../../api/schedule";
import { getChating } from "../../../api/chat";
import { sendEvent } from "../../../api/event";
import { getTableAbState } from "../../../api/experiment";
import { getActiveTableType } from "../../../utils/analytics";
import { TABLE_STATE_PREFIX, readTableState } from "../../../utils/tableSession";
import { fireConfetti } from "./confetti";

// 날짜 투표 표(2026-10-09 사람 결정): 시작·끝 시각이 없는 표는 실험과 관계없이 늘 새 화면이고 달력을 그린다.
// 합성 자료와 가짜 API만 쓴다. 네트워크·DB 접근 없음.
const TABLE_ID = "date-vote-table";
const AFTER = "2026-09-10T00:00:00.000Z";

let mockTableId = TABLE_ID;
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
jest.mock("../../../component/AdSense", () => () => null);
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

// 10/20(화)·10/21(수)·10/23(금) 후보. 시작·끝 시각 없음.
const TABLE = { tableId: TABLE_ID, title: "동아리 회식", dates: ["2026-10-20", "2026-10-21", "2026-10-23"], banedCells: [], createdAt: AFTER };
const USERS = [
  { name: "민준", availableTimes: ["2026-10-21", "2026-10-23"] },
  { name: "서연", availableTimes: ["2026-10-21"] },
  { name: "지호", availableTimes: [] },
];
const B_VISITOR = "11111111-1111-4111-8111-111111111111";
const sent = (name) => sendEvent.mock.calls.map(([payload]) => payload).filter((payload) => payload.name === name);
// eslint-disable-next-line testing-library/no-node-access
const cellAt = (key) => document.body.querySelector(`[data-key="${key}"]`);
const placeCells = () =>
  jest.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ top: 300, bottom: 354, left: 100, right: 150, width: 50, height: 54, x: 100, y: 300 });

const renderDate = async ({ users = USERS, me = null, table = TABLE } = {}) => {
  mockTableId = table.tableId;
  if (me) {
    localStorage.setItem("tableId", table.tableId);
    localStorage.setItem("name", me);
  }
  getTableInfo.mockResolvedValue({ success: true, data: table });
  getAllSchedule.mockResolvedValue({ success: true, code: 200, data: users });
  const view = render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TimetablePage />
    </MemoryRouter>,
  );
  await screen.findByRole("heading", { name: table.title });
  // 첫 그리기 뒤의 효과(고른 사람 되살리기 → 공유 상태에 남기기)가 다 돈 다음에 누른다(TableB.test.jsx와 같은 이유).
  // 날짜 투표 표는 보던 주가 없어 고른 사람 기록이 남는 것으로 기다린다.
  await waitFor(() => expect(JSON.parse(sessionStorage.getItem(TABLE_STATE_PREFIX + table.tableId) || "{}")).toHaveProperty("picks"));
  await act(async () => {
    await Promise.resolve();
  });
  return view;
};

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.clarity = jest.fn();
  window.scrollTo = jest.fn();
  sendEvent.mockResolvedValue({ success: true });
  getChating.mockResolvedValue({ status: 201 });
  fireConfetti.mockReturnValue(false);
  getTableAbState.mockResolvedValue({ ok: true, running: false, state: "off" });
  localStorage.setItem("visitor_id", B_VISITOR);
});

afterEach(() => {
  delete window.clarity;
  jest.restoreAllMocks();
});

describe("날짜 투표 표는 늘 새 화면", () => {
  test("실험이 꺼져 있어도 새 화면 달력을 그리고, 띠·화면 기록 없이 표 유형만 남긴다", async () => {
    await renderDate();
    expect(screen.getByRole("heading", { name: "2026년 10월" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "화면 바꾸기" })).not.toBeInTheDocument();
    // 1위 카드: 21일(2명). 후보가 아닌 22일은 비활성.
    expect(screen.getByRole("button", { name: "가장 많이 모이는 날 10월 21일 (수), 2명 가능. 명단 보기" })).toBeInTheDocument();
    expect(cellAt("2026-10-21")).toHaveAttribute("aria-label", "10월 21일 (수) · 2명 가능, 가장 많이 모여요");
    expect(screen.getByLabelText("10월 22일, 후보 아님")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "내 날짜 넣기" })).toBeInTheDocument();
    expect(screen.queryByText(/주 ·/)).not.toBeInTheDocument();
    expect(sent("ui_view")).toHaveLength(0);
    expect(window.clarity).toHaveBeenCalledWith("set", "tt_table_type", "date");
    expect(window.clarity).not.toHaveBeenCalledWith("set", "tt_table_ui", expect.anything());
    expect(getActiveTableType()).toEqual({ tableId: TABLE_ID, type: "date" });
  });

  test("실험이 켜져 있어도 배정과 관계없이 띠·uiVersion 없이 그린다(실험 대상 아님)", async () => {
    getTableAbState.mockResolvedValue({ ok: true, running: true, state: "running" });
    await renderDate();
    expect(screen.queryByRole("region", { name: "화면 바꾸기" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /가장 많이 모이는 날 10월 21일 \(수\), 3명 중 2명\. 순위 보기/ }));
    const ranking = sent("ranking_open");
    expect(ranking).toHaveLength(1);
    expect(ranking[0]).not.toHaveProperty("uiVersion");
    expect(ranking[0].tableType).toBe("date");
    expect(sent("ui_view")).toHaveLength(0);
    // 순위 창: 1위 21일 2명, 2위 23일 1명.
    const sheet = screen.getByRole("dialog", { name: "가장 많이 모이는 날" });
    const rows = within(sheet).getAllByRole("button", { name: /위 / });
    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
      "1위 10월 21일 (수), 3명 중 2명 가능. 달력에서 보기",
      "2위 10월 23일 (금), 3명 중 1명 가능. 달력에서 보기",
    ]);
  });

  test("여러 달이면 달마다 달력 한 장", async () => {
    await renderDate({ table: { ...TABLE, tableId: "multi-month", dates: ["2026-10-30", "2026-11-02", "2026-12-01"] } });
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["2026년 10월", "2026년 11월", "2026년 12월"]);
  });
});

describe("명단 창", () => {
  test("날짜를 누르면 되는 사람(나 맨 앞, 🙆‍♂️·나)과 안 되는 사람(아직 안 넣음)을 보인다", async () => {
    placeCells();
    await renderDate({ me: "서연" });
    expect(cellAt("2026-10-21")).toHaveAttribute("aria-label", "10월 21일 (수) · 2명 가능, 가장 많이 모여요, 나도 돼요");
    fireEvent.click(cellAt("2026-10-21"));
    const pop = await screen.findByRole("dialog", { name: "이 날 참여 명단" });
    const names = within(pop).getAllByText(/민준|서연|지호/).map((el) => el.textContent);
    expect(names[0]).toContain("서연");
    expect(names[0]).toContain("나");
    expect(within(pop).getByText("아직 안 넣음")).toBeInTheDocument();
    expect(cellAt("2026-10-21")).toHaveClass("open");
    expect(window.clarity).toHaveBeenCalledWith("event", "tt_timetable_cell");
  });
});

describe("내 날짜 고르기", () => {
  test("누르면 고르기·다시 누르면 지움, 요일 글자는 그 달 그 요일 전부, 저장하면 날짜 값으로 보낸다", async () => {
    await renderDate({ me: "민준" });
    fireEvent.click(screen.getByRole("button", { name: "내 날짜 고치기, 지금 2일" }));
    expect(screen.getByText("민준 님의 날짜")).toBeInTheDocument();
    expect(screen.getByText(/되는 날을 누르면 고르기/)).toBeInTheDocument();
    expect(cellAt("2026-10-21")).toHaveAttribute("aria-pressed", "true");
    // 21일 지우고 20일 고르기
    fireEvent.click(cellAt("2026-10-21"));
    fireEvent.click(cellAt("2026-10-20"));
    expect(cellAt("2026-10-21")).toHaveAttribute("aria-pressed", "false");
    expect(cellAt("2026-10-20")).toHaveAttribute("aria-pressed", "true");
    // 금요일 글자: 그 달 금요일 후보(23일)를 지운다(이미 골라져 있어서).
    fireEvent.click(screen.getByRole("button", { name: "2026년 10월 금요일 전부 고르기·지우기" }));
    expect(cellAt("2026-10-23")).toHaveAttribute("aria-pressed", "false");
    // 후보 아닌 날은 누를 수 없다(단추가 아니다).
    expect(cellAt("2026-10-22")).toBeNull();
    expect(screen.getByRole("button", { name: "저장하기, 1일" })).toBeInTheDocument();

    addSchedule.mockResolvedValue({ success: true, data: { userAvailableTimes: ["2026-10-20"] } });
    getAllSchedule.mockResolvedValue({ success: true, code: 200, data: [{ ...USERS[0], availableTimes: ["2026-10-20"] }, USERS[1], USERS[2]] });
    fireEvent.click(screen.getByRole("button", { name: "저장하기, 1일" }));
    await waitFor(() => expect(addSchedule).toHaveBeenCalledWith(TABLE_ID, "민준", ["2026-10-20"]));
    expect(await screen.findByText("고친 날짜를 저장했어요!")).toBeInTheDocument();
    const saves = sent("schedule_save");
    expect(saves).toHaveLength(1);
    expect(saves[0].tableType).toBe("date");
    expect(saves[0]).not.toHaveProperty("uiVersion");
  });

  test("처음 저장하면 '날짜를 저장했어요'로 알린다(조사 '을' 아님)", async () => {
    await renderDate({ me: "지호" });
    fireEvent.click(screen.getByRole("button", { name: "내 날짜 넣기" }));
    fireEvent.click(cellAt("2026-10-20"));
    addSchedule.mockResolvedValue({ success: true, data: { userAvailableTimes: ["2026-10-20"] } });
    getAllSchedule.mockResolvedValue({ success: true, code: 200, data: [USERS[0], USERS[1], { ...USERS[2], availableTimes: ["2026-10-20"] }] });
    fireEvent.click(screen.getByRole("button", { name: "저장하기, 1일" }));
    expect(await screen.findByText("참여 가능한 날짜를 저장했어요. 이제 모두가 볼 수 있어요.")).toHaveClass("pop");
    expect(screen.queryByText(/날짜을/)).not.toBeInTheDocument();
  });

  test("저장이 실패하면 실험 밖이어도 실패 기록을 남긴다", async () => {
    await renderDate({ me: "민준" });
    fireEvent.click(screen.getByRole("button", { name: "내 날짜 고치기, 지금 2일" }));
    fireEvent.click(cellAt("2026-10-20"));
    addSchedule.mockResolvedValue({ success: false });
    fireEvent.click(screen.getByRole("button", { name: "저장하기, 3일" }));
    await waitFor(() => expect(sent("save_fail")).toHaveLength(1));
    expect(sent("save_fail")[0]).toEqual(expect.objectContaining({ tableType: "date", reason: expect.any(String) }));
    expect(sent("save_fail")[0]).not.toHaveProperty("uiVersion");
  });
});

describe("사람 고르기·실험 상태·명단 순서(Codex 1차 반영)", () => {
  test("여러 명을 고르면 날짜로 '모두 되는 날'만 보이고 시간 표 문구는 없다", async () => {
    await renderDate();
    fireEvent.click(screen.getByRole("button", { name: /^민준\. 고르기/ }));
    fireEvent.click(screen.getByRole("button", { name: /^서연\. 고르기/ }));
    expect(screen.getByRole("button", { name: "민준·서연 모두 되는 날 10월 21일 (수), 모두 1일. 달력에서 보기" })).toBeInTheDocument();
    expect(screen.queryByText("모두 되는 시간이 아직 없어요")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^지호, 아직 날짜를 안 넣음\. 고르기/ }));
    expect(screen.getByText("모두 되는 날이 아직 없어요")).toBeInTheDocument();
    expect(screen.queryByText("모두 되는 시간이 아직 없어요")).not.toBeInTheDocument();
  });

  test("실험 상태를 못 받아도 날짜 투표 표는 상태 실패 기록을 남기지 않는다(시간 표는 남긴다)", async () => {
    getTableAbState.mockResolvedValue({ ok: false, running: false, reason: "timeout" });
    const view = await renderDate();
    await act(async () => {
      await Promise.resolve();
    });
    expect(sent("ab_state_fail")).toHaveLength(0);
    view.unmount();
    await renderDate({
      table: { tableId: "time-table", title: "시간 표", dates: ["2026-10-20"], startHour: "10:00", endHour: "12:00", banedCells: [], createdAt: AFTER },
      users: [],
    });
    await waitFor(() => expect(sent("ab_state_fail")).toHaveLength(1));
  });

  test("명단 창에서 안 되는 사람 목록도 나를 맨 앞에 둔다(🙆‍♂️는 붙이지 않는다)", async () => {
    placeCells();
    // 10/20은 아무도 안 된다: 원래 순서는 민준·서연·지호, 내가 지호면 지호가 맨 앞.
    await renderDate({ me: "지호" });
    fireEvent.click(cellAt("2026-10-20"));
    const pop = await screen.findByRole("dialog", { name: "이 날 참여 명단" });
    expect(within(pop).getByText("없음")).toBeInTheDocument();
    const order = within(pop)
      .getAllByText(/^(민준|서연|지호)/)
      .map((el) => el.textContent);
    expect(order.map((t) => t.slice(0, 2))).toEqual(["지호", "민준", "서연"]);
    expect(order[0]).toContain("나");
    expect(pop.textContent).not.toContain("🙆");
  });
});

test("날짜 투표 표에 남은 시간 칸·후보 밖 값은 내 날짜로 세지 않고, 저장하면 빠진다(Codex 2차 반영)", async () => {
  await renderDate({
    me: "민준",
    users: [{ name: "민준", availableTimes: ["2026-10-21", "2026-10-21-09:00", "2026-10-25"] }, ...USERS.slice(1)],
  });
  fireEvent.click(screen.getByRole("button", { name: "내 날짜 고치기, 지금 1일" }));
  expect(screen.getByRole("button", { name: "저장하기, 1일" })).toBeInTheDocument();
  fireEvent.click(cellAt("2026-10-20"));
  addSchedule.mockResolvedValue({ success: true, data: { userAvailableTimes: ["2026-10-20", "2026-10-21"] } });
  fireEvent.click(screen.getByRole("button", { name: "저장하기, 2일" }));
  await waitFor(() => expect(addSchedule).toHaveBeenCalledWith(TABLE_ID, "민준", ["2026-10-20", "2026-10-21"]));
});

describe("끌어서 여러 날 고르기(2026-10-10)", () => {
  // jsdom에는 좌표로 칸을 찾는 elementFromPoint가 없다. 손가락·마우스가 지금 올라가 있는 칸을 직접 정한다.
  let over = null;
  const originalFromPoint = document.elementFromPoint;
  beforeEach(() => {
    over = null;
    document.elementFromPoint = () => over;
  });
  afterEach(() => {
    document.elementFromPoint = originalFromPoint;
  });
  const pressed = (key) => cellAt(key).getAttribute("aria-pressed");
  const nextTick = () => act(() => new Promise((done) => setTimeout(done, 0)));
  const touch = (el, type, x, y) => {
    const ev = new Event(type, { bubbles: true, cancelable: true });
    const list = type === "touchend" || type === "touchcancel" ? [] : [{ clientX: x, clientY: y }];
    Object.defineProperty(ev, "touches", { value: list });
    Object.defineProperty(ev, "changedTouches", { value: [{ clientX: x, clientY: y }] });
    act(() => {
      el.dispatchEvent(ev);
    });
    return ev;
  };
  const startEdit = async (me) => {
    await renderDate({ me });
    fireEvent.click(screen.getByRole("button", { name: me === "지호" ? "내 날짜 넣기" : /^내 날짜 고치기/ }));
  };

  test("마우스: 빈 날에서 누른 채 끌면 지나간 후보 날을 모두 고르고, 후보 아닌 날은 건너뛰며, 끌기 뒤 click은 두 번 바꾸지 않는다", async () => {
    await startEdit("지호");
    fireEvent.pointerDown(cellAt("2026-10-20"));
    over = screen.getByLabelText("10월 22일, 후보 아님");
    fireEvent.pointerMove(cellAt("2026-10-20"));
    over = cellAt("2026-10-23");
    fireEvent.pointerMove(cellAt("2026-10-20"));
    fireEvent.pointerUp(cellAt("2026-10-23"));
    // 손을 뗀 칸에 브라우저가 click을 보낸다. 끌기로 이미 골랐으니 지우면 안 된다.
    fireEvent.click(cellAt("2026-10-23"), { detail: 1 });
    expect(pressed("2026-10-20")).toBe("true");
    expect(pressed("2026-10-21")).toBe("false");
    expect(pressed("2026-10-23")).toBe("true");
    expect(screen.getByRole("button", { name: "저장하기, 2일" })).toBeInTheDocument();
    expect(readTableState(TABLE_ID).draft).toEqual(["2026-10-20", "2026-10-23"]);
    // 그 뒤 키보드(Enter·Space) click은 그대로 한 칸을 바꾼다.
    await nextTick();
    fireEvent.click(cellAt("2026-10-21"));
    expect(pressed("2026-10-21")).toBe("true");
    expect(screen.getByRole("button", { name: "저장하기, 3일" })).toBeInTheDocument();
  });

  test("마우스: 고른 날에서 시작하면 끄는 동안 지우기만 한다(안 고른 날은 그대로)", async () => {
    await startEdit("민준");
    expect(pressed("2026-10-21")).toBe("true");
    fireEvent.pointerDown(cellAt("2026-10-21"));
    over = cellAt("2026-10-20");
    fireEvent.pointerMove(cellAt("2026-10-21"));
    over = cellAt("2026-10-23");
    fireEvent.pointerMove(cellAt("2026-10-21"));
    fireEvent.pointerUp(cellAt("2026-10-23"));
    expect(pressed("2026-10-20")).toBe("false");
    expect(pressed("2026-10-21")).toBe("false");
    expect(pressed("2026-10-23")).toBe("false");
  });

  test("손가락 탭 뒤 iOS가 늦게 보내는 click은 막아 고른 날을 지운 대로 둔다(키보드 click·요일 글자는 그대로)", async () => {
    await startEdit("민준");
    expect(pressed("2026-10-21")).toBe("true");
    touch(cellAt("2026-10-21"), "touchstart", 200, 300);
    touch(cellAt("2026-10-21"), "touchend", 200, 300);
    expect(pressed("2026-10-21")).toBe("false");
    // touchend를 막았는데도 사파리가 조금 뒤 click(detail 1)을 보낸 경우.
    await act(() => new Promise((done) => setTimeout(done, 120)));
    fireEvent.click(cellAt("2026-10-21"), { detail: 1 });
    expect(pressed("2026-10-21")).toBe("false");
    // 바로 뒤 요일 글자 click은 막지 않는다(금요일 23일 지우기).
    fireEvent.click(screen.getByRole("button", { name: "2026년 10월 금요일 전부 고르기·지우기" }), { detail: 1 });
    expect(pressed("2026-10-23")).toBe("false");
    // 키보드 click(detail 0)은 바로 받는다.
    fireEvent.click(cellAt("2026-10-21"));
    expect(pressed("2026-10-21")).toBe("true");
  });

  test("마우스 오른쪽 단추는 칠하지 않는다", async () => {
    await startEdit("지호");
    // jsdom에는 PointerEvent가 없어 단추 값이 실리는 MouseEvent로 보낸다.
    fireEvent(cellAt("2026-10-20"), new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 2 }));
    fireEvent(cellAt("2026-10-20"), new MouseEvent("pointerup", { bubbles: true, cancelable: true, button: 2 }));
    expect(pressed("2026-10-20")).toBe("false");
  });

  test("손가락: 누르고 떼면 한 칸, 옆으로 밀면 지나간 날을 칠한다", async () => {
    await startEdit("지호");
    const tap = touch(cellAt("2026-10-23"), "touchstart", 300, 400);
    expect(tap.defaultPrevented).toBe(false);
    const end = touch(cellAt("2026-10-23"), "touchend", 300, 400);
    // 흉내 click을 막아 두 번 바뀌지 않게 한다.
    expect(end.defaultPrevented).toBe(true);
    expect(pressed("2026-10-23")).toBe("true");

    touch(cellAt("2026-10-20"), "touchstart", 100, 300);
    over = cellAt("2026-10-21");
    const move = touch(cellAt("2026-10-20"), "touchmove", 140, 302);
    expect(move.defaultPrevented).toBe(true);
    touch(cellAt("2026-10-20"), "touchend", 140, 302);
    expect(pressed("2026-10-20")).toBe("true");
    expect(pressed("2026-10-21")).toBe("true");
    expect(screen.getByRole("button", { name: "저장하기, 3일" })).toBeInTheDocument();
  });

  test("손가락: 세로로 밀면 화면 스크롤이라 고르지 않는다", async () => {
    await startEdit("지호");
    touch(cellAt("2026-10-20"), "touchstart", 100, 300);
    over = cellAt("2026-10-21");
    const move = touch(cellAt("2026-10-20"), "touchmove", 104, 360);
    expect(move.defaultPrevented).toBe(false);
    touch(cellAt("2026-10-20"), "touchend", 104, 360);
    expect(pressed("2026-10-20")).toBe("false");
    expect(pressed("2026-10-21")).toBe("false");
  });

  test("손가락: 길게 누른 뒤 끌면 어느 방향이든 칠한다", async () => {
    await startEdit("지호");
    touch(cellAt("2026-10-20"), "touchstart", 100, 300);
    await act(() => new Promise((done) => setTimeout(done, 320)));
    expect(pressed("2026-10-20")).toBe("true");
    over = cellAt("2026-10-23");
    const move = touch(cellAt("2026-10-20"), "touchmove", 100, 380);
    expect(move.defaultPrevented).toBe(true);
    touch(cellAt("2026-10-20"), "touchend", 100, 380);
    expect(pressed("2026-10-23")).toBe("true");
    expect(pressed("2026-10-21")).toBe("false");
  });

  test("보는 모드에서는 끌어도 고르지 않는다", async () => {
    await renderDate({ me: "지호" });
    fireEvent.pointerDown(cellAt("2026-10-20"));
    over = cellAt("2026-10-23");
    fireEvent.pointerMove(cellAt("2026-10-20"));
    fireEvent.pointerUp(cellAt("2026-10-23"));
    expect(cellAt("2026-10-20")).not.toHaveAttribute("aria-pressed");
    expect(readTableState(TABLE_ID).draft ?? null).toBeNull();
  });
});

describe("날짜 표 문구(2026-10-10)", () => {
  test("로그아웃하면 참여 창 제목은 처음 참여와 같은 '참여하기'", async () => {
    await renderDate({ me: "민준" });
    fireEvent.click(screen.getByRole("button", { name: "내 날짜 고치기, 지금 2일" }));
    fireEvent.click(screen.getByRole("button", { name: "더보기: 로그아웃, 참여 취소" }));
    fireEvent.click(screen.getByRole("button", { name: /^로그아웃 내 날짜는 그대로예요/ }));
    expect(screen.getByRole("dialog", { name: "참여하기" })).toBeInTheDocument();
    expect(screen.queryByText(/누구 (시간|날짜)/)).not.toBeInTheDocument();
  });

  test("표 화면 공유 단추의 휴대폰 공유 문구는 '날짜를'로 쓴다", async () => {
    const originalMatchMedia = window.matchMedia;
    const hadShare = "share" in navigator;
    const originalShare = navigator.share;
    window.matchMedia = (query) => ({ matches: query === "(pointer: coarse)", media: query, addEventListener: () => {}, removeEventListener: () => {} });
    navigator.share = jest.fn().mockResolvedValue();
    try {
      await renderDate();
      fireEvent.click(screen.getByRole("button", { name: "초대 링크 공유하기" }));
      await waitFor(() => expect(navigator.share).toHaveBeenCalledTimes(1));
      expect(navigator.share).toHaveBeenCalledWith(expect.objectContaining({ title: "동아리 회식", text: "가능한 날짜를 표시해 주세요." }));
    } finally {
      window.matchMedia = originalMatchMedia;
      if (hadShare) navigator.share = originalShare;
      else delete navigator.share;
    }
  });
});
