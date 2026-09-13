import { joinBlogStats, sortBlogRows } from "./blogStats";

const posts = [
  { slug: "a", title: "A", category: "협업", date: "2026-01-01" },
  { slug: "b", title: "B", category: "협업", date: "2026-02-01" },
  { slug: "c", title: "C", category: "건강", date: "2026-03-01" },
];

describe("블로그 통계 조인", () => {
  test("조회 기록이 없는 글도 0으로 표에 남는다", () => {
    const rows = joinBlogStats(posts, { posts: [{ slug: "b", views: 5, visitors: 3, lastViewedAt: "2026-09-13T00:00:00Z" }] });
    expect(rows).toHaveLength(3);
    expect(rows.find((r) => r.slug === "a")).toMatchObject({ views: 0, visitors: 0, lastViewedAt: null, listed: true });
    expect(rows.find((r) => r.slug === "b")).toMatchObject({ views: 5, visitors: 3, title: "B" });
  });

  test("목록에 없는 slug는 지우지 않고 listed=false로 붙인다", () => {
    const rows = joinBlogStats(posts, { posts: [{ slug: "ghost", views: 2, visitors: 1 }] });
    expect(rows.find((r) => r.slug === "ghost")).toMatchObject({ listed: false, title: null, date: null, views: 2 });
  });

  test("통계가 없어도(미배포·실패) 글 목록은 만든다", () => {
    expect(joinBlogStats(posts, null)).toHaveLength(3);
    expect(joinBlogStats(posts, { error: "notDeployed" }).every((r) => r.views === 0)).toBe(true);
  });
});

describe("블로그 표 정렬", () => {
  const rows = joinBlogStats(posts, {
    posts: [
      { slug: "a", views: 5, visitors: 2 },
      { slug: "c", views: 5, visitors: 4 },
      { slug: "ghost", views: 99, visitors: 9 },
    ],
  });

  test("조회순은 views → visitors → 최신 발행일 순이고, 목록에 없는 글은 맨 아래다", () => {
    expect(sortBlogRows(rows, "views").map((r) => r.slug)).toEqual(["c", "a", "b", "ghost"]);
  });

  test("최신순은 발행일 내림차순이다", () => {
    expect(sortBlogRows(rows, "recent").map((r) => r.slug)).toEqual(["c", "b", "a", "ghost"]);
  });

  test("원본 배열을 바꾸지 않는다", () => {
    const before = rows.map((r) => r.slug);
    sortBlogRows(rows, "recent");
    expect(rows.map((r) => r.slug)).toEqual(before);
  });
});
