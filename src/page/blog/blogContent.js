/**
 * 블로그 본문(content)을 블록으로 나눈다. 순수 함수라 DOM 없이 테스트한다.
 * `■ 소제목` 문단은 heading, 나머지는 paragraph.
 *
 * 소제목을 <p>가 아니라 <h2>로 그려야 검색·AI 요약이 글의 구조를 읽는다(specs/seo-strategy.md §9).
 */
const HEADING_MARK = /^■\s*/;

export const parseContent = (content) =>
  (content || "")
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      HEADING_MARK.test(block)
        ? { type: "heading", text: block.replace(HEADING_MARK, "") }
        : { type: "paragraph", text: block },
    );

/**
 * 본문 이미지(첫 장 제외)를 어느 블록 뒤에 넣을지 정한다.
 * 균등하게 나누되 소제목 바로 뒤에는 넣지 않는다 — 소제목과 첫 문단이 떨어지면 소제목이 캡션처럼 읽힌다.
 * 반환: Map<블록 인덱스, 그 블록 뒤에 넣을 이미지 배열>
 */
export const planImageSlots = (blocks, images) => {
  const slots = new Map();
  if (!blocks.length || !images.length) return slots;

  images.forEach((image, i) => {
    let index = Math.floor(blocks.length * ((i + 1) / (images.length + 1))) - 1;
    index = Math.max(0, Math.min(index, blocks.length - 1));
    while (blocks[index].type === "heading" && index < blocks.length - 1) index += 1;
    slots.set(index, [...(slots.get(index) || []), image]);
  });

  return slots;
};
