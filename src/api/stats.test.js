import { getLandingStats } from "./stats";
import { instance as axios } from "./interceptors";

// setupTests가 전체 테스트용으로 바꿔 둔 이 모듈을 여기서는 진짜로 쓴다.
jest.unmock("./stats");
jest.mock("./interceptors", () => ({ instance: { get: jest.fn() } }));

describe("getLandingStats (랜딩 신뢰 표시 집계)", () => {
  afterEach(() => {
    axios.get.mockReset();
  });

  test("정상 응답이면 count와 asOf를 돌려주고, 2.5초 제한과 조용한 실패 옵션으로 부른다", async () => {
    axios.get.mockResolvedValue({ success: true, data: { count: 223, asOf: "2026-10-03", startDate: "2026-09-04", days: 30 } });
    await expect(getLandingStats()).resolves.toEqual({ count: 223, asOf: "2026-10-03" });
    expect(axios.get).toHaveBeenCalledWith("/api/stats/landing", { timeout: 2500, silent: true });
  });

  test.each([
    ["성공 표시가 없음", { data: { count: 223 } }],
    ["count가 숫자가 아님", { success: true, data: { count: "223" } }],
    ["data가 없음", { success: true }],
  ])("모양이 다르면 null: %s", async (_, body) => {
    axios.get.mockResolvedValue(body);
    await expect(getLandingStats()).resolves.toBeNull();
  });

  test("실패(404·시간 초과·네트워크)는 null이다", async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });
    await expect(getLandingStats()).resolves.toBeNull();
    axios.get.mockRejectedValue({ code: "ECONNABORTED", message: "timeout of 2500ms exceeded" });
    await expect(getLandingStats()).resolves.toBeNull();
  });
});
