import { instance } from "./interceptors";

// 공통 설정(setupTests)의 꺼짐 흉내를 풀고 실제 함수를 본다.
jest.unmock("./experiment");
jest.mock("./interceptors", () => ({ instance: { get: jest.fn() } }));
const { getTableAbState } = jest.requireActual("./experiment");

beforeEach(() => jest.resetAllMocks());

test("진행 중 상태를 받으면 running", async () => {
  instance.get.mockResolvedValue({ success: true, data: { key: "table-ab-2", state: "running" } });
  expect(await getTableAbState()).toEqual({ ok: true, running: true, state: "running" });
  expect(instance.get).toHaveBeenCalledWith("/api/experiments/table-ab", expect.objectContaining({ timeout: 1500, silent: true }));
});

test("옛 BE(404)는 실패가 아니라 꺼짐, 시간 초과·오류는 이유와 함께 실패", async () => {
  instance.get.mockRejectedValueOnce({ response: { status: 404 } });
  expect(await getTableAbState()).toEqual({ ok: true, running: false, state: "off" });
  instance.get.mockRejectedValueOnce({ code: "ECONNABORTED", message: "timeout of 1500ms exceeded" });
  expect(await getTableAbState()).toEqual({ ok: false, running: false, reason: "timeout" });
  instance.get.mockRejectedValueOnce({ response: { status: 500 } });
  expect(await getTableAbState()).toEqual({ ok: false, running: false, reason: "error" });
});

test("200이어도 성공 표시나 알 수 없는 상태면 꺼짐이 아니라 실패(error)", async () => {
  instance.get.mockResolvedValueOnce({});
  expect(await getTableAbState()).toEqual({ ok: false, running: false, reason: "error" });
  instance.get.mockResolvedValueOnce({ success: false, data: { state: "running" } });
  expect(await getTableAbState()).toEqual({ ok: false, running: false, reason: "error" });
  instance.get.mockResolvedValueOnce({ success: true, data: { state: "paused" } });
  expect(await getTableAbState()).toEqual({ ok: false, running: false, reason: "error" });
  instance.get.mockResolvedValueOnce({ success: true, data: { state: "stopped" } });
  expect(await getTableAbState()).toEqual({ ok: true, running: false, state: "stopped" });
});
