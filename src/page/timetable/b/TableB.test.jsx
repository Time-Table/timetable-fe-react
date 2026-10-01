import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TimetablePage from "../TimetablePage";
import { getTableInfo } from "../../../api/table";
import { getAllSchedule, joinUser, deleteUser } from "../../../api/user";
import { addSchedule } from "../../../api/schedule";
import { getChating, postChat } from "../../../api/chat";
import { sendEvent } from "../../../api/event";
import { getTableAbState } from "../../../api/experiment";
import { TABLE_STATE_PREFIX, readTableState } from "../../../utils/tableSession";
import { CHAT_SEEN_KEY } from "../../../utils/storage";
import { getPageHelp } from "../../../utils/pageHelp";
import { grantAdmin } from "../../../utils/admin";
import { fireConfetti } from "./confetti";

// 새 화면(B) 흐름과 계측(2026-10-01, 확정 시안을 실제 앱에 옮김). 합성 자료와 가짜 API만 쓴다. 네트워크·DB 접근 없음.
// 표 ID는 명세 확인값: 칸 19 → B.
const TABLE_B = "00000000-0000-4000-8000-000000000000";
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

// 월 9/28·화 9/29(1주), 월 10/5(2주). 10~12시.
const TABLE = {
  tableId: TABLE_B,
  title: "모임",
  dates: ["2026-09-28", "2026-09-29", "2026-10-05"],
  startHour: "10:00",
  endHour: "12:00",
  banedCells: [],
  createdAt: AFTER,
};
// 표 화면 A/B 2회차 확인값: table-ab-2 해시 칸 14 → B.
const B_VISITOR = "11111111-1111-4111-8111-111111111111";
const USERS = [
  { name: "민준", availableTimes: ["2026-09-28-10:00", "2026-09-28-10:30"] },
  { name: "서연", availableTimes: ["2026-09-28-10:00", "2026-10-05-11:00"] },
];
const sent = (name) => sendEvent.mock.calls.map(([payload]) => payload).filter((payload) => payload.name === name);
const clarityEvents = () => window.clarity.mock.calls.filter(([kind]) => kind === "event").map(([, name]) => name);
// 입력 격자 칸은 이름 없는 칠하기 면이라(요일·시간 글자가 단추) 칸 키로 찾는다.
// eslint-disable-next-line testing-library/no-node-access
const cellAt = (key) => document.body.querySelector(`[data-key="${key}"]`);
// 명단 창은 칸 자리를 재서 칸 옆에 붙이고, 칸이 화면 밖이면 숨긴다. jsdom은 자리가 모두 0이라 화면 안의 칸처럼 흉내 낸다.
const placeCells = () =>
  jest.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ top: 300, bottom: 322, left: 100, right: 150, width: 50, height: 22, x: 100, y: 300 });

const renderB = async ({ users = USERS, me = null, shared = null } = {}) => {
  mockTableId = TABLE_B;
  if (me) {
    localStorage.setItem("tableId", TABLE_B);
    localStorage.setItem("name", me);
  }
  if (shared) sessionStorage.setItem(KEY, JSON.stringify({ v: 1, ...shared }));
  getTableInfo.mockResolvedValue({ success: true, data: TABLE });
  getAllSchedule.mockResolvedValue({ success: true, code: 200, data: users });
  const view = render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TimetablePage />
    </MemoryRouter>,
  );
  await screen.findByRole("heading", { name: "모임" });
  // 첫 그리기 뒤의 효과(고른 사람 되살리기·보던 주 남기기·대화 불러오기)가 다 돈 다음에 누른다.
  await waitFor(() => expect(readTableState(TABLE_B).weekKey).not.toBeNull());
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
  // 표 화면 A/B 2회차: 실험 진행 중, 이 브라우저는 B 배정(visitorId 해시 칸 14).
  getTableAbState.mockResolvedValue({ ok: true, running: true, state: "running" });
  localStorage.setItem("visitor_id", B_VISITOR);
});

afterEach(() => {
  delete window.clarity;
  jest.restoreAllMocks();
});

describe("보기", () => {
  test("B로 배정된 표는 새 화면을 그린다(기존 화면 부품은 없다)", async () => {
    await renderB();
    expect(screen.getByRole("region", { name: "화면 바꾸기" })).toHaveTextContent("다른 화면으로 볼 수 있어요");
    expect(screen.getByRole("button", { name: /가장 많이 모이는 시간 9월 28일 \(월\) 10:00 ~ 10:30, 2명 중 2명/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "전체 2명 보기" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "내 시간 넣기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /골든타임 순위/ })).not.toBeInTheDocument();
    // 처음 여는 주는 1위가 있는 주이고, 기존 화면도 같은 주를 보도록 남긴다.
    expect(screen.getByText("1 / 2주 · 최대 2명")).toBeInTheDocument();
    await waitFor(() => expect(readTableState(TABLE_B).weekKey).toBe("2026-09-28"));
    expect(window.clarity).toHaveBeenCalledWith("set", "tt_table_ui", "B");
  });

  test("여러 명을 고르면 모두 되는 시간을 보이고 공유 상태에 남기며, 전체를 누르면 비운다", async () => {
    await renderB();
    fireEvent.click(screen.getByRole("button", { name: /^민준\. 고르기/ }));
    fireEvent.click(screen.getByRole("button", { name: /^서연\. 고르기/ }));
    expect(screen.getByText("민준·서연 모두")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /민준·서연 모두 되는 시간 9월 28일 \(월\) 10:00 ~ 10:30, 모두 1곳/ })).toBeInTheDocument();
    await waitFor(() => expect(readTableState(TABLE_B).picks).toEqual(["민준", "서연"]));
    expect(clarityEvents().filter((name) => name === "tt_b_pick")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "전체 2명 보기" }));
    expect(screen.queryByText("민준·서연 모두")).not.toBeInTheDocument();
    await waitFor(() => expect(readTableState(TABLE_B).picks).toEqual([]));
  });

  test("칸을 누르면 명단 창(되는 사람·안 되는 사람)이 칸 옆에 뜨고 밖을 누르면 닫힌다", async () => {
    placeCells();
    await renderB();
    fireEvent.click(screen.getByRole("button", { name: "9월 28일 (월) 10:30 · 1명 가능" }));
    const pop = screen.getByRole("dialog", { name: "이 시간 참여 명단" });
    expect(pop).toHaveTextContent("9월 28일 (월) 10:30 ~ 11:00");
    expect(within(pop).getByText("민준")).toBeInTheDocument();
    expect(within(pop).getByText("서연")).toBeInTheDocument();
    // 칸(오른쪽 150, 아래 322)에 12px 겹쳐 오른쪽 아래로 붙고, 칸을 향한 왼쪽 위 모서리만 뾰족하다.
    expect(pop).toHaveStyle({ left: "138px", top: "310px" });
    expect(pop).not.toHaveStyle({ visibility: "hidden" });
    expect(pop).toHaveAttribute("data-corner", "tl");
    expect(clarityEvents()).toContain("tt_timetable_cell");
    fireEvent.click(document.body);
    expect(screen.queryByRole("dialog", { name: "이 시간 참여 명단" })).not.toBeInTheDocument();
  });

  test("골든 버튼: ranking_open에 B가 붙고, 줄을 누르면 그 칸 명단이 열린다", async () => {
    placeCells();
    await renderB();
    fireEvent.click(screen.getByRole("button", { name: /^가장 많이 모이는 시간 9월 28일/ }));
    expect(sent("ranking_open")).toEqual([expect.objectContaining({ tableId: TABLE_B, uiVersion: "B" })]);
    const sheet = screen.getByRole("dialog", { name: "가장 많이 모이는 시간" });
    // 1명 가능한 두 덩어리는 같은 순위(2위)다.
    expect(within(sheet).getByRole("button", { name: /^1위 9월 28일/ })).toBeInTheDocument();
    expect(within(sheet).getAllByRole("button", { name: /^2위/ })).toHaveLength(2);

    fireEvent.click(within(sheet).getByRole("button", { name: /^2위 10월 5일/ }));
    expect(clarityEvents()).toContain("tt_b_rank_jump");
    expect(await screen.findByRole("dialog", { name: "이 시간 참여 명단" })).toHaveTextContent("10월 5일 (월) 11:00 ~ 11:30");
    expect(screen.getByText(/^2 \/ 2주/)).toBeInTheDocument();
  });

  test("주 넘기기는 공유 상태의 주를 바꾸고 계측한다", async () => {
    await renderB();
    fireEvent.click(screen.getByRole("button", { name: "다음 주" }));
    expect(screen.getByText("2 / 2주 · 최대 1명")).toBeInTheDocument();
    await waitFor(() => expect(readTableState(TABLE_B).weekKey).toBe("2026-10-05"));
    expect(clarityEvents()).toContain("tt_b_week_nav");
  });

  test("헤더 \"?\"는 새 화면에서 사용법을 연다(화면이 사라지면 원래대로)", async () => {
    const view = await renderB();
    expect(getPageHelp()).toEqual(expect.objectContaining({ label: "사용법 보기" }));
    act(() => getPageHelp().open());
    expect(screen.getByRole("dialog", { name: "사용법" })).toHaveTextContent("‹ › 로 다른 주");
    expect(clarityEvents()).toContain("tt_b_help_open");
    view.unmount();
    expect(getPageHelp()).toBeNull();
  });
});

describe("참여", () => {
  test("참여 전에는 내 시간 넣기가 참여 창을 열고, 참여하면 계측 뒤 입력 모드로 간다", async () => {
    await renderB();
    fireEvent.click(screen.getByRole("button", { name: "내 시간 넣기" }));
    expect(clarityEvents()).toContain("tt_b_join_open");
    joinUser.mockResolvedValue({ success: true, code: 201, data: { name: "지우", availableTimes: [] } });
    getAllSchedule.mockResolvedValue({ success: true, code: 200, data: [...USERS, { name: "지우", availableTimes: [] }] });
    fireEvent.change(screen.getByRole("textbox", { name: "이름" }), { target: { value: "지우" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "시간 고르기" }));

    expect(await screen.findByText("지우 님의 시간")).toBeInTheDocument();
    expect(joinUser).toHaveBeenCalledWith(TABLE_B, "지우", "1234");
    expect(sent("join_submit")).toEqual([expect.objectContaining({ uiVersion: "B" })]);
    expect(sent("join_success")).toEqual([expect.objectContaining({ uiVersion: "B" })]);
    expect(localStorage.getItem("name")).toBe("지우");
    // 이름이 든 안내는 화면 녹화에서 가리고, 참여 뒤 저절로 연 입력은 사람이 누른 입력 시작으로 세지 않는다.
    expect(screen.getByText("지우 님, 환영해요. 되는 시간을 칠해 주세요.")).toHaveAttribute("data-clarity-mask", "true");
    expect(clarityEvents()).not.toContain("tt_b_edit_start");
    expect(readTableState(TABLE_B)).toEqual(expect.objectContaining({ name: "지우", editing: true, draft: null }));
  });

  test("비밀번호가 다르면 창에 알리고 참여하지 않는다", async () => {
    await renderB();
    fireEvent.click(screen.getByRole("button", { name: "내 시간 넣기" }));
    joinUser.mockResolvedValue({ success: false, code: 401, message: "비밀번호가 일치하지 않습니다." });
    fireEvent.change(screen.getByRole("textbox", { name: "이름" }), { target: { value: "민준" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "0000" } });
    fireEvent.click(screen.getByRole("button", { name: "시간 고르기" }));
    expect(await screen.findByText("비밀번호가 달라요. 처음 정한 비밀번호를 넣어 주세요.")).toBeInTheDocument();
    expect(sent("join_success")).toHaveLength(0);
    expect(localStorage.getItem("name")).toBeNull();
  });

  test("형식이 틀린 이름은 보내지 않는다", async () => {
    await renderB();
    fireEvent.click(screen.getByRole("button", { name: "내 시간 넣기" }));
    fireEvent.change(screen.getByRole("textbox", { name: "이름" }), { target: { value: "민준!" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "시간 고르기" }));
    expect(await screen.findByText("이름과 비밀번호는 한글·영문·숫자·공백만 쓸 수 있어요.")).toBeInTheDocument();
    expect(joinUser).not.toHaveBeenCalled();
    expect(sent("join_submit")).toHaveLength(0);
  });
});

describe("내 시간 저장", () => {
  const saveOk = (times) => addSchedule.mockResolvedValue({ success: true, data: { userAvailableTimes: times } });

  test("다른 사람이 있을 때 첫 저장: schedule_save(B)·폭죽·튀어 오르는 안내", async () => {
    const users = [...USERS, { name: "지우", availableTimes: [] }];
    await renderB({ users, me: "지우" });
    fireEvent.click(screen.getByRole("button", { name: "내 시간 넣기" }));
    expect(clarityEvents()).toContain("tt_b_edit_start");
    fireEvent.click(screen.getByRole("button", { name: "9월 28일 (월) 하루 전체 칠하기·지우기" }));
    expect(clarityEvents()).toEqual(expect.arrayContaining(["tt_schedule_select", "tt_b_day_toggle"]));
    expect(screen.getByRole("button", { name: "저장하기, 2시간" })).toBeInTheDocument();

    const times = ["2026-09-28-10:00", "2026-09-28-10:30", "2026-09-28-11:00", "2026-09-28-11:30"];
    saveOk(times);
    getAllSchedule.mockResolvedValue({ success: true, code: 200, data: [...USERS, { name: "지우", availableTimes: times }] });
    fireEvent.click(screen.getByRole("button", { name: "저장하기, 2시간" }));

    const toast = await screen.findByText("참여 가능한 시간을 저장했어요. 이제 모두가 볼 수 있어요.");
    expect(toast).toHaveClass("pop");
    expect(addSchedule).toHaveBeenCalledWith(TABLE_B, "지우", times);
    expect(sent("schedule_save")).toEqual([expect.objectContaining({ uiVersion: "B" })]);
    expect(clarityEvents()).toContain("tt_schedule_save_click");
    expect(fireConfetti).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "내 시간 고치기, 지금 2시간" })).toBeInTheDocument();
    expect(readTableState(TABLE_B)).toEqual(expect.objectContaining({ editing: false, draft: null }));
  });

  test("표에서 처음 시간을 넣은 사람: 폭죽 뒤 공유 권유 창, 공유하기는 invite_share(B)", async () => {
    fireConfetti.mockReturnValue(true);
    const users = [{ name: "지우", availableTimes: [] }];
    await renderB({ users, me: "지우" });
    fireEvent.click(screen.getByRole("button", { name: "내 시간 넣기" }));
    fireEvent.click(screen.getByRole("button", { name: "10:00 ~ 11:00 줄 전체 칠하기·지우기" }));
    saveOk(["2026-09-28-10:00", "2026-09-28-10:30", "2026-09-29-10:00", "2026-09-29-10:30"]);
    fireEvent.click(screen.getByRole("button", { name: /^저장하기/ }));

    const prompt = await screen.findByRole("dialog", { name: "첫 번째로 시간을 넣었어요" }, { timeout: 2000 });
    expect(clarityEvents()).toEqual(expect.arrayContaining(["tt_b_hour_toggle", "tt_b_save_prompt"]));
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue() } });
    fireEvent.click(within(prompt).getByRole("button", { name: "공유하기" }));
    expect(sent("invite_share")).toEqual([expect.objectContaining({ uiVersion: "B" })]);
    expect(await screen.findByText("링크를 복사했어요. 단톡방에 붙여 넣으세요.")).toBeInTheDocument();
    expect(clarityEvents()).toEqual(expect.arrayContaining(["tt_invite_share_table", "tt_b_prompt_share"]));
    fireEvent.click(within(prompt).getByRole("button", { name: "확인" }));
    expect(screen.queryByRole("dialog", { name: "첫 번째로 시간을 넣었어요" })).not.toBeInTheDocument();
  });

  test("고쳐 저장·모두 지움·바뀐 것 없음은 모두 튀어 오르는 안내다", async () => {
    await renderB({ me: "민준" });
    // 바뀐 것 없음
    fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기/ }));
    fireEvent.click(screen.getByRole("button", { name: /^저장하기/ }));
    expect(await screen.findByText("바뀐 시간이 없어요.")).toHaveClass("pop");
    expect(clarityEvents()).toContain("tt_b_save_nochange");
    expect(addSchedule).not.toHaveBeenCalled();

    // 고쳐 저장
    fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기/ }));
    fireEvent.click(screen.getByRole("button", { name: "9월 29일 (화) 하루 전체 칠하기·지우기" }));
    saveOk([]);
    fireEvent.click(screen.getByRole("button", { name: /^저장하기/ }));
    expect(await screen.findByText("고친 시간을 저장했어요!")).toHaveClass("pop");
    expect(fireConfetti).not.toHaveBeenCalled();

    // 모두 지움(9/28 하루를 두 번 눌러 전부 지운다)
    fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기|^내 시간 넣기/ }));
    const day = screen.getByRole("button", { name: "9월 28일 (월) 하루 전체 칠하기·지우기" });
    fireEvent.click(day);
    fireEvent.click(day);
    fireEvent.click(screen.getByRole("button", { name: "9월 29일 (화) 하루 전체 칠하기·지우기" }));
    fireEvent.click(screen.getByRole("button", { name: "9월 29일 (화) 하루 전체 칠하기·지우기" }));
    fireEvent.click(screen.getByRole("button", { name: "저장하기, 없음" }));
    expect(await screen.findByText("내 시간을 모두 지웠어요.")).toHaveClass("pop");
  });

  test("저장이 실패하면 입력 모드와 저장 안 한 칸을 남기고 알린다", async () => {
    await renderB({ me: "민준" });
    fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기/ }));
    fireEvent.click(screen.getByRole("button", { name: "9월 29일 (화) 하루 전체 칠하기·지우기" }));
    addSchedule.mockRejectedValue(new Error("offline"));
    fireEvent.click(screen.getByRole("button", { name: /^저장하기/ }));
    expect(await screen.findByText("인터넷 연결을 확인하고 다시 해 주세요.")).toHaveClass("pop");
    expect(screen.getByText("민준 님의 시간")).toBeInTheDocument();
    expect(sent("schedule_save")).toHaveLength(0);
    expect(readTableState(TABLE_B).draft).toEqual(expect.arrayContaining(["2026-09-29-10:00", "2026-09-29-11:30"]));
  });

  test("칸을 칠하면 손을 떼기 전에도 공유 상태에 바로 남긴다(기존 화면으로 바꿔도 같은 칸)", async () => {
    await renderB({ me: "민준" });
    fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기/ }));
    fireEvent.pointerDown(cellAt("2026-09-29-10:00"));
    expect(readTableState(TABLE_B).draft).toEqual(["2026-09-28-10:00", "2026-09-28-10:30", "2026-09-29-10:00"]);
    fireEvent.pointerUp(cellAt("2026-09-29-10:00"));
    expect(screen.getByRole("button", { name: "저장하기, 1시간 30분" })).toBeInTheDocument();
  });

  test("기존 화면에서 칠하던 칸이 있으면 입력 모드로 이어서 연다", async () => {
    await renderB({ me: "민준", shared: { name: "민준", editing: true, draft: ["2026-09-29-11:00"] } });
    expect(await screen.findByText("민준 님의 시간")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장하기, 30분" })).toBeInTheDocument();
    // 자동으로 이어 연 것은 사람이 누른 입력 시작으로 세지 않는다.
    expect(clarityEvents()).not.toContain("tt_b_edit_start");
  });

  test("취소는 저장 안 한 칸이 있으면 묻고, 나가면 계측한다", async () => {
    await renderB({ me: "민준" });
    fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기/ }));
    fireEvent.click(screen.getByRole("button", { name: "9월 29일 (화) 하루 전체 칠하기·지우기" }));
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    const confirm = screen.getByRole("dialog", { name: "저장하지 않고 나갈까요?" });
    fireEvent.click(within(confirm).getByRole("button", { name: "나가기" }));
    expect(screen.queryByText("민준 님의 시간")).not.toBeInTheDocument();
    expect(clarityEvents()).toContain("tt_b_edit_cancel");
    expect(readTableState(TABLE_B)).toEqual(expect.objectContaining({ editing: false, draft: null }));
  });
});

describe("전환·더보기·대화", () => {
  test("입력 중 띠로 기존 화면으로 가면 기존 화면이 같은 이름으로 내 일정을 연다", async () => {
    await renderB({ me: "민준" });
    fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기/ }));
    fireEvent.click(screen.getByRole("button", { name: "다른 화면 보기" }));
    expect(await screen.findByText(/님의 가능한 시간을 선택해주세요/)).toBeInTheDocument();
    expect(sent("ui_switch")).toEqual([expect.objectContaining({ uiVersion: "A" })]);
  });

  test("더보기 로그아웃: 이름·공유 상태를 지우고 다른 이름으로 참여 창", async () => {
    await renderB({ me: "민준" });
    fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기/ }));
    fireEvent.click(screen.getByRole("button", { name: "더보기: 로그아웃, 참여 취소" }));
    fireEvent.click(screen.getByRole("button", { name: /^로그아웃 내 시간은 그대로예요/ }));
    expect(screen.getByRole("dialog", { name: "누구 시간을 넣을까요?" })).toBeInTheDocument();
    expect(localStorage.getItem("name")).toBeNull();
    // 앞사람의 저장 안 한 칸·입력 여부는 지운다(보던 주·고른 사람만 다시 남는다).
    expect(readTableState(TABLE_B)).toEqual(expect.objectContaining({ name: null, editing: false, draft: null, picks: [] }));
    expect(clarityEvents()).toEqual(expect.arrayContaining(["tt_b_more_open", "tt_b_logout", "tt_b_join_open"]));
  });

  test("참여 취소: 비밀번호로 지우고 목록에서 뺀다", async () => {
    await renderB({ me: "민준" });
    fireEvent.click(screen.getByRole("button", { name: /^내 시간 고치기/ }));
    fireEvent.click(screen.getByRole("button", { name: "더보기: 로그아웃, 참여 취소" }));
    fireEvent.click(screen.getByRole("button", { name: /^참여 취소 민준 님의 시간이/ }));
    deleteUser.mockResolvedValue({ success: true });
    getAllSchedule.mockResolvedValue({ success: true, code: 200, data: [USERS[1]] });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "1234" } });
    fireEvent.click(within(screen.getByRole("dialog", { name: "참여를 취소할까요?" })).getByRole("button", { name: "참여 취소" }));
    expect(await screen.findByText("참여를 취소했어요. 내 시간이 지워졌어요.")).toBeInTheDocument();
    expect(deleteUser).toHaveBeenCalledWith(TABLE_B, "민준", "1234");
    expect(screen.queryByRole("button", { name: /^민준/ })).not.toBeInTheDocument();
    expect(localStorage.getItem("name")).toBeNull();
  });

  test("대화: 안 읽은 글 수를 보이고 창을 열면 읽음으로 남긴다", async () => {
    getChating.mockResolvedValue({
      status: 200,
      data: [
        { name: "서연", message: "안녕", timestamp: "2026-10-01T00:00:00.000Z" },
        { name: "민준", message: "네", timestamp: "2026-10-01T00:01:00.000Z" },
      ],
    });
    await renderB({ me: "민준" });
    const chat = await screen.findByRole("button", { name: "대화 2개, 안 읽은 글 1개" });
    fireEvent.click(chat);
    expect(clarityEvents()).toContain("tt_b_chat_open");
    await waitFor(() => expect(JSON.parse(localStorage.getItem(CHAT_SEEN_KEY))[TABLE_B]).toBe("2026-10-01T00:01:00.000Z"));
    postChat.mockResolvedValue({ success: true });
    fireEvent.change(screen.getByRole("textbox", { name: "메시지" }), { target: { value: "좋아요" } });
    fireEvent.click(screen.getByRole("button", { name: "보내기" }));
    await waitFor(() => expect(clarityEvents()).toContain("tt_chat_send"));
    expect(postChat).toHaveBeenCalledWith(TABLE_B, "민준", "좋아요");
    // 보낸 뒤 대화를 다시 불러와 입력칸을 비운다.
    await waitFor(() => expect(screen.getByRole("textbox", { name: "메시지" })).toHaveValue(""));
  });

  test("관리자는 새 화면을 쓸 수 있지만 서버·Clarity 기록은 나가지 않는다", async () => {
    grantAdmin("admin-token");
    await renderB();
    fireEvent.click(screen.getByRole("button", { name: /^가장 많이 모이는 시간/ }));
    fireEvent.click(screen.getByRole("button", { name: /^민준\. 고르기/ }));
    expect(sendEvent).not.toHaveBeenCalled();
    expect(clarityEvents()).toEqual([]);
  });
});
