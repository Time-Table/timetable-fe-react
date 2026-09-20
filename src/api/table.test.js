import { createTable } from "./table";
import { sendEvent } from "./event";
import { instance } from "./interceptors";
import { getVisitorId } from "../utils/analytics";
import { grantAdmin } from "../utils/admin";
import { clearTableScopedStorage, VISITOR_KEY } from "../utils/storage";

jest.mock("./interceptors", () => ({ instance: { post: jest.fn() } }));

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  instance.post.mockResolvedValue({ success: true, data: { tableId: "new-table" } });
});

const create = () => createTable("모임", ["2026-09-25"], "09:00", "18:00", []);

test("생성 요청은 기존 이벤트와 같은 브라우저 ID를 사용하고 표 이동 뒤에도 보존한다", async () => {
  const visitorId = getVisitorId();
  await create();
  expect(instance.post).toHaveBeenCalledWith("/api/tables", expect.objectContaining({ creatorVisitorId: visitorId }));
  localStorage.setItem("tableId", "previous-table");
  clearTableScopedStorage();
  await create();
  expect(instance.post.mock.calls[1][1].creatorVisitorId).toBe(visitorId);
});

test("관리자 생성에는 익명 생성자 ID를 넣지 않는다", async () => {
  grantAdmin("admin");
  await create();
  expect(instance.post.mock.calls[0][1]).not.toHaveProperty("creatorVisitorId");
});

test("추가된 생성자 ID 읽기가 실패해도 생성 API 호출은 진행한다", async () => {
  const original = Storage.prototype.getItem;
  const read = jest.spyOn(Storage.prototype, "getItem").mockImplementation(function (key) {
    if (key === VISITOR_KEY) throw new Error("blocked");
    return original.call(this, key);
  });
  try {
    await expect(create()).resolves.toEqual({ success: true, data: { tableId: "new-table" } });
    expect(instance.post.mock.calls[0][1]).not.toHaveProperty("creatorVisitorId");
  } finally {
    read.mockRestore();
  }
});

test("이벤트는 공통 인터셉터의 조용한 요청으로 보내고 실패를 삼킨다", async () => {
  instance.post.mockRejectedValue(new Error("429"));
  const payload = { name: "table_view", visitorId: "v", tableId: "t" };
  await expect(sendEvent(payload)).resolves.toBeNull();
  expect(instance.post).toHaveBeenCalledWith("/api/events", payload, { silent: true });
});
