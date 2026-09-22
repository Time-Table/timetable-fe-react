import { getSchedule } from "./schedule";
import { instance } from "./interceptors";

jest.mock("./interceptors", () => ({ instance: { get: jest.fn() } }));

beforeEach(() => jest.resetAllMocks());

test("집계 문서가 아직 없는 성공 응답은 빈 일정으로 구분한다", async () => {
  instance.get.mockResolvedValue({ success: true, message: "등록된 스케줄이 없습니다." });
  await expect(getSchedule("table")).resolves.toEqual([]);
});

test("저장된 집계 배열을 그대로 반환한다", async () => {
  const data = [{ time: "2026-09-22-10:00", colorNumber: 100 }];
  instance.get.mockResolvedValue({ success: true, data });
  await expect(getSchedule("table")).resolves.toEqual(data);
});

test.each([
  ["서버 실패", { response: { data: { success: false } } }, { success: false }],
  ["연결 실패", new Error("offline"), undefined],
])("%s를 정상적인 빈 일정으로 처리하지 않는다", async (_, error, expected) => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  instance.get.mockRejectedValue(error);
  try {
    await expect(getSchedule("table")).resolves.toEqual(expected);
  } finally {
    log.mockRestore();
  }
});
