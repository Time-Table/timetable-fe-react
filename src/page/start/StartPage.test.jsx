import { StrictMode } from "react";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import StartPage from "./StartPage";
import { createTable } from "../../api/table";
import { sendEvent } from "../../api/event";
import Swal from "sweetalert2";

jest.mock("../../api/table", () => ({ createTable: jest.fn() }));
jest.mock("../../api/event", () => ({ sendEvent: jest.fn() }));
jest.mock("../../api/blogView", () => ({ sendBlogView: jest.fn() }));
jest.mock("../../api/visit", () => ({ trackVisit: jest.fn() }));
jest.mock("../../Seo", () => () => null);
jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
// 현재 testing-library 버전과 React 18.3의 act API를 맞춘다.
jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"), act: require("react").act,
}));
jest.mock("../../component/TimeGrid", () => () => null);
// MAU 신뢰 표시 시안은 가짜 API가 늦게 답해 화면 테스트에 섞이지 않게 뺀다(MauHero.test.jsx에서 따로 본다).
// 페이지가 넘긴 "이제 나타나도 된다" 신호(introDone)만 표시해 둔다.
jest.mock("./MauHero", () => ({ introDone }) => <i data-testid="mau-hero" data-intro-done={introDone ? "1" : "0"} />);
jest.mock("framer-motion", () => {
  const React = require("react");
  const components = {};
  // 스크롤 연출용 모션 값. jsdom에는 스크롤이 없으니 0에 머무는 값으로 둔다. 스크롤 위치(scrollY)도 이 값을 쓴다.
  const still = { get: () => global.mockScrollProgress ?? 0, on: () => () => {} };
  return {
    // 기본은 움직임 줄이기(첫 화면 소개 없음). 소개를 보는 테스트만 global.mockReducedMotion = false로 바꾼다.
    useReducedMotion: () => global.mockReducedMotion ?? true,
    useScroll: () => ({ scrollY: still, scrollYProgress: still }),
    useTransform: () => still,
    useMotionValue: () => ({ ...still, set: () => {} }),
    // 테스트가 global.mockScrollProgress를 정하면 첫 렌더 뒤 그 스크롤 진행도로 한 번 알린다.
    useMotionValueEvent: (value, event, callback) => {
      React.useEffect(() => {
        if (global.mockScrollProgress != null) callback(global.mockScrollProgress);
      }, []); // eslint-disable-line react-hooks/exhaustive-deps
    },
    AnimatePresence: ({ children }) => children,
    motion: new Proxy({}, { get: (_, tag) => {
      if (!components[tag]) {
        components[tag] = React.forwardRef(({
          initial, animate, exit, transition, whileInView, viewport,
          whileHover, whileTap, layout, ...props
        }, ref) => React.createElement(tag, { ...props, ref }));
      }
      return components[tag];
    } }),
  };
});

const TABLE_ID = "test-table";
const TABLE_URL = `${window.location.origin}/table/${TABLE_ID}`;

/**
 * touch: (pointer: coarse)를 참으로 돌려 휴대폰처럼 만든다.
 * narrow: 폭 질의(max-width)를 모두 참으로 돌려 한 줄로 쌓이는 화면으로 만든다. 나머지는 넓은 화면(false)이다.
 */
const mockMatchMedia = (touch, narrow = false) => {
  window.matchMedia = (query) => ({
    matches: (touch && query === "(pointer: coarse)") || (narrow && query.includes("max-width")),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
};

const Location = () => <div data-testid="path">{useLocation().pathname}</div>;

const mount = () => render(
  <StrictMode>
    <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="*" element={null} />
      </Routes>
      <Location />
    </MemoryRouter>
  </StrictMode>,
);

/** requestAnimationFrame 으로 미룬 초점 이동을 끝낸다. */
const flushFrames = () => act(() => new Promise((done) => requestAnimationFrame(() => done())));

const openLock = async () => {
  fireEvent.click(screen.getAllByRole("button", { name: "이대로 만들기" })[0]);
  await flushFrames();
  return screen.getByRole("dialog", { name: "이대로 만들까요?" });
};

const createAndOpenDone = async () => {
  createTable.mockResolvedValue({ success: true, data: { tableId: TABLE_ID } });
  await openLock();
  fireEvent.click(screen.getByRole("button", { name: "링크 만들기" }));
  const done = await screen.findByRole("dialog", { name: "링크가 만들어졌습니다" });
  await flushFrames();
  return done;
};

const inviteShares = () => sendEvent.mock.calls.filter(([e]) => e.name === "invite_share");

const originalMatchMedia = window.matchMedia;
const originalShare = navigator.share;
const originalClipboard = navigator.clipboard;
const originalExec = document.execCommand;
const originalScrollTo = window.scrollTo;

beforeEach(() => {
  jest.clearAllMocks();
  // jsdom에는 스크롤이 없다(호출하면 "Not implemented" 오류를 찍는다).
  window.scrollTo = jest.fn();
  localStorage.clear();
  window.CSS = window.CSS || {};
  window.CSS.escape = window.CSS.escape || ((s) => s);
  mockMatchMedia(false);
  delete navigator.share;
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } });
  document.execCommand = jest.fn(() => false);
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  if (originalShare) navigator.share = originalShare;
  else delete navigator.share;
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: originalClipboard });
  document.execCommand = originalExec;
  window.scrollTo = originalScrollTo;
  document.body.style.overflow = "";
});

describe("미리보기 기본 주", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("일요일에 열면 오늘 하루뿐인 이번 주 대신 고른 날이 더 많은 다음 주를 먼저 보여준다", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-04T10:00:00"));
    mount();
    expect(screen.getByText("2 / 2주")).toBeInTheDocument();
  });

  test("목요일에 열면 나흘을 고른 이번 주를 보여준다", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-01T10:00:00"));
    mount();
    expect(screen.getByText("1 / 2주")).toBeInTheDocument();
  });

  test("금요일에 열면 사흘뿐인 이번 주 대신 나흘을 고른 다음 주를 보여준다", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-02T10:00:00"));
    mount();
    expect(screen.getByText("2 / 2주")).toBeInTheDocument();
  });
});

describe("새로고침해도 맨 위에서 시작", () => {
  test("열면 브라우저 스크롤 되살리기를 끄고 맨 위로 가며, 떠나면 원래대로 돌린다", () => {
    window.history.scrollRestoration = "auto";
    const { unmount } = mount();
    expect(window.history.scrollRestoration).toBe("manual");
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    unmount();
    expect(window.history.scrollRestoration).toBe("auto");
  });
});

describe("MAU 시안 등장 신호", () => {
  // jsdom의 Range에는 위치 재기가 없다. 소개가 제목 글자 영역을 잴 때만 빈 상자를 돌려준다.
  const hadRangeRect = typeof Range.prototype.getBoundingClientRect === "function";
  beforeEach(() => {
    jest.useFakeTimers();
    if (!hadRangeRect) {
      Range.prototype.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 });
    }
  });
  afterEach(() => {
    if (!hadRangeRect) delete Range.prototype.getBoundingClientRect;
    jest.useRealTimers();
    delete global.mockReducedMotion;
  });

  test("첫 화면 소개가 도는 동안은 기다리게 하고, 소개(2.8초)가 끝나면 나타나라고 알린다", () => {
    global.mockReducedMotion = false;
    mount();
    expect(screen.getByRole("main")).toHaveAttribute("data-intro", "on");
    expect(screen.getByTestId("mau-hero")).toHaveAttribute("data-intro-done", "0");

    act(() => jest.advanceTimersByTime(2700));
    expect(screen.getByTestId("mau-hero")).toHaveAttribute("data-intro-done", "0");

    act(() => jest.advanceTimersByTime(200));
    expect(screen.getByRole("main")).not.toHaveAttribute("data-intro");
    expect(screen.getByTestId("mau-hero")).toHaveAttribute("data-intro-done", "1");
  });

  test("움직임 줄이기 설정이면 소개가 없으니 처음부터 나타나라고 알린다", () => {
    mount();
    expect(screen.getByTestId("mau-hero")).toHaveAttribute("data-intro-done", "1");
  });
});

describe("만들기 전 확인 창", () => {
  test("열리면 '링크 만들기'로 초점이 가고 만들 내용을 요약해 보여준다", async () => {
    mount();
    const dialog = await openLock();
    expect(screen.getByRole("button", { name: "링크 만들기" })).toHaveFocus();
    expect(dialog).toHaveTextContent("팀 프로젝트 회의");
    expect(dialog).toHaveTextContent("10:00 ~ 20:00");
    expect(dialog).toHaveTextContent("7일");
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("Esc는 초점 위치와 상관없이 닫고, 만들기 버튼으로 초점을 돌려준다", async () => {
    mount();
    screen.getAllByRole("button", { name: "이대로 만들기" })[0].focus();
    await openLock();
    document.body.focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "이대로 만들까요?" })).not.toBeInTheDocument();
    // 하단 고정 막대의 버튼은 창이 떠 있는 동안 내려갔다 다시 그려지므로, 같은 요소가 아니라 만들기 버튼이면 된다.
    // eslint-disable-next-line testing-library/no-node-access -- 초점이 어느 만들기 버튼에 있는지 본다
    expect(screen.getAllByRole("button", { name: "이대로 만들기" })).toContain(document.activeElement);
    expect(document.body.style.overflow).toBe("");
    expect(createTable).not.toHaveBeenCalled();
  });

  test("Tab은 창 안에서만 돈다", async () => {
    mount();
    await openLock();
    const close = screen.getByRole("button", { name: "닫기" });
    const create = screen.getByRole("button", { name: "링크 만들기" });
    create.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(create).toHaveFocus();
  });

  test("생성 실패는 완료 창을 띄우지 않고 실패를 알린다", async () => {
    createTable.mockResolvedValue({ success: false, message: "서버 오류" });
    mount();
    await openLock();
    fireEvent.click(screen.getByRole("button", { name: "링크 만들기" }));
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith("생성 실패", "서버 오류", "error"));
    expect(screen.queryByRole("dialog", { name: "링크가 만들어졌습니다" })).not.toBeInTheDocument();
  });
});

describe("완료 창", () => {
  const clarityEvents = () => (window.clarity?.mock.calls || []).map(([, name]) => name);

  test("PC는 링크 복사가 주 버튼이다. 누를 때 공유 시도를 한 번 기록하고, 복사가 된 뒤에만 복사됐다고 말한다", async () => {
    window.clarity = jest.fn();
    mount();
    await createAndOpenDone();
    expect(screen.getByRole("textbox", { name: "테이블 링크" })).toHaveValue(TABLE_URL);
    const primary = screen.getByRole("button", { name: "링크 복사하기" });
    expect(primary).toHaveFocus();
    expect(screen.queryByRole("button", { name: "링크 공유하기" })).not.toBeInTheDocument();

    fireEvent.click(primary);
    expect(inviteShares()).toHaveLength(1);
    expect(inviteShares()[0][0].tableId).toBe(TABLE_ID);
    expect(clarityEvents()).toContain("tt_invite_share_copy");
    await screen.findByText("링크를 복사했습니다. 단톡방에 붙여 넣으세요.");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(TABLE_URL);
    delete window.clarity;
  });

  test("복사가 막혀도 시도는 기록하되, 복사됐다고 하지 않고 주소를 골라 둔다", async () => {
    navigator.clipboard.writeText.mockRejectedValue(new Error("denied"));
    mount();
    await createAndOpenDone();
    fireEvent.click(screen.getByRole("button", { name: "링크 복사하기" }));
    await screen.findByText("자동 복사가 되지 않았습니다. 위 링크를 직접 복사해 주세요.");
    expect(screen.queryByText(/링크를 복사했습니다/)).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "테이블 링크" })).toHaveFocus();
    expect(inviteShares()).toHaveLength(1);
  });

  test("휴대폰은 공유 창이 주 버튼이다. 누를 때마다 시도로 기록하고(닫아도), Clarity에는 공유 창으로 남긴다", async () => {
    mockMatchMedia(true);
    window.clarity = jest.fn();
    navigator.share = jest.fn().mockResolvedValue();
    mount();
    await createAndOpenDone();
    const share = screen.getByRole("button", { name: "링크 공유하기" });
    expect(share).toHaveFocus();

    fireEvent.click(share);
    expect(navigator.share).toHaveBeenCalledWith(expect.objectContaining({ url: TABLE_URL, title: "팀 프로젝트 회의" }));
    expect(inviteShares()).toHaveLength(1);
    expect(clarityEvents()).toEqual(expect.arrayContaining(["tt_invite_share_native"]));
    expect(clarityEvents()).not.toContain("tt_invite_share_copy");

    const abort = new Error("cancel");
    abort.name = "AbortError";
    navigator.share.mockRejectedValueOnce(abort);
    fireEvent.click(share);
    await act(() => Promise.resolve());
    expect(inviteShares()).toHaveLength(2);
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    delete window.clarity;
  });

  test("공유 창이 실패해 복사로 넘어가도 시도를 두 번 세지 않는다", async () => {
    mockMatchMedia(true);
    window.clarity = jest.fn();
    navigator.share = jest.fn().mockRejectedValue(new Error("NotAllowedError"));
    mount();
    await createAndOpenDone();
    fireEvent.click(screen.getByRole("button", { name: "링크 공유하기" }));
    await screen.findByText("링크를 복사했습니다. 단톡방에 붙여 넣으세요.");
    expect(inviteShares()).toHaveLength(1);
    expect(clarityEvents().filter((n) => n.startsWith("tt_invite_share"))).toEqual(["tt_invite_share_native"]);
    delete window.clarity;
  });

  test("Esc나 '테이블로 이동'은 만든 테이블로 가고 스크롤 잠금을 푼다", async () => {
    mount();
    await createAndOpenDone();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("path")).toHaveTextContent(`/table/${TABLE_ID}`);
    expect(document.body.style.overflow).toBe("");
  });

  test("성공은 경로별로 한 번만 기록한다", async () => {
    window.clarity = jest.fn();
    mount();
    await createAndOpenDone();
    expect(sendEvent.mock.calls.filter(([e]) => e.name === "create_success")).toHaveLength(1);
    expect(window.clarity).toHaveBeenCalledWith("event", "tt_create_success_landing");
    delete window.clarity;
  });
});

describe("휴대폰 스크롤 문구", () => {
  const prompt = () => screen.queryByText("모임 이름부터 바꿔 보세요");

  test("한 줄로 쌓이는 화면에서는 원래 제목(h1)을 남긴 채 문구를 두고, 누르면 입력칸의 기본 제목을 전부 골라 둔다", () => {
    mockMatchMedia(true, true);
    mount();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("단체 약속 잡기, 이 링크 하나면 끝");
    expect(prompt()).toBeInTheDocument();
    expect(prompt()).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(prompt());
    const input = screen.getByRole("textbox", { name: "모임 이름" });
    expect(input).toHaveFocus();
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, input.value.length]);
  });

  test("휴대폰은 제목 → 카톡방 → 미리보기 → 입력 유도 문구 → 모임 이름 입력칸 순서다(v2 랜딩과 같다)", () => {
    mockMatchMedia(true, true);
    mount();
    const order = [
      screen.getByRole("heading", { level: 1 }),
      screen.getByText("팀플 단체 톡방"),
      screen.getByRole("region", { name: /타임테이블/ }),
      prompt(),
      screen.getByRole("textbox", { name: "모임 이름" }),
    ];
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  test("제목을 한 번 고치면 문구를 감추되 자리는 남겨 아래 폼이 밀리지 않는다", () => {
    mockMatchMedia(true, true);
    mount();
    fireEvent.change(screen.getByRole("textbox", { name: "모임 이름" }), { target: { value: "동아리 모임" } });
    expect(prompt()).toBeInTheDocument();
    expect(prompt()).toHaveStyle({ visibility: "hidden" });
  });

  test("휴대폰 첫 화면은 폼을 문구 줄 자리만큼 올려 미리보기에 붙이고, 그만큼 내리면 제자리에 둔다(v2 랜딩과 같다)", () => {
    // jsdom은 배치를 하지 않아 문구 줄 높이(44px)만 정해 준다. 격자 간격은 jsdom이 계산하지 않아 0이다.
    const height = jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(44);
    mockMatchMedia(true, true);
    // 폼 상자(section)에 직접 넣은 translate를 읽어야 해서 노드에 접근한다.
    // eslint-disable-next-line testing-library/no-node-access
    const form = () => screen.getByRole("textbox", { name: "모임 이름" }).closest("section");
    try {
      const { unmount } = mount();
      expect(form().style.translate).toBe("0 -44px");
      // 첫 화면에서 입력칸을 누르면 틈이 다 열린 자리(44px)로 먼저 옮겨, 키보드가 입력칸을 가리지 않게 한다.
      window.scrollTo.mockClear();
      act(() => screen.getByRole("textbox", { name: "모임 이름" }).focus());
      expect(window.scrollTo).toHaveBeenCalledWith(0, 44);
      expect(form().style.translate).toBe("");
      unmount();

      global.mockScrollProgress = 44;
      mount();
      expect(form().style.translate).toBe("");
    } finally {
      height.mockRestore();
      delete global.mockScrollProgress;
    }
  });

  test("좌우로 갈라진 넓은 화면에는 문구가 없다", () => {
    mount();
    expect(prompt()).not.toBeInTheDocument();
  });
});

test("휴대폰은 만들기 버튼이 폼(시간 범위) 바로 아래에 있고, 화면 아래에 떠 있는 막대는 없다", () => {
  mockMatchMedia(true, true);
  mount();
  const buttons = screen.getAllByRole("button", { name: "이대로 만들기" });
  expect(buttons).toHaveLength(1);
  const timeRange = screen.getByText("시간 범위");
  expect(timeRange.compareDocumentPosition(buttons[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  // 제목 입력칸에 초점을 줘도 버튼은 그대로다(전에는 하단 막대를 내렸다).
  fireEvent.focus(screen.getByRole("textbox", { name: "모임 이름" }));
  expect(screen.getAllByRole("button", { name: "이대로 만들기" })).toHaveLength(1);
});

describe("헤더 밀어 올리기", () => {
  let header;
  beforeEach(() => {
    // 실제 사이트 헤더(Header.jsx)는 App이 그린다. 여기서는 같은 표시를 단 요소로 대신한다.
    header = document.createElement("header");
    header.setAttribute("data-site-header", "");
    document.body.appendChild(header);
  });
  afterEach(() => {
    header.remove();
    delete global.mockScrollProgress;
  });

  test("한 줄로 쌓이는 화면에서는 스크롤 진행도만큼 헤더를 올리고 옅게 한다", () => {
    mockMatchMedia(true, true);
    global.mockScrollProgress = 0.5;
    const view = mount();
    expect(header.style.transform).toBe("translateY(-50%)");
    expect(header.style.opacity).toBe("0.5");
    expect(header.style.visibility).toBe("");
    view.unmount();
    expect(header.style.transform).toBe("");
    expect(header.style.opacity).toBe("");
  });

  test("끝까지 올라가면 키보드·스크린리더에서도 뺀다", () => {
    mockMatchMedia(true, true);
    global.mockScrollProgress = 1;
    mount();
    expect(header.style.transform).toBe("translateY(-100%)");
    expect(header.style.visibility).toBe("hidden");
  });

  test("좌우로 갈라진 넓은 화면에서는 헤더를 건드리지 않는다", () => {
    global.mockScrollProgress = 1;
    mount();
    expect(header.style.transform).toBe("");
    expect(header.style.visibility).toBe("");
  });
});

describe("후보 날짜 달력", () => {
  // 날짜만 2026-09-28(월)로 고정한다. 이 날 기준 고를 수 있는 마지막 날은 2027-09-30이다.
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-28T16:30:00"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const button = (name) => screen.getByRole("button", { name });
  const pressed = (name) => button(name).getAttribute("aria-pressed");

  test("오늘부터 7일이 선택된 채로 이번 달이 열리고, 달이 걸치면 달별 개수를 보여준다", () => {
    mount();
    expect(screen.getByText("2026년 9월")).toBeInTheDocument();
    expect(pressed("오늘, 9월 28일 월요일")).toBe("true");
    expect(pressed("9월 30일 수요일")).toBe("true");
    // 지난 날은 누를 수 없다
    expect(screen.queryByRole("button", { name: /9월 27일/ })).toBeNull();
    expect(button("이전 달")).toBeDisabled();
    expect(screen.getByText(/선택 · 9월 3일 · 10월 4일/)).toBeInTheDocument();
  });

  test("요일을 누르면 그 달의 그 요일 세로줄이 전부 켜지고, 다시 누르면 전부 꺼진다", () => {
    mount();
    fireEvent.click(button("다음 달"));
    const thursday = button("10월 목요일 전부");
    expect(thursday).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(thursday);
    ["1", "8", "15", "22", "29"].forEach((d) => expect(pressed(`10월 ${d}일 목요일`)).toBe("true"));
    expect(thursday).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(thursday);
    ["1", "8", "15", "22", "29"].forEach((d) => expect(pressed(`10월 ${d}일 목요일`)).toBe("false"));
    // 다른 요일은 그대로다
    expect(pressed("10월 2일 금요일")).toBe("true");
  });

  test("주 번호를 누르면 그 주 가로줄만 켜고 끈다", () => {
    mount();
    fireEvent.click(button("다음 달"));
    fireEvent.click(button("10월 2주 전부"));
    expect(pressed("10월 5일 월요일")).toBe("true");
    expect(pressed("10월 11일 일요일")).toBe("true");
    expect(pressed("10월 12일 월요일")).toBe("false");

    fireEvent.click(button("10월 2주 전부"));
    expect(pressed("10월 5일 월요일")).toBe("false");
    expect(pressed("10월 11일 일요일")).toBe("false");
  });

  test("'이번 달 전부'는 그 달에서 고를 수 있는 날만 켜고, 전부 켜져 있으면 전부 끈다", () => {
    mount();
    // 9월은 오늘부터 30일까지 사흘만 고를 수 있고, 기본값으로 이미 켜져 있다.
    const september = button("9월 고를 수 있는 날 전부");
    expect(september).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(september);
    expect(pressed("오늘, 9월 28일 월요일")).toBe("false");
    expect(screen.getByText(/선택 · 10월 4일/)).toBeInTheDocument();

    fireEvent.click(button("다음 달"));
    fireEvent.click(button("10월 고를 수 있는 날 전부"));
    expect(screen.getByText(/선택 · 10월 31일/)).toBeInTheDocument();
  });

  test("다음 달은 12개월 뒤 달(2027년 9월)까지만 넘어가고, 그 달 말일까지 고를 수 있다", () => {
    mount();
    for (let i = 0; i < 12; i += 1) fireEvent.click(button("다음 달"));
    expect(screen.getByText("2027년 9월")).toBeInTheDocument();
    expect(button("다음 달")).toBeDisabled();
    fireEvent.click(button("9월 30일 목요일"));
    expect(pressed("9월 30일 목요일")).toBe("true");
  });

  test("한꺼번에 고른 날짜를 날짜순으로 보낸다", async () => {
    createTable.mockResolvedValue({ success: false });
    mount();
    fireEvent.click(button("다음 달"));
    fireEvent.click(button("10월 목요일 전부"));
    fireEvent.click(screen.getAllByRole("button", { name: "이대로 만들기" })[0]);
    act(() => {
      jest.advanceTimersByTime(50);
    });
    fireEvent.click(button("링크 만들기"));
    // 실패 응답으로 확인 창이 닫히는 갱신까지 기다린다.
    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    expect(createTable.mock.calls[0][1]).toEqual([
      "2026-09-28", "2026-09-29", "2026-09-30",
      "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
      "2026-10-08", "2026-10-15", "2026-10-22", "2026-10-29",
    ]);
  });
});

describe("넓은 화면 제목", () => {
  afterEach(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  test("스크롤하면 제목이 제자리에서 흐려지고, 맨 위로 돌아오면 다시 보인다", () => {
    mount();
    const title = screen.getByRole("heading", { level: 1 });
    expect(title.style.opacity).toBe("1");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 200 });
    fireEvent.scroll(window);
    expect(title.style.opacity).toBe("0");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    fireEvent.scroll(window);
    expect(title.style.opacity).toBe("1");
  });

  test("제목 위 MAU 시안도 제목과 함께 흐려지고 다시 보인다", () => {
    mount();
    // eslint-disable-next-line testing-library/no-node-access -- 시안을 감싼 자리 칸의 인라인 투명도를 본다
    const slot = screen.getByTestId("mau-hero").parentElement;
    expect(slot.style.opacity).toBe("1");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 200 });
    fireEvent.scroll(window);
    expect(slot.style.opacity).toBe("0");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    fireEvent.scroll(window);
    expect(slot.style.opacity).toBe("1");
  });

  test("한 줄로 쌓이는 화면에서는 이 흐려짐을 쓰지 않는다", () => {
    mockMatchMedia(true, true);
    mount();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 200 });
    fireEvent.scroll(window);
    expect(screen.getByRole("heading", { level: 1 }).style.opacity).not.toBe("0");
  });
});

describe("첫 화면 순서와 명단 시점", () => {
  test("제목이 카톡방 그림보다 먼저 온다(휴대폰에서 위에 쌓인다)", () => {
    mockMatchMedia(true, true);
    mount();
    const title = screen.getByRole("heading", { level: 1 });
    const room = screen.getByText("팀플 단체 톡방");
    expect(title.compareDocumentPosition(room) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("넓은 화면은 골든타임 명단을 입력칸 유도가 끝난 8초 뒤에 연다", () => {
    jest.useFakeTimers();
    try {
      mount();
      // jsdom은 칸 위치가 0이라 명단 카드 자체는 그려지지 않는다. 칸 버튼의 열림 표시로 확인한다.
      const opened = () => screen.queryAllByRole("button", { expanded: true });
      expect(opened()).toHaveLength(0);
      act(() => {
        jest.advanceTimersByTime(7900);
      });
      expect(opened()).toHaveLength(0);
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(opened()).toHaveLength(1);
      expect(opened()[0]).toHaveAccessibleName(/6명 가능/);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("휴대폰 시간 선택 창", () => {
  test("시간 칸을 누르면 아래 창에서 고르고, 고르면 닫힌다. Esc로도 닫힌다", () => {
    mockMatchMedia(true, true);
    mount();
    fireEvent.click(screen.getByRole("button", { name: "시작 시간 10:00" }));
    const sheet = screen.getByRole("dialog", { name: "시작 시간" });
    expect(within(sheet).getAllByRole("button", { pressed: false })).toHaveLength(23);
    fireEvent.click(within(sheet).getByRole("button", { name: "13:00" }));
    expect(screen.queryByRole("dialog", { name: "시작 시간" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "시작 시간 13:00" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "종료 시간 20:00" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "종료 시간" })).not.toBeInTheDocument();
  });

  test("넓은 화면은 기본 선택 목록을 쓴다", () => {
    mount();
    expect(screen.getByRole("combobox", { name: "시작 시간" })).toHaveValue("10:00");
  });
});

describe("단계 번호와 추천 모임 이름", () => {
  test("모임 이름·후보 날짜·시간 범위 앞에 1·2·3 번호가 붙고, 입력칸·묶음 이름은 그대로다", () => {
    mount();
    const input = screen.getByRole("textbox", { name: "모임 이름" });
    expect(screen.getByText("모임 이름", { selector: "label" })).toHaveAttribute("for", input.id);
    expect(screen.getByText("모임 이름", { selector: "label" })).toHaveAttribute("data-step", "1");
    expect(screen.getByRole("group", { name: "후보 날짜" })).toBeInTheDocument();
    expect(screen.getByText("후보 날짜", { selector: "legend" })).toHaveAttribute("data-step", "2");
    expect(screen.getByText("시간 범위")).toHaveAttribute("data-step", "3");
  });

  test("넓은 화면은 추천 모임 이름 줄을 숨겨 두었다가 입력칸을 누르면 보이고, 고른 뒤에도 남는다", () => {
    mount();
    const group = () => screen.queryByRole("group", { name: "추천 모임 이름" });
    expect(group()).not.toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "모임 이름" });
    fireEvent.click(input);
    fireEvent.click(within(group()).getByRole("button", { name: "주간 스터디" }));
    expect(input).toHaveValue("주간 스터디");
    expect(screen.getByRole("combobox", { name: "시작 시간" })).toHaveValue("09:00");
    expect(group()).toBeVisible();
  });

  test("넓은 화면에서 키보드로 입력칸에 들어와도 추천 줄이 보인다", () => {
    mount();
    act(() => screen.getByRole("textbox", { name: "모임 이름" }).focus());
    expect(screen.getByRole("group", { name: "추천 모임 이름" })).toBeVisible();
  });

  test("휴대폰은 입력칸을 누르지 않아도 추천 이름 줄이 보인다", () => {
    mockMatchMedia(true, true);
    mount();
    const group = screen.getByRole("group", { name: "추천 모임 이름" });
    fireEvent.click(within(group).getByRole("button", { name: "이번 달 회식" }));
    expect(screen.getByRole("textbox", { name: "모임 이름" })).toHaveValue("이번 달 회식");
    expect(screen.getByRole("group", { name: "추천 모임 이름" })).toBeInTheDocument();
  });
});

describe("랜딩 폼 보조 계측(Clarity)", () => {
  const landingEvents = () =>
    window.clarity.mock.calls
      .filter(([m, n]) => m === "event" && /^tt_landing_(form|preset|preview)/.test(n))
      .map(([, n]) => n);

  beforeEach(() => {
    window.clarity = jest.fn();
  });
  afterEach(() => {
    delete window.clarity;
    delete window.IntersectionObserver;
  });

  test("처음 그린 값에서는 남기지 않고, 폼을 처음 바꾸면 한 번만 남긴다", () => {
    mount();
    expect(landingEvents()).toEqual([]);
    const input = screen.getByRole("textbox", { name: "모임 이름" });
    fireEvent.change(input, { target: { value: "동아리" } });
    fireEvent.change(input, { target: { value: "동아리 모임" } });
    fireEvent.change(screen.getByRole("combobox", { name: "시작 시간" }), { target: { value: "11:00" } });
    expect(landingEvents()).toEqual(["tt_landing_form_start"]);
  });

  test("추천 이름 칩과 미리보기 칸 직접 열기는 각각 처음 한 번만 남긴다", () => {
    mount();
    const input = screen.getByRole("textbox", { name: "모임 이름" });
    fireEvent.click(input);
    const group = screen.getByRole("group", { name: "추천 모임 이름" });
    fireEvent.click(within(group).getByRole("button", { name: "주간 스터디" }));
    fireEvent.click(within(group).getByRole("button", { name: "이번 달 회식" }));
    const cell = screen.getAllByRole("button", { name: /명 가능$/ })[0];
    fireEvent.click(cell);
    fireEvent.click(cell);
    fireEvent.click(cell);
    expect(landingEvents()).toEqual(["tt_landing_preset", "tt_landing_form_start", "tt_landing_preview_open"]);
  });

  test("모임 입력 상자가 절반 이상 보이면 한 번 남긴다", () => {
    const observers = [];
    window.IntersectionObserver = class {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.disconnect = jest.fn();
        observers.push(this);
      }
      observe(el) {
        this.el = el;
      }
    };
    mount();
    const formObserver = observers.find((o) => o.options?.threshold === 0.5 && o.el?.tagName === "SECTION");
    act(() => formObserver.callback([{ isIntersecting: false, intersectionRatio: 0 }]));
    act(() => formObserver.callback([{ isIntersecting: true, intersectionRatio: 0.3 }]));
    expect(landingEvents()).toEqual([]);
    act(() => formObserver.callback([{ isIntersecting: true, intersectionRatio: 0.6 }]));
    act(() => formObserver.callback([{ isIntersecting: true, intersectionRatio: 0.9 }]));
    expect(landingEvents()).toEqual(["tt_landing_form_view"]);
    expect(formObserver.disconnect).toHaveBeenCalled();
  });
});
