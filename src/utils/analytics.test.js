import { EVENTS, getVisitorId, getSource, trackEvent } from "./analytics";
import { grantAdmin } from "./admin";
import { VISITOR_KEY, SOURCE_KEY } from "./storage";
import { sendEvent } from "../api/event";

jest.mock("../api/event", () => ({ sendEvent: jest.fn() }));

const setReferrer = (value) =>
  Object.defineProperty(document, "referrer", { value, configurable: true });

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  setReferrer("");
  window.history.replaceState({}, "", "/");
});

describe("방문자 식별자", () => {
  test("처음 호출하면 만들어지고 이후에는 같은 값을 준다", () => {
    const first = getVisitorId();

    expect(first).toBeTruthy();
    expect(getVisitorId()).toBe(first);
    expect(localStorage.getItem(VISITOR_KEY)).toBe(first);
  });
});

describe("유입 경로", () => {
  test("referrer가 없으면 direct", () => {
    expect(getSource()).toBe("direct");
  });

  test("외부 referrer는 호스트명으로 기록하고 www는 뗀다", () => {
    setReferrer("https://www.google.com/search?q=timetable");
    expect(getSource()).toBe("google.com");
  });

  test("utm_source가 referrer보다 우선한다", () => {
    setReferrer("https://naver.com/");
    window.history.replaceState({}, "", "/?utm_source=blog");
    expect(getSource()).toBe("blog");
  });

  test("사이트 내부 이동은 유입으로 치지 않는다", () => {
    setReferrer(`${window.location.origin}/create`);
    expect(getSource()).toBe("direct");
  });

  test("첫 방문 값을 계속 유지한다 (first-touch)", () => {
    setReferrer("https://google.com/");
    expect(getSource()).toBe("google.com");

    // 이후 사이트 안을 돌아다녀도 최초 출처가 덮이면 안 된다.
    setReferrer(`${window.location.origin}/table/abc`);
    expect(getSource()).toBe("google.com");
    expect(localStorage.getItem(SOURCE_KEY)).toBe("google.com");
  });

  test("깨진 referrer에도 예외 없이 direct로 떨어진다", () => {
    setReferrer("not-a-valid-url");
    expect(getSource()).toBe("direct");
  });
});

describe("이벤트 전송", () => {
  test("일반 사용자의 이벤트는 전송된다", () => {
    trackEvent(EVENTS.TABLE_VIEW, "table-1");

    expect(sendEvent).toHaveBeenCalledTimes(1);
    expect(sendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "table_view",
        tableId: "table-1",
        source: "direct",
        device: expect.stringMatching(/^(mobile|tablet|desktop)$/),
        visitorId: expect.any(String),
      }),
    );
  });

  test("관리자의 이벤트는 전송되지 않는다", () => {
    grantAdmin("admin-token");
    trackEvent(EVENTS.TABLE_VIEW, "table-1");

    expect(sendEvent).not.toHaveBeenCalled();
  });

  test("관리자 판정은 호출 시점마다 다시 확인한다", () => {
    trackEvent(EVENTS.LANDING_VIEW);
    expect(sendEvent).toHaveBeenCalledTimes(1);

    grantAdmin("admin-token");
    trackEvent(EVENTS.LANDING_VIEW);
    expect(sendEvent).toHaveBeenCalledTimes(1);
  });
});

describe("이벤트 이름", () => {
  test("값이 중복되지 않는다", () => {
    const values = Object.values(EVENTS);
    expect(new Set(values).size).toBe(values.length);
  });

  test("백엔드 정의와 같은 11개 단계를 갖는다", () => {
    expect(Object.values(EVENTS).sort()).toEqual(
      [
        "create_cta_click",
        "create_submit",
        "create_success",
        "create_view",
        "invite_share",
        "join_submit",
        "join_success",
        "landing_view",
        "ranking_open",
        "schedule_save",
        "table_view",
      ].sort(),
    );
  });
});
