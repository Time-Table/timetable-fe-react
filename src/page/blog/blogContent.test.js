import { parseContent, planImageSlots } from "./blogContent";

describe("본문 파서", () => {
  test("■ 문단은 소제목, 나머지는 문단이다. 기호는 뗀다", () => {
    const blocks = parseContent("첫 문단\n\n■ 소제목 하나\n\n둘째 문단\n\n■소제목 둘");
    expect(blocks).toEqual([
      { type: "paragraph", text: "첫 문단" },
      { type: "heading", text: "소제목 하나" },
      { type: "paragraph", text: "둘째 문단" },
      { type: "heading", text: "소제목 둘" },
    ]);
  });

  test("빈 블록과 빈 본문은 버린다", () => {
    expect(parseContent("a\n\n\n\n  \n\nb")).toHaveLength(2);
    expect(parseContent("")).toEqual([]);
    expect(parseContent(undefined)).toEqual([]);
  });

  test("기존 19편의 ■ 절이 전부 소제목으로 잡힌다", () => {
    const { blogPosts } = require("../../data/blogPosts");
    blogPosts.forEach((post) => {
      const headings = parseContent(post.content).filter((b) => b.type === "heading");
      const marks = (post.content.match(/■/g) || []).length;
      expect(headings).toHaveLength(marks);
      headings.forEach((h) => expect(h.text.startsWith("■")).toBe(false));
    });
  });
});

describe("이미지 자리", () => {
  const p = (text) => ({ type: "paragraph", text });
  const h = (text) => ({ type: "heading", text });

  test("이미지 하나는 본문 중간 문단 뒤에 들어간다", () => {
    const blocks = [p(1), p(2), p(3), p(4)];
    const slots = planImageSlots(blocks, ["img"]);
    expect([...slots.keys()]).toEqual([1]);
  });

  test("소제목 바로 뒤에 떨어지면 다음 블록 뒤로 미룬다", () => {
    const blocks = [p(1), h("제목"), p(3), p(4)];
    const slots = planImageSlots(blocks, ["img"]);
    expect([...slots.keys()]).toEqual([2]);
  });

  test("이미지가 없거나 본문이 없으면 비어 있다", () => {
    expect(planImageSlots([], ["img"]).size).toBe(0);
    expect(planImageSlots([p(1)], []).size).toBe(0);
  });

  test("마지막 블록이 소제목이어도 범위를 벗어나지 않는다", () => {
    const blocks = [p(1), h("끝")];
    const slots = planImageSlots(blocks, ["a", "b", "c"]);
    const keys = [...slots.keys()];
    keys.forEach((k) => expect(k).toBeLessThan(blocks.length));
    expect([...slots.values()].flat()).toHaveLength(3);
  });
});
