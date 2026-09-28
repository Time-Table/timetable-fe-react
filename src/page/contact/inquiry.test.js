import { LIMITS, collectContext, placeholdersFor, readFromPath, validateInquiry } from "./inquiry";
import { VISITOR_KEY } from "../../utils/storage";

const valid = {
  category: "bug",
  email: "user@example.com",
  summary: "시간 저장이 안 돼요",
  detail: "저장을 눌렀는데 반영되지 않습니다.",
  hope: "",
};

beforeEach(() => {
  localStorage.clear();
});

describe("validateInquiry", () => {
  test("올바른 문의는 오류가 없다", () => {
    expect(validateInquiry(valid)).toEqual({});
  });

  test("유형·한 줄 요약·자세한 내용이 비면 각각 오류를 준다", () => {
    const errors = validateInquiry({ category: "", email: " ", summary: " ", detail: "", hope: "" });
    expect(Object.keys(errors).sort()).toEqual(["category", "detail", "summary"]);
  });

  test("답장 받을 이메일은 선택이라 비워도 되고, 적었다면 형식을 본다", () => {
    expect(validateInquiry({ ...valid, email: "" }).email).toBeUndefined();
    expect(validateInquiry({ ...valid, email: "   " }).email).toBeUndefined();
    expect(validateInquiry({ ...valid, email: "not-an-email" }).email).toBeDefined();
  });

  test("서버와 같은 길이 기준을 쓴다", () => {
    expect(validateInquiry({ ...valid, email: "not-an-email" }).email).toBeDefined();
    expect(validateInquiry({ ...valid, summary: "가".repeat(LIMITS.SUMMARY + 1) }).summary).toBeDefined();
    expect(validateInquiry({ ...valid, detail: "가".repeat(LIMITS.DETAIL_MIN - 1) }).detail).toBeDefined();
    expect(validateInquiry({ ...valid, detail: "가".repeat(LIMITS.DETAIL_MIN) }).detail).toBeUndefined();
    expect(validateInquiry({ ...valid, detail: "가".repeat(LIMITS.DETAIL + 1) }).detail).toBeDefined();
    expect(validateInquiry({ ...valid, hope: "가".repeat(LIMITS.HOPE + 1) }).hope).toBeDefined();
  });

  test("앞뒤 공백은 길이에 세지 않는다", () => {
    expect(validateInquiry({ ...valid, detail: `   ${"가".repeat(9)}   ` }).detail).toBeDefined();
  });
});

test("유형을 고르지 않았으면 '기타'의 예시 문구를 보여 준다", () => {
  expect(placeholdersFor("").summary).toBe(placeholdersFor("other").summary);
  expect(placeholdersFor("bug").summary).toBe("예: 시간 저장이 안 돼요");
});

test("readFromPath 는 사이트 안 경로만 받는다", () => {
  expect(readFromPath({ from: "/table/abc" })).toBe("/table/abc");
  expect(readFromPath({ from: "//evil.example" })).toBeNull();
  expect(readFromPath({ from: "/\\evil.example" })).toBeNull();
  expect(readFromPath({ from: "https://evil.example" })).toBeNull();
  expect(readFromPath(null)).toBeNull();
  expect(readFromPath(undefined)).toBeNull();
});

describe("collectContext", () => {
  test("참여 이름은 그 이름이 속한 표(tableId)와 짝일 때만 보낸다", () => {
    localStorage.setItem("name", "철수");
    expect(collectContext(null).name).toBeUndefined();

    localStorage.setItem("tableId", "table-1");
    const context = collectContext("/table/table-1");
    expect(context.name).toBe("철수");
    expect(context.tableId).toBe("table-1");
    expect(context.fromPath).toBe("/table/table-1");
  });

  test("화면 크기·시간대·방문자 ID를 담는다", () => {
    localStorage.setItem(VISITOR_KEY, "visitor-1");
    window.innerWidth = 390;
    window.innerHeight = 844;
    const context = collectContext(null);
    expect(context.viewport).toBe("390x844");
    expect(typeof context.timeZone).toBe("string");
    expect(context.visitorId).toBe("visitor-1");
    expect(context.fromPath).toBeUndefined();
  });

  test("방문자 ID가 없으면 새로 만들지 않는다", () => {
    expect(collectContext(null).visitorId).toBeUndefined();
    expect(localStorage.getItem(VISITOR_KEY)).toBeNull();
  });
});
