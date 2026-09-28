import { StrictMode } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LandingV4Page from "./LandingV4Page";
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

const mockMatchMedia = (touch, narrow = false) => {
  window.matchMedia = (query) => ({
    matches: (touch && query === "(pointer: coarse)") || (narrow && query.includes("max-width")),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
};

const mount = () =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={["/landing-v4"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/landing-v4" element={<LandingV4Page />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>
  );

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  jest.clearAllMocks();
  window.CSS = window.CSS || {};
  window.CSS.escape = window.CSS.escape || ((s) => s);
  mockMatchMedia(false);
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("랜딩 실험 v4", () => {
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

  test("방문·퍼널 기록을 보내지 않는다", () => {
    mount();
    expect(sendEvent).not.toHaveBeenCalled();
    expect(trackVisit).not.toHaveBeenCalled();
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
