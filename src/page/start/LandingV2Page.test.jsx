import { StrictMode } from "react";
import { act, render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LandingV2Page from "./LandingV2Page";
import { sendEvent } from "../../api/event";
import { trackVisit } from "../../api/visit";

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
  // 구간 진행도(scrollYProgress)만 따로 정할 때 쓴다. global.mockStoryProgress가 없으면 위 값과 같다.
  const progress = { get: () => global.mockStoryProgress ?? global.mockScrollProgress ?? 0, on: () => () => {} };
  return {
    // 기본은 움직임 줄이기(첫 화면 소개 없음). 소개를 보는 테스트만 global.mockReducedMotion = false로 바꾼다.
    useReducedMotion: () => global.mockReducedMotion ?? true,
    useScroll: () => ({ scrollY: still, scrollYProgress: progress }),
    useTransform: () => still,
    useMotionValue: () => ({ ...still, set: () => {} }),
    // 테스트가 global.mockScrollProgress(또는 mockStoryProgress)를 정하면 첫 렌더 뒤 그 모션 값의 지금 값으로 한 번 알린다.
    useMotionValueEvent: (value, event, callback) => {
      React.useEffect(() => {
        if (global.mockScrollProgress != null || global.mockStoryProgress != null) callback(value.get());
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

const mockMatchMedia = (touch, narrow = false) => {
  window.matchMedia = (query) => ({
    matches: (touch && query === "(pointer: coarse)") || (narrow && query.includes("max-width")),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
};

/** preview: 미리보기 주소(/landing-v2)처럼 기록하지 않는다. false면 `/`에서 A/B 배정으로 뜬 v2다. */
const mount = ({ preview = true } = {}) =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={["/landing-v2"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/landing-v2" element={<LandingV2Page preview={preview} />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>
  );

const originalMatchMedia = window.matchMedia;
const originalScrollTo = window.scrollTo;

beforeEach(() => {
  jest.clearAllMocks();
  // jsdom에는 스크롤이 없다(호출하면 "Not implemented" 오류를 찍는다).
  window.scrollTo = jest.fn();
  window.CSS = window.CSS || {};
  window.CSS.escape = window.CSS.escape || ((s) => s);
  mockMatchMedia(false);
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  window.scrollTo = originalScrollTo;
});

describe("랜딩 실험 v2", () => {
  test("미리보기는 고른 날이 더 많은 주를 먼저 보여준다(일·금요일이면 다음 주, 목요일이면 이번 주)", () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date("2026-10-04T10:00:00"));
      let view = mount();
      expect(screen.getByText("2 / 2주")).toBeInTheDocument();
      view.unmount();

      jest.setSystemTime(new Date("2026-10-01T10:00:00"));
      view = mount();
      expect(screen.getByText("1 / 2주")).toBeInTheDocument();
      view.unmount();

      // 금요일: 이번 주는 금·토·일 사흘, 다음 주는 월~목 나흘이다.
      jest.setSystemTime(new Date("2026-10-02T10:00:00"));
      mount();
      expect(screen.getByText("2 / 2주")).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  test("새로고침해도 맨 위에서 시작하게 브라우저 스크롤 되살리기를 끄고, 떠나면 원래대로 돌린다", () => {
    window.history.scrollRestoration = "auto";
    const { unmount } = mount();
    expect(window.history.scrollRestoration).toBe("manual");
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    unmount();
    expect(window.history.scrollRestoration).toBe("auto");
  });

  test("넓은 화면은 단톡방·스크롤 안내·대화·제목(h1 하나)으로 시작한다", () => {
    mount();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("단체 약속 잡기, 이제 링크 하나면 끝");
    expect(screen.getByText("스크롤을 내려 대화를 이어 보세요")).toBeInTheDocument();
    [
      "주말에 회의 몇 시에 할까요..",
      "저는 일요일 3시 이후..!",
      "토, 일 점심 이후에 가능합니다!",
      "여기에 되는 시간 적어 주세요!",
    ].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument()
    );
    // 넓은 화면에는 휴대폰용 입력 유도 문구 줄이 없다.
    expect(screen.queryByText("모임 이름부터 바꿔 보세요")).not.toBeInTheDocument();
  });

  test("휴대폰은 제목 → 카톡방 → 미리보기 → 입력 유도 문구 → 모임 이름 입력칸 순서다", () => {
    mockMatchMedia(true, true);
    mount();
    const order = [
      screen.getByRole("heading", { level: 1 }),
      screen.getByText("팀플 단체 톡방"),
      screen.getByRole("region", { name: /타임테이블/ }),
      screen.getByText("모임 이름부터 바꿔 보세요"),
      screen.getByRole("textbox", { name: "모임 이름" }),
    ];
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.queryByText("스크롤을 내려 대화를 이어 보세요")).not.toBeInTheDocument();
  });

  test("휴대폰 첫 화면은 폼을 문구 줄 자리만큼 올려 미리보기에 붙이고, 그만큼 내리면 제자리에 둔다", () => {
    // jsdom은 배치를 하지 않아 문구 줄 높이(44px)만 정해 준다. 격자 간격은 jsdom이 계산하지 않아 0이다.
    const height = jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(44);
    mockMatchMedia(true, true);
    // 폼 상자(section)에 직접 넣은 translate를 읽어야 해서 노드에 접근한다(TimeGrid.test.jsx와 같은 사정).
    // eslint-disable-next-line testing-library/no-node-access
    const form = () => screen.getByRole("textbox", { name: "모임 이름" }).closest("section");
    const scrollTo = jest.spyOn(window, "scrollTo").mockImplementation(() => {});
    try {
      const { unmount } = mount();
      expect(form().style.translate).toBe("0 -44px");
      // 첫 화면에서 입력칸을 누르면 틈이 다 열린 자리(44px)로 먼저 옮겨, 키보드가 입력칸을 가리지 않게 한다.
      act(() => screen.getByRole("textbox", { name: "모임 이름" }).focus());
      expect(scrollTo).toHaveBeenCalledWith(0, 44);
      expect(form().style.translate).toBe("");
      unmount();

      global.mockScrollProgress = 44;
      mount();
      expect(form().style.translate).toBe("");
    } finally {
      height.mockRestore();
      scrollTo.mockRestore();
      delete global.mockScrollProgress;
    }
  });

  test("휴대폰 첫 진입은 제목·카톡방을 가운데에 두고 스크롤을 막았다가, 소개가 끝나면 제자리로 돌리고 스크롤을 연다", () => {
    jest.useFakeTimers();
    global.mockReducedMotion = false;
    mockMatchMedia(true, true);
    // 소개가 옮기는 두 요소. 제목은 h1을 감싼 칸, 카톡방은 방 이름이 든 창이다.
    // eslint-disable-next-line testing-library/no-node-access
    const lifted = () => [screen.getByRole("heading", { level: 1 }).parentElement, screen.getByText("팀플 단체 톡방").closest("[aria-hidden]")];
    let rects;
    try {
      // 가운데까지 거리는 제목(h1) 윗변과 카톡방 아랫변으로 잰다. 제목 칸 윗변(그 위 MAU 시안 자리 포함)으로 재면 안 된다.
      // 화면 높이 768, 헤더 72 → 가운데 420. h1 윗변 140, 카톡방 아랫변 400이면 420 - 270 = 150px.
      rects = jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function rect() {
        const box = (top, bottom) => ({ top, bottom, left: 0, right: 0, width: 0, height: bottom - top });
        if (this.tagName === "H1") return box(140, 200);
        if (this.contains(screen.getByRole("heading", { level: 1 }))) return box(100, 200);
        if (this.getAttribute("aria-hidden") === "true" && this.textContent.startsWith("팀플 단체 톡방")) return box(212, 400);
        return box(0, 0);
      });
      mount();
      expect(screen.getByRole("main")).toHaveAttribute("data-intro", "on");
      expect(document.body.style.overflow).toBe("hidden");
      lifted().forEach((el) => expect(el.style.getPropertyValue("--intro-dy")).toBe("150px"));

      // 소개 중에 브라우저가 이전 스크롤 위치를 늦게 되살리면(크롬 새로고침) 맨 위로 되돌린다.
      window.scrollTo.mockClear();
      Object.defineProperty(window, "scrollY", { configurable: true, value: 400 });
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });
      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
      Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });

      // 소개는 나머지(미리보기·폼)가 다 나타나는 2.75초에 끝난다.
      act(() => jest.advanceTimersByTime(3000));
      expect(screen.getByRole("main")).not.toHaveAttribute("data-intro");
      expect(document.body.style.overflow).toBe("");
      lifted().forEach((el) => expect(el.style.getPropertyValue("--intro-dy")).toBe(""));
    } finally {
      rects?.mockRestore();
      jest.useRealTimers();
      delete global.mockReducedMotion;
    }
  });

  test("휴대폰 MAU 시안은 첫 진입 소개가 끝난 뒤에 나타나라는 신호를 받는다", () => {
    jest.useFakeTimers();
    global.mockReducedMotion = false;
    mockMatchMedia(true, true);
    try {
      mount();
      expect(screen.getByTestId("mau-hero")).toHaveAttribute("data-intro-done", "0");
      act(() => jest.advanceTimersByTime(3000));
      expect(screen.getByTestId("mau-hero")).toHaveAttribute("data-intro-done", "1");
    } finally {
      jest.useRealTimers();
      delete global.mockReducedMotion;
    }
  });

  test("넓은 화면 MAU 시안은 이야기 제목이 거의 다 사라질 때(진행도 2.365/2.37) 나타나라는 신호를 받는다", () => {
    try {
      // 이야기 구간 진행도만 정한다. 페이지 스크롤 위치(scrollY)는 0이라, 신호가 스크롤 위치에 묶이면 실패한다.
      global.mockStoryProgress = 2.35 / 2.37;
      const { unmount } = mount();
      expect(screen.getByTestId("mau-hero")).toHaveAttribute("data-intro-done", "0");
      unmount();

      global.mockStoryProgress = 2.366 / 2.37;
      mount();
      expect(screen.getByTestId("mau-hero")).toHaveAttribute("data-intro-done", "1");
    } finally {
      delete global.mockStoryProgress;
    }
  });

  test("넓은 화면은 첫 화면 소개를 하지 않는다(스크롤 이야기가 맡는다)", () => {
    global.mockReducedMotion = false;
    try {
      mount();
      expect(screen.getByRole("main")).not.toHaveAttribute("data-intro");
      expect(document.body.style.overflow).toBe("");
    } finally {
      delete global.mockReducedMotion;
    }
  });

  test("랜딩과 같이 단계 번호가 붙고, 넓은 화면 추천 모임 이름은 숨겨 두었다가 입력칸을 누르면 보인다", () => {
    mount();
    const input = screen.getByRole("textbox", { name: "모임 이름" });
    expect(screen.getByText("모임 이름", { selector: "label" })).toHaveAttribute("for", input.id);
    expect(screen.getByText("모임 이름", { selector: "label" })).toHaveAttribute("data-step", "1");
    expect(screen.getByRole("group", { name: "후보 날짜" })).toBeInTheDocument();
    expect(screen.getByText("후보 날짜", { selector: "legend" })).toHaveAttribute("data-step", "2");
    expect(screen.getByText("시간 범위")).toHaveAttribute("data-step", "3");
    const group = () => screen.queryByRole("group", { name: "추천 모임 이름" });
    expect(group()).not.toBeInTheDocument();
    fireEvent.click(input);
    fireEvent.click(within(group()).getByRole("button", { name: "주말 나들이" }));
    expect(input).toHaveValue("주말 나들이");
    expect(group()).toBeVisible();
  });

  test("미리보기 주소는 방문·퍼널·Clarity 기록을 보내지 않는다", () => {
    window.clarity = jest.fn();
    mount();
    fireEvent.change(screen.getByRole("textbox", { name: "모임 이름" }), { target: { value: "동아리" } });
    expect(sendEvent).not.toHaveBeenCalled();
    expect(trackVisit).not.toHaveBeenCalled();
    expect(window.clarity).not.toHaveBeenCalled();
    delete window.clarity;
  });

  test("`/`에서 A/B로 뜨면 v1과 같은 퍼널·폼 계측을 보낸다(방문·landing_view는 LandingRoute 몫)", () => {
    window.clarity = jest.fn();
    mount({ preview: false });
    expect(trackVisit).not.toHaveBeenCalled();
    expect(sendEvent.mock.calls.map(([e]) => [e.name, e.creationPath])).toEqual([["create_view", "landing"]]);
    fireEvent.change(screen.getByRole("textbox", { name: "모임 이름" }), { target: { value: "동아리" } });
    const events = window.clarity.mock.calls.filter(([m]) => m === "event").map(([, n]) => n);
    expect(events).toEqual(["tt_create_view", "tt_create_view_landing", "tt_landing_form_start"]);
    delete window.clarity;
  });

  test("휴대폰은 시간 칸을 누르면 아래 창에서 시간을 고르고, 고르면 창이 닫힌다", () => {
    mockMatchMedia(true, true);
    mount();
    fireEvent.click(screen.getByRole("button", { name: "시작 시간 10:00" }));
    const sheet = screen.getByRole("dialog", { name: "시작 시간" });
    // 00:00~23:00이 한 화면 격자에 다 있다.
    expect(within(sheet).getAllByRole("button", { pressed: false })).toHaveLength(23);
    expect(within(sheet).getByRole("button", { pressed: true })).toHaveTextContent("10:00");
    fireEvent.click(within(sheet).getByRole("button", { name: "13:00" }));
    expect(screen.queryByRole("dialog", { name: "시작 시간" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "시작 시간 13:00" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "종료 시간 20:00" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "종료 시간" })).not.toBeInTheDocument();
  });

  test("넓은 화면은 기본 선택 목록을 그대로 쓴다", () => {
    mount();
    expect(screen.getByRole("combobox", { name: "시작 시간" })).toHaveValue("10:00");
    expect(screen.getByRole("combobox", { name: "종료 시간" })).toHaveValue("20:00");
  });
});
