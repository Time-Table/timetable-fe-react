import { createRequestSequence } from "./latestRequest";

describe("응답 순서 가드", () => {
  test("가장 마지막에 시작한 요청만 최신이다", () => {
    const seq = createRequestSequence();
    const first = seq.next();
    const second = seq.next();
    expect(first()).toBe(false);
    expect(second()).toBe(true);
  });

  test("기간을 빠르게 바꾸면 늦게 도착한 옛 응답은 버려지고 로딩도 끄지 않는다", async () => {
    const seq = createRequestSequence();
    let stats = null;
    let loading = false;

    const load = async (period, delay) => {
      const isLatest = seq.next();
      loading = true;
      try {
        await new Promise((r) => setTimeout(r, delay));
        if (!isLatest()) return;
        stats = period;
      } finally {
        if (isLatest()) loading = false;
      }
    };

    // 7일 요청이 느리고(30ms) 30일 요청이 빠르다(5ms) → 30일이 먼저 도착한다.
    const slow = load(7, 30);
    const fast = load(30, 5);
    await fast;
    expect(stats).toBe(30);
    expect(loading).toBe(false);

    await slow;
    expect(stats).toBe(30); // 옛 7일 응답이 덮지 않는다
    expect(loading).toBe(false); // 조기에 끈 적도, 다시 켠 적도 없다
  });
});
