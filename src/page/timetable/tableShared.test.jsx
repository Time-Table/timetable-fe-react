import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Swal from "sweetalert2";
import TimetablePage from "./TimetablePage";
import PersonalSchedule from "./components/PersonalSchedule";
import RankingList from "./components/RankingList";
import { getTableInfo } from "../../api/table";
import { getAllSchedule } from "../../api/user";
import { addSchedule, getSchedule } from "../../api/schedule";
import { getChating } from "../../api/chat";
import { sendEvent } from "../../api/event";
import { TABLE_STATE_PREFIX, readTableState } from "../../utils/tableSession";

// 표 화면 A/B 공유 상태(2026-09-30 사람 지시): 기존 화면과 새 화면을 바꿔도 닉네임·저장 안 한 칸·입력 여부·주·고른 사람이 같다.
// 합성 데이터와 mock API만 쓴다. 네트워크·DB 접근 없음.
const TABLE_ID = "313fcb21-583e-4e82-942c-713eeb3d607d";
const KEY = TABLE_STATE_PREFIX + TABLE_ID;
let mockTableId = TABLE_ID;
jest.mock("react-router-dom", () => ({ ...jest.requireActual("react-router-dom"), useParams: () => ({ tableId: mockTableId }) }));
jest.mock("../../api/table", () => ({ getTableInfo: jest.fn() }));
jest.mock("../../api/user", () => ({ joinUser: jest.fn(), getAllSchedule: jest.fn(), getUserInfo: jest.fn(), deleteUser: jest.fn() }));
jest.mock("../../api/schedule", () => ({ addSchedule: jest.fn(), getSchedule: jest.fn() }));
jest.mock("../../api/chat", () => ({ getChating: jest.fn(), postChat: jest.fn() }));
jest.mock("../../api/event", () => ({ sendEvent: jest.fn() }));
jest.mock("../../api/blogView", () => ({ sendBlogView: jest.fn() }));
jest.mock("../../api/visit", () => ({ trackVisit: jest.fn() }));
let mockIsDesktop = false;
jest.mock("../../hooks/useMediaQuery", () => ({ useMediaQuery: () => mockIsDesktop }));
jest.mock("../../Seo", () => () => null);
jest.mock("../../component/AdSense", () => () => null);
// 칸 누르기만 흉내 낸다. 실제 격자 동작은 TimeGrid.test.jsx가 본다.
jest.mock("../../component/TimeGrid", () => ({ selectedCells = [], setSelectedCells, weekKey, timeInfo, viewMaxCount, onCellClick, showGolden = true }) => (
  <div data-testid="grid" data-week={weekKey || ""} data-max={viewMaxCount || ""} data-golden={showGolden ? "on" : "off"}
    data-info={setSelectedCells ? "" : JSON.stringify((Array.isArray(timeInfo) ? timeInfo : []).map((t) => (typeof t === "string" ? t : `${t.time}:${t.count}`)))}>
    {!setSelectedCells && onCellClick && (Array.isArray(timeInfo) ? timeInfo : []).map((t) => (
      <button key={t.time || t} type="button" onClick={(e) => onCellClick(t, e)}>{`${t.time || t} 보기`}</button>
    ))}
    {setSelectedCells && ["10:00", "11:00"].map((time) => {
      const cell = `2026-09-28-${time}`;
      return (
        <button key={time} type="button" aria-pressed={selectedCells.includes(cell)}
          onClick={() => setSelectedCells((prev) => (prev.includes(cell) ? prev.filter((c) => c !== cell) : [...prev, cell]))}>
          {time} 칸
        </button>
      );
    })}
  </div>
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

const saved = ["2026-09-28-10:00"];
const users = [
  { name: "민준", availableTimes: saved },
  { name: "서연", availableTimes: ["2026-09-28-10:00", "2026-09-28-11:00"] },
];
const setShared = (state) => sessionStorage.setItem(KEY, JSON.stringify({ v: 1, ...state }));
const pressed = (time) => screen.getByRole("button", { name: `${time} 칸` }).getAttribute("aria-pressed");

beforeEach(() => {
  jest.resetAllMocks();
  mockTableId = TABLE_ID;
  mockIsDesktop = false;
  localStorage.clear();
  sessionStorage.clear();
  sendEvent.mockResolvedValue({ success: true });
  getChating.mockResolvedValue({ status: 201 });
});

const renderSchedule = (list = users, extra = {}) =>
  render(
    <PersonalSchedule tableId={TABLE_ID} usersScheduleList={list} dates={["2026-09-28"]} startHour="09:00" endHour="12:00"
      onSaveSuccess={jest.fn()} {...extra} />,
  );

describe("내 일정(기존 화면)", () => {
  beforeEach(() => localStorage.setItem("name", "민준"));

  test("같은 이름의 저장 안 한 선택으로 시작한다(새 화면에서 칠하던 칸)", () => {
    setShared({ name: "민준", editing: true, draft: ["2026-09-28-11:00"] });
    renderSchedule();
    expect(pressed("10:00")).toBe("false");
    expect(pressed("11:00")).toBe("true");
  });

  test("개발 모드 StrictMode(효과 두 번)에서도 되살린 칸을 저장 시간으로 덮지 않는다", () => {
    // 2026-09-30 새 표 시험에서 새 화면 → 기존 화면 복귀 때 칸이 사라진 원인.
    setShared({ name: "민준", editing: true, draft: ["2026-09-28-11:00"] });
    render(
      <StrictMode>
        <PersonalSchedule tableId={TABLE_ID} usersScheduleList={users} dates={["2026-09-28"]} startHour="09:00" endHour="12:00"
          onSaveSuccess={jest.fn()} />
      </StrictMode>,
    );
    expect(pressed("11:00")).toBe("true");
    expect(pressed("10:00")).toBe("false");
    expect(readTableState(TABLE_ID).draft).toEqual(["2026-09-28-11:00"]);
  });

  test("StrictMode에서 저장한 시간이 없는 새 참여자도 되살린 칸을 지키고, 다시 불러와도 덮지 않는다", () => {
    // 2026-09-30 새 표 시험: 저장 시간이 없는 사람(abme)은 되살린 칸이 "바뀐 것 없음"으로 판정돼 지워졌다.
    localStorage.setItem("name", "새사람");
    const list = [...users, { name: "새사람", availableTimes: [] }];
    setShared({ name: "새사람", editing: true, draft: ["2026-09-28-11:00"] });
    const view = render(
      <StrictMode>
        <PersonalSchedule tableId={TABLE_ID} usersScheduleList={list} dates={["2026-09-28"]} startHour="09:00" endHour="12:00"
          onSaveSuccess={jest.fn()} />
      </StrictMode>,
    );
    expect(pressed("11:00")).toBe("true");
    expect(readTableState(TABLE_ID).draft).toEqual(["2026-09-28-11:00"]);
    view.rerender(
      <StrictMode>
        <PersonalSchedule tableId={TABLE_ID} usersScheduleList={list.map((u) => ({ ...u }))} dates={["2026-09-28"]}
          startHour="09:00" endHour="12:00" onSaveSuccess={jest.fn()} />
      </StrictMode>,
    );
    expect(pressed("11:00")).toBe("true");
    expect(readTableState(TABLE_ID).draft).toEqual(["2026-09-28-11:00"]);
  });

  test("다른 이름의 선택은 쓰지 않는다", () => {
    setShared({ name: "서연", draft: ["2026-09-28-11:00"] });
    renderSchedule();
    expect(pressed("10:00")).toBe("true");
    expect(pressed("11:00")).toBe("false");
  });

  test("칸을 바꿀 때마다 바로 남기고, 저장한 시간과 같아지면 비운다", () => {
    renderSchedule();
    fireEvent.click(screen.getByRole("button", { name: "11:00 칸" }));
    expect(readTableState(TABLE_ID)).toMatchObject({ name: "민준", draft: ["2026-09-28-10:00", "2026-09-28-11:00"] });
    fireEvent.click(screen.getByRole("button", { name: "10:00 칸" }));
    expect(readTableState(TABLE_ID).draft).toEqual(["2026-09-28-11:00"]);
    fireEvent.click(screen.getByRole("button", { name: "11:00 칸" }));
    fireEvent.click(screen.getByRole("button", { name: "10:00 칸" }));
    expect(readTableState(TABLE_ID).draft).toBeNull();
  });

  test("전부 지운 것도 이어진다([]는 '전부 지움')", () => {
    renderSchedule();
    fireEvent.click(screen.getByRole("button", { name: "10:00 칸" }));
    expect(readTableState(TABLE_ID).draft).toEqual([]);
  });

  test("목록을 다시 불러와도 저장 안 한 선택은 덮지 않고, 바뀐 것이 없으면 서버 값을 따라간다", () => {
    const view = renderSchedule();
    fireEvent.click(screen.getByRole("button", { name: "11:00 칸" }));
    view.rerender(
      <PersonalSchedule tableId={TABLE_ID} usersScheduleList={users.map((u) => ({ ...u }))} dates={["2026-09-28"]}
        startHour="09:00" endHour="12:00" onSaveSuccess={jest.fn()} />,
    );
    expect(pressed("11:00")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "11:00 칸" })); // 되돌려 깨끗하게
    const moved = [{ name: "민준", availableTimes: ["2026-09-28-11:00"] }, users[1]];
    view.rerender(
      <PersonalSchedule tableId={TABLE_ID} usersScheduleList={moved} dates={["2026-09-28"]}
        startHour="09:00" endHour="12:00" onSaveSuccess={jest.fn()} />,
    );
    expect(pressed("10:00")).toBe("false");
    expect(pressed("11:00")).toBe("true");
  });

  test("저장이 확인되면 비우고, 실패하면 남긴다", async () => {
    addSchedule.mockResolvedValueOnce({ success: false });
    renderSchedule();
    fireEvent.click(screen.getByRole("button", { name: "11:00 칸" }));
    fireEvent.click(screen.getAllByRole("button", { name: "저장하기" })[0]);
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error" })));
    expect(readTableState(TABLE_ID).draft).toEqual(["2026-09-28-10:00", "2026-09-28-11:00"]);

    addSchedule.mockResolvedValueOnce({ success: true });
    fireEvent.click(screen.getAllByRole("button", { name: "저장하기" })[0]);
    await waitFor(() => expect(readTableState(TABLE_ID).draft).toBeNull());
  });

  test("표에 없는 칸은 되살리지 않는다", () => {
    setShared({ name: "민준", draft: ["2026-09-28-11:00", "2026-12-31-10:00"] });
    renderSchedule();
    expect(readTableState(TABLE_ID).draft).toEqual(["2026-09-28-11:00"]);
  });
});

describe("표 화면(기존 화면)", () => {
  const page = () => (
    <StrictMode><MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TimetablePage /></MemoryRouter></StrictMode>
  );
  // 칸별 인원은 참여자 목록으로 센다. 서버 집계(getSchedule)는 흉내 내지 않고 부르지 않음을 확인한다.
  const renderPage = async ({ list = users, banedCells = [] } = {}) => {
    getTableInfo.mockImplementation(async (id) => ({
      success: true,
      data: { tableId: id, title: "표", dates: ["2026-09-28"], startHour: "09:00", endHour: "12:00", banedCells },
    }));
    getAllSchedule.mockResolvedValue({ success: true, code: 200, data: list });
    // 앱과 같이 StrictMode로 그린다(src/index.js).
    const view = render(page());
    if (mockIsDesktop) {
      await screen.findByText("골든타임 순위");
      await waitFor(() => expect(screen.getAllByTestId("grid").length).toBeGreaterThan(0));
    } else {
      const openButton = await screen.findByRole("button", { name: /전체 시간표 보기/ });
      await waitFor(() => expect(openButton).toBeEnabled());
    }
    return view;
  };

  test("새 화면에서 입력 중이었으면 내 일정을 저장 안 한 칸과 함께 연다", async () => {
    localStorage.setItem("tableId", TABLE_ID);
    localStorage.setItem("name", "민준");
    setShared({ name: "민준", editing: true, draft: ["2026-09-28-11:00"] });
    await renderPage();
    expect(await screen.findByText(/님의 가능한 시간을 선택해주세요/)).toBeInTheDocument();
    expect(pressed("11:00")).toBe("true");
    expect(pressed("10:00")).toBe("false");
  });

  test("새 화면에서 보기만 하던 중이었으면 인원 화면으로 연다", async () => {
    localStorage.setItem("tableId", TABLE_ID);
    localStorage.setItem("name", "민준");
    setShared({ name: "민준", editing: false });
    await renderPage();
    expect(await screen.findByText("참여자 (2)")).toBeInTheDocument();
    expect(screen.queryByText(/님의 가능한 시간을 선택해주세요/)).not.toBeInTheDocument();
  });

  test("다른 표에서 쓰던 이름을 이 표의 이름으로 남기지 않는다", async () => {
    localStorage.setItem("tableId", "other-table");
    localStorage.setItem("name", "다른표사람");
    await renderPage();
    expect(localStorage.getItem("name")).toBeNull();
    expect(screen.queryByText(/다른표사람/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참여 / 수정" })).toBeInTheDocument();
  });

  test("한 사람만 골라 보던 중이면 그 사람을 보이고, 칸 명단은 그 칸의 전체 명단이다", async () => {
    // Codex 재검증(2026-09-30): 전에는 한 명을 고르면 시간 글자만 넘겨 명단 창이 "참여 가능 0명"이었다.
    setShared({ picks: ["서연"] });
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /전체 시간표 보기/ }));
    expect(await screen.findByText("서연 님의 시간표")).toBeInTheDocument();
    const grid = screen.getByTestId("grid");
    expect(grid.getAttribute("data-max")).toBe("1");
    expect(grid.getAttribute("data-golden")).toBe("off");
    expect(JSON.parse(grid.getAttribute("data-info"))).toEqual(["2026-09-28-10:00:1", "2026-09-28-11:00:1"]);
    fireEvent.click(screen.getByRole("button", { name: "2026-09-28-10:00 보기" }));
    expect(await screen.findByText("참여 가능 2명")).toBeInTheDocument();
    expect(screen.getByText("참여 불가 0명")).toBeInTheDocument();
  });

  test("아무도 고르지 않은 전체 보기도 서버 집계를 부르지 않고 참여자 목록으로 칠한다(새 화면과 같다)", async () => {
    // Codex 재검증(2026-09-30): 집계는 명단 없이 저장되거나(POST /api/schedules/generation) 목록과 어긋날 수 있다.
    await renderPage();
    expect(getSchedule).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /전체 시간표 보기/ }));
    expect(await screen.findByText("전체 시간표")).toBeInTheDocument();
    const grid = screen.getByTestId("grid");
    expect(grid.getAttribute("data-golden")).toBe("on");
    expect(grid.getAttribute("data-max")).toBe("");
    expect(JSON.parse(grid.getAttribute("data-info"))).toEqual(["2026-09-28-10:00:2", "2026-09-28-11:00:1"]);
    fireEvent.click(screen.getByRole("button", { name: "2026-09-28-10:00 보기" }));
    expect(await screen.findByText("참여 가능 2명")).toBeInTheDocument();
    expect(screen.getByText("최다 인원")).toBeInTheDocument();
  });

  test("막은 칸·표 밖 칸은 전체 보기·최대 인원·순위에서 뺀다(새 화면과 같은 규칙)", async () => {
    // 막은 11:00에 3명이 되지만 그 칸은 셈하지 않는다. 표 밖(12/31) 시간도 뺀다.
    const list = [
      { name: "민준", availableTimes: ["2026-09-28-10:00", "2026-09-28-11:00", "2026-12-31-10:00"] },
      { name: "서연", availableTimes: ["2026-09-28-10:00", "2026-09-28-11:00"] },
      { name: "지훈", availableTimes: ["2026-09-28-11:00"] },
    ];
    await renderPage({ list, banedCells: ["2026-09-28-11:00"] });
    expect(screen.getByText("최대 2명")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /전체 시간표 보기/ }));
    expect(JSON.parse((await screen.findByTestId("grid")).getAttribute("data-info"))).toEqual(["2026-09-28-10:00:2"]);
    fireEvent.click(screen.getByRole("button", { name: /골든타임 순위/ }));
    expect(await screen.findAllByText(/참여 가능$/)).toHaveLength(1);
    expect(screen.getByText(/전체 3명 중/)).toBeInTheDocument();
  });

  test("명단 창을 연 채 저장하면 창이 새 명단으로 바뀌고, 저장 뒤 목록 재조회가 실패해도 저장한 칸이 남는다", async () => {
    // Codex 계획 검토(2026-09-30): 전에는 창이 누른 순간의 칸을 들고 있었고, 재조회가 실패하면 목록을 비웠다.
    mockIsDesktop = true;
    localStorage.setItem("tableId", TABLE_ID);
    localStorage.setItem("name", "민준");
    setShared({ name: "민준", editing: true });
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "2026-09-28-11:00 보기" }));
    expect(await screen.findByText("참여 가능 1명")).toBeInTheDocument();

    addSchedule.mockResolvedValueOnce({ success: true, data: { userAvailableTimes: ["2026-09-28-10:00", "2026-09-28-11:00"] } });
    getAllSchedule.mockResolvedValue(undefined); // 저장 뒤 목록 재조회 실패
    fireEvent.click(screen.getByRole("button", { name: "11:00 칸" }));
    fireEvent.click(screen.getAllByRole("button", { name: "저장하기" })[0]);
    expect(await screen.findByText("참여 가능 2명")).toBeInTheDocument();
    expect(await screen.findByText("참여자와 일정을 불러오지 못했습니다.")).toBeInTheDocument();
    const left = screen.getAllByTestId("grid").find((grid) => grid.getAttribute("data-info"));
    expect(JSON.parse(left.getAttribute("data-info"))).toEqual(["2026-09-28-10:00:2", "2026-09-28-11:00:2"]);
    expect(readTableState(TABLE_ID).draft).toBeNull();
  });

  test("막 참여해 목록에 아직 없는 사람이 저장하면 목록에 더하고, 재조회가 실패해도 그 칸이 남는다(새 화면과 같다)", async () => {
    // Codex 최종 검증(2026-09-30): 참여 직후 목록이 늦으면 저장한 시간을 목록에 넣지 못했다.
    mockIsDesktop = true;
    localStorage.setItem("tableId", TABLE_ID);
    localStorage.setItem("name", "새사람");
    setShared({ name: "새사람", editing: true });
    await renderPage(); // 목록에는 민준·서연만 있다
    addSchedule.mockResolvedValueOnce({ success: true, data: { userAvailableTimes: ["2026-09-28-11:00"] } });
    getAllSchedule.mockResolvedValue(undefined); // 저장 뒤 목록 재조회 실패
    fireEvent.click(await screen.findByRole("button", { name: "11:00 칸" }));
    fireEvent.click(screen.getAllByRole("button", { name: "저장하기" })[0]);
    expect(await screen.findByText("참여자와 일정을 불러오지 못했습니다.")).toBeInTheDocument();
    const left = screen.getAllByTestId("grid").find((grid) => grid.getAttribute("data-info"));
    expect(JSON.parse(left.getAttribute("data-info"))).toEqual(["2026-09-28-10:00:2", "2026-09-28-11:00:2"]);
  });

  test("탭을 바꿔도 고른 사람들을 비우지 않는다(새 화면의 입력 모드와 같다)", async () => {
    // Codex 재검증(2026-09-30): 전에는 "내 일정"·"인원" 탭을 누를 때마다 비워 새 화면의 두 명 선택이 사라졌다.
    localStorage.setItem("tableId", TABLE_ID);
    localStorage.setItem("name", "민준");
    setShared({ name: "민준", editing: false, picks: ["민준", "서연"] });
    await renderPage();
    await waitFor(() => expect(readTableState(TABLE_ID).picks).toEqual(["민준", "서연"]));
    fireEvent.click(screen.getByText("내 일정"));
    expect(await screen.findByText(/님의 가능한 시간을 선택해주세요/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("인원 (2)"));
    expect(await screen.findByText("참여자 (2)")).toBeInTheDocument();
    expect(readTableState(TABLE_ID).picks).toEqual(["민준", "서연"]);
  });

  test("두 명 이상 고른 상태도 그대로 보인다(칸마다 그중 되는 수, 모두 되는 칸이 가장 진하다)", async () => {
    // Codex 최종 검증(2026-09-30): 전에는 기존 화면이 "전체"로 보여 두 화면이 다른 것을 보였다.
    setShared({ picks: ["민준", "서연"] });
    // 불러오는 동안·복원하는 순간에도 고른 사람을 한 번도 비워 쓰지 않는다(Codex 재검증).
    const original = Storage.prototype.setItem;
    const writes = [];
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(function record(key, value) {
      if (key === KEY) writes.push(JSON.parse(value).picks);
      return original.call(this, key, value);
    });
    await renderPage();
    await waitFor(() => expect(writes.length).toBeGreaterThan(0));
    spy.mockRestore();
    expect(writes.filter((picks) => !picks || picks.length !== 2)).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: /전체 시간표 보기/ }));
    expect(await screen.findByText("민준·서연 님의 시간표")).toBeInTheDocument();
    const grid = screen.getByTestId("grid");
    expect(grid.getAttribute("data-max")).toBe("2");
    expect(grid.getAttribute("data-golden")).toBe("off");
    expect(JSON.parse(grid.getAttribute("data-info"))).toEqual(["2026-09-28-10:00:2", "2026-09-28-11:00:1"]);
    await waitFor(() => expect(readTableState(TABLE_ID).picks).toEqual(["민준", "서연"]));
  });

  test("기존 화면에서 한 사람을 고르면 여러 명 선택을 그 사람으로 바꾸고 남긴다", async () => {
    setShared({ picks: ["민준", "서연"] });
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /전체 시간표 보기/ }));
    fireEvent.click(await screen.findByText("민준·서연"));
    fireEvent.click(screen.getByText("민준"));
    expect(await screen.findByText("민준 님의 시간표")).toBeInTheDocument();
    await waitFor(() => expect(readTableState(TABLE_ID).picks).toEqual(["민준"]));
  });

  test("목록에서 사라진 사람은 고른 목록에서 뺀다", async () => {
    setShared({ picks: ["민준", "지운사람", "서연"] });
    await renderPage();
    await waitFor(() => expect(readTableState(TABLE_ID).picks).toEqual(["민준", "서연"]));
  });

  test("다른 표로 옮기면 앞 표의 이름·저장 안 한 칸·화면이 새 표에 섞이지 않는다", async () => {
    // Codex 최종 검증(2026-09-30): 같은 화면을 이어 써서 오른쪽 화면이 남고 앞 표의 칸이 새 표 공유 상태에 적혔다.
    localStorage.setItem("tableId", TABLE_ID);
    localStorage.setItem("name", "민준");
    setShared({ name: "민준", editing: true, draft: ["2026-09-28-11:00"] });
    const view = await renderPage();
    expect(await screen.findByText(/님의 가능한 시간을 선택해주세요/)).toBeInTheDocument();

    const second = "mock-only-second-table";
    mockTableId = second;
    view.rerender(page());
    expect(await screen.findByRole("button", { name: "참여 / 수정" })).toBeInTheDocument();
    expect(screen.queryByText(/님의 가능한 시간을 선택해주세요/)).not.toBeInTheDocument();
    expect(readTableState(second)).toMatchObject({ name: null, draft: null, editing: false });
    expect(readTableState(TABLE_ID)).toMatchObject({ name: "민준", draft: ["2026-09-28-11:00"] });
  });
});

describe("순위 창(기존 화면)", () => {
  test("여러 명을 골라 왔으면 순위 명단에서 그 사람들을 모두 표시한다", () => {
    // Codex 재검증(2026-09-30): 격자·인원 칩은 두 명을 표시하는데 순위 명단만 아무도 표시하지 않았다.
    render(
      <RankingList timeInfo={[{ time: "2026-09-28-10:00", count: 2, members: ["민준", "서연"] }]}
        selectedName={null} selectedNames={["민준", "서연"]} setSelectedName={jest.fn()} usersCount={3} />,
    );
    fireEvent.click(screen.getByText(/참여 가능/));
    expect(screen.getByRole("button", { name: "민준" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "서연" })).toHaveAttribute("aria-pressed", "true");
  });

  test("인원이 같은 구간은 같은 순위다(새 화면과 같다)", () => {
    render(
      <RankingList timeInfo={[
        { time: "2026-09-28-10:00", count: 2, members: ["민준", "서연"] },
        { time: "2026-09-28-14:00", count: 2, members: ["민준", "지훈"] },
        { time: "2026-09-28-16:00", count: 1, members: ["서연"] },
      ]} selectedName={null} setSelectedName={jest.fn()} usersCount={3} />,
    );
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(screen.getAllByText("2")).toHaveLength(1);
  });
});
