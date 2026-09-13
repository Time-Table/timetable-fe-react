/**
 * 관리자 블로그 탭의 표 데이터. 순수 함수라 DOM·API 없이 테스트한다.
 *
 * 기준은 FE의 blogPosts 전체(좌측 조인)다. 조회가 0인 글도 표에 나와야 교체 판단에 쓸 수 있다.
 * BE에는 있지만 blogPosts에 없는 slug(삭제된 글·임의 호출)는 지우지 않고 맨 아래 "목록에 없음"으로 둔다.
 */
export const joinBlogStats = (posts, stats) => {
  const statRows = stats?.posts || [];
  const bySlug = new Map(statRows.map((row) => [row.slug, row]));

  const listed = posts.map((post) => {
    const row = bySlug.get(post.slug);
    return {
      slug: post.slug,
      title: post.title,
      category: post.category,
      date: post.date,
      views: row?.views || 0,
      visitors: row?.visitors || 0,
      lastViewedAt: row?.lastViewedAt || null,
      listed: true,
    };
  });

  const known = new Set(posts.map((post) => post.slug));
  const unlisted = statRows
    .filter((row) => !known.has(row.slug))
    .map((row) => ({
      slug: row.slug,
      title: null,
      category: null,
      date: null,
      views: row.views || 0,
      visitors: row.visitors || 0,
      lastViewedAt: row.lastViewedAt || null,
      listed: false,
    }));

  return [...listed, ...unlisted];
};

/**
 * 조회순: views↓ → visitors↓ → date↓
 * 최신순: date↓ → views↓
 * 목록에 없는 글은 어느 정렬에서든 맨 아래.
 */
export const sortBlogRows = (rows, sortBy) => {
  const byDateDesc = (a, b) => (b.date || "").localeCompare(a.date || "");
  const compare =
    sortBy === "recent"
      ? (a, b) => byDateDesc(a, b) || b.views - a.views
      : (a, b) => b.views - a.views || b.visitors - a.visitors || byDateDesc(a, b);

  return [...rows].sort((a, b) => {
    if (a.listed !== b.listed) return a.listed ? -1 : 1;
    return compare(a, b);
  });
};
