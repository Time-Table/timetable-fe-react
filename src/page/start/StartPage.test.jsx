import { StrictMode } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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
jest.mock("framer-motion", () => {
  const React = require("react");
  const components = {};
  // 스크롤 연출용 모션 값. jsdom에는 스크롤이 없으니 0에 머무는 값으로 둔다.
  const still = { get: () => global.mockScrollProgress ?? 0, on: () => () => {} };
  return {
    useReducedMotion: () => true,
    useScroll: () => ({ scrollYProgress: still }),
    useTransform: () => still,
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

beforeEach(() => {
  jest.clearAllMocks();
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
  document.body.style.overflow = "";
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

  test("Esc는 초점 위치와 상관없이 닫고, 연 버튼으로 초점을 돌려준다", async () => {
    mount();
    const cta = screen.getAllByRole("button", { name: "이대로 만들기" })[0];
    cta.focus();
    await openLock();
    document.body.focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "이대로 만들까요?" })).not.toBeInTheDocument();
    expect(cta).toHaveFocus();
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

  test("한 줄로 쌓이는 화면에서는 원래 제목(h1)을 남긴 채 문구를 겹쳐 두고, 누르면 입력칸의 기본 제목을 전부 골라 둔다", () => {
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

  test("제목을 한 번 고치면 문구를 거둔다", () => {
    mockMatchMedia(true, true);
    mount();
    fireEvent.change(screen.getByRole("textbox", { name: "모임 이름" }), { target: { value: "동아리 모임" } });
    expect(prompt()).not.toBeInTheDocument();
  });

  test("좌우로 갈라진 넓은 화면에는 문구가 없다", () => {
    mount();
    expect(prompt()).not.toBeInTheDocument();
  });
});

test("휴대폰에서 제목을 입력하는 동안에는 하단 고정 만들기 막대를 내린다", () => {
  mockMatchMedia(true, true);
  mount();
  const count = () => screen.getAllByRole("button", { name: "이대로 만들기", hidden: true }).length;
  const before = count();
  const input = screen.getByRole("textbox", { name: "모임 이름" });
  fireEvent.focus(input);
  expect(count()).toBe(before - 1);
  fireEvent.blur(input);
  expect(count()).toBe(before);
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
