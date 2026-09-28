import { fnv1a32, landingVariantFor, assignLandingVariant, tagLandingVariant, LANDING_AB } from "./landingExperiment";
import { ADMIN_KEY, VISITOR_KEY } from "./storage";

jest.mock("../api/event", () => ({ sendEvent: jest.fn() }));
jest.mock("../api/blogView", () => ({ sendBlogView: jest.fn() }));

// 서버가 같은 계산을 하도록 명세(specs/api-contract.md "랜딩 A/B")에도 같은 값을 적어 둔다.
const V1_ID = "00000000-0000-4000-8000-000000000000"; // 칸 68
const V2_ID = "11111111-1111-4111-8111-111111111111"; // 칸 18

beforeEach(() => {
  localStorage.clear();
  delete window.clarity;
});

describe("배정 계산", () => {
  test("FNV-1a 32비트 표준 값과 같다", () => {
    expect(fnv1a32("")).toBe(0x811c9dc5);
    expect(fnv1a32("a")).toBe(0xe40c292c);
    expect(fnv1a32("foobar")).toBe(0xbf9cf968);
  });

  test("`landing-ab-1:방문자ID`의 해시를 100으로 나눈 칸이 50 미만이면 v2다", () => {
    expect(LANDING_AB).toMatchObject({ key: "landing-ab-1", v2Percent: 50, startDate: "2026-09-29" });
    expect(fnv1a32(`landing-ab-1:${V1_ID}`) % 100).toBe(68);
    expect(fnv1a32(`landing-ab-1:${V2_ID}`) % 100).toBe(18);
    expect(landingVariantFor(V1_ID)).toBe("v1");
    expect(landingVariantFor(V2_ID)).toBe("v2");
  });

  test("무작위 방문자 ID 4천 개를 넣으면 대략 반반으로 나뉜다", () => {
    let v2 = 0;
    for (let i = 0; i < 4000; i += 1) {
      const id = `${i.toString(16).padStart(8, "0")}-${Math.random().toString(16).slice(2, 10)}`;
      if (landingVariantFor(id) === "v2") v2 += 1;
    }
    expect(v2 / 4000).toBeGreaterThan(0.45);
    expect(v2 / 4000).toBeLessThan(0.55);
  });
});

describe("이 브라우저의 배정", () => {
  test("관리자가 아니면 저장된 방문자 ID로 정하고 지표에 넣는다. 같은 브라우저는 늘 같은 쪽이다", () => {
    localStorage.setItem(VISITOR_KEY, V2_ID);
    expect(assignLandingVariant("")).toEqual({ variant: "v2", inExperiment: true });
    expect(assignLandingVariant("")).toEqual({ variant: "v2", inExperiment: true });
    localStorage.setItem(VISITOR_KEY, V1_ID);
    expect(assignLandingVariant("")).toEqual({ variant: "v1", inExperiment: true });
  });

  test("방문자 ID가 없으면 새로 만들어 저장하고 그 ID로 정한다", () => {
    const { variant } = assignLandingVariant("");
    const id = localStorage.getItem(VISITOR_KEY);
    expect(id).toBeTruthy();
    expect(variant).toBe(landingVariantFor(id));
  });

  test("관리자가 아니면 `?landing=` 값을 받지 않는다(서버가 계산한 배정과 어긋나지 않게)", () => {
    localStorage.setItem(VISITOR_KEY, V1_ID);
    expect(assignLandingVariant("?landing=v2")).toEqual({ variant: "v1", inExperiment: true });
  });

  test("관리자는 v1을 보고 지표에서 빠지며, `?landing=v2`로 v2를 볼 수 있다", () => {
    localStorage.setItem(ADMIN_KEY, "token");
    localStorage.setItem(VISITOR_KEY, V2_ID);
    expect(assignLandingVariant("")).toEqual({ variant: "v1", inExperiment: false });
    expect(assignLandingVariant("?landing=v2")).toEqual({ variant: "v2", inExperiment: false });
  });

  test("저장소가 막혀 있으면 v1을 보고 지표에서 빠진다", () => {
    const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(assignLandingVariant("")).toEqual({ variant: "v1", inExperiment: false });
    spy.mockRestore();
  });
});

describe("Clarity 표시", () => {
  test("사용자 지정 태그와 노출 이벤트를 함께 남긴다", () => {
    window.clarity = jest.fn();
    tagLandingVariant("v2");
    expect(window.clarity.mock.calls).toEqual([
      ["set", "tt_landing_variant", "v2"],
      ["event", "tt_landing_view_v2"],
    ]);
  });

  test("관리자는 남기지 않고, Clarity가 없어도 오류가 나지 않는다", () => {
    localStorage.setItem(ADMIN_KEY, "token");
    window.clarity = jest.fn();
    tagLandingVariant("v1");
    expect(window.clarity).not.toHaveBeenCalled();
    localStorage.removeItem(ADMIN_KEY);
    delete window.clarity;
    expect(() => tagLandingVariant("v1")).not.toThrow();
  });
});
