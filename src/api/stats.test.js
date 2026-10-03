import { getLandingStats, fetchLandingStats } from "./stats";
import { instance as axios } from "./interceptors";

// setupTests가 전체 테스트용으로 바꿔 둔 이 모듈을 여기서는 진짜로 쓴다.
jest.unmock("./stats");
jest.mock("./interceptors", () => ({ instance: { get: jest.fn() } }));

const GOOD = { success: true, data: { count: 223, asOf: "2026-10-03", startDate: "2026-09-04", days: 30 } };
const withData = (patch) => ({ ...GOOD, data: { ...GOOD.data, ...patch } });

describe("getLandingStats (랜딩 신뢰 표시 집계)", () => {
  afterEach(() => {
    axios.get.mockReset();
  });

  test("정상 응답이면 count와 asOf를 돌려주고, 2.5초 제한과 조용한 실패 옵션으로 부른다", async () => {
    axios.get.mockResolvedValue(GOOD);
    await expect(getLandingStats()).resolves.toEqual({ count: 223, asOf: "2026-10-03" });
    expect(axios.get).toHaveBeenCalledWith("/api/stats/landing", { timeout: 2500, silent: true });
  });

  test("0건도 정상 응답이다(숨김 판단은 화면이 한다)", async () => {
    axios.get.mockResolvedValue(withData({ count: 0 }));
    await expect(getLandingStats()).resolves.toEqual({ count: 0, asOf: "2026-10-03" });
  });

  test.each([
    ["성공 표시가 없음", { data: GOOD.data }],
    ["성공 표시가 false", { ...GOOD, success: false }],
    ["data가 없음", { success: true }],
    ["count가 문자열", withData({ count: "223" })],
    ["count가 NaN", withData({ count: NaN })],
    ["count가 소수", withData({ count: 22.5 })],
    ["count가 음수", withData({ count: -1 })],
    ["count가 없음", withData({ count: undefined })],
    ["days가 30이 아님", withData({ days: 29 })],
    ["days가 없음", withData({ days: undefined })],
    ["asOf가 숫자", withData({ asOf: 20261003 })],
    ["asOf 형식이 다름", withData({ asOf: "2026/10/03" })],
    ["asOf가 없음", withData({ asOf: undefined })],
    ["startDate가 없음", withData({ startDate: undefined })],
    ["startDate 형식이 다름", withData({ startDate: "9월 4일" })],
  ])("모양이 다르면 null: %s", async (_, body) => {
    axios.get.mockResolvedValue(body);
    await expect(getLandingStats()).resolves.toBeNull();
  });

  test("fetchLandingStats는 실패 이유를 구분해 돌려준다(매니저 페이지용)", async () => {
    axios.get.mockResolvedValue(GOOD);
    await expect(fetchLandingStats()).resolves.toEqual({ ok: true, count: 223, asOf: "2026-10-03", startDate: "2026-09-04", days: 30 });
    axios.get.mockResolvedValue(withData({ days: 29 }));
    await expect(fetchLandingStats()).resolves.toEqual({ ok: false, reason: "invalid" });
    axios.get.mockRejectedValue({ response: { status: 404 } });
    await expect(fetchLandingStats()).resolves.toEqual({ ok: false, reason: "missing" });
    axios.get.mockRejectedValue({ code: "ECONNABORTED", message: "timeout of 2500ms exceeded" });
    await expect(fetchLandingStats()).resolves.toEqual({ ok: false, reason: "timeout" });
    axios.get.mockRejectedValue({ response: { status: 500 } });
    await expect(fetchLandingStats()).resolves.toEqual({ ok: false, reason: "error" });
  });

  test("실패(404·시간 초과·네트워크)는 null이다", async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });
    await expect(getLandingStats()).resolves.toBeNull();
    axios.get.mockRejectedValue({ code: "ECONNABORTED", message: "timeout of 2500ms exceeded" });
    await expect(getLandingStats()).resolves.toBeNull();
    axios.get.mockRejectedValue(new Error("Network Error"));
    await expect(getLandingStats()).resolves.toBeNull();
  });
});
