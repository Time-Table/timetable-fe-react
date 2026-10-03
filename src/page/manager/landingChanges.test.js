import { LANDING_CHANGES, changeDate, changesOn, formatChangeTime, SIDE_LABELS } from "./landingChanges";

describe("랜딩 A/B 기간 중 변경 기록", () => {
  test("정본(하네스 specs/product.md) 기록과 같은 8건이다", () => {
    expect(LANDING_CHANGES).toEqual([
      { at: "2026-09-29T01:22:57+09:00", side: "AB", title: "A/B 1회차 시작(startAt)", detail: "FE 20d3e3f 운영 반영. 이 시각부터 집계" },
      { at: "2026-09-29T02:38:00+09:00", side: "B", title: "B PC 스크롤 안내 첫 등장 애니메이션·글자 21px", detail: "FE 40e031d" },
      { at: "2026-09-30T00:29:00+09:00", side: "계측", title: "봇 요청의 방문·이벤트 저장 안 함", detail: "BE 39f1fbb. 전후로 방문·랜딩 수가 줄 수 있음" },
      { at: "2026-10-02T00:01:47+09:00", side: "AB", title: "B 휴대폰 첫 화면 폼 끌어올리기·소개, A·B 새로고침 맨 위", detail: "FE dfce31f·67ffb01" },
      { at: "2026-10-02T00:54:01+09:00", side: "AB", title: "미리보기 기본 주(고른 날이 많은 주)", detail: "FE 82e9290" },
      { at: "2026-10-04T01:38:00+09:00", side: "AB", title: "신뢰 표시 세 줄, 휴대폰 만들기 버튼 폼 아래, A 문구 줄·흐림", detail: "FE 9ea772d·8715151" },
      { at: "2026-10-04T02:26:00+09:00", side: "AB", title: "신뢰 표시 숫자를 집계 API로(100명 이하 숨김)", detail: "FE aa9926a·42260a8·52f3013, BE 3debd10·6956990" },
      { at: "2026-10-04T02:42:44+09:00", side: "AB", title: "A PC 신뢰 표시 두 줄 배치, 숫자 색 primary", detail: "FE f7451e6·41d6f5a" },
    ]);
    // 설명에는 어느 저장소의 어느 커밋인지 적는다.
    LANDING_CHANGES.forEach((c) => expect(c.detail).toMatch(/\b(FE|BE) [0-9a-f]{7}/));
  });

  test("시각순이고 모두 시작(startAt) 이후다", () => {
    const times = LANDING_CHANGES.map((c) => new Date(c.at).getTime());
    expect(times.every((v) => Number.isFinite(v))).toBe(true);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(LANDING_CHANGES[0].title).toMatch(/시작/);
  });

  test("쪽 표시는 정해진 값만 쓴다", () => {
    LANDING_CHANGES.forEach((c) => expect(Object.keys(SIDE_LABELS)).toContain(c.side));
  });

  test("한국시간 날짜로 모아 그날 변경을 찾는다", () => {
    expect(changeDate(LANDING_CHANGES[0])).toBe("2026-09-29");
    expect(changesOn("2026-10-04").map((c) => c.title)).toHaveLength(3);
    expect(changesOn("2026-10-03")).toHaveLength(0);
    expect(formatChangeTime(LANDING_CHANGES[LANDING_CHANGES.length - 1])).toBe("10-04 02:42");
  });

  test("실행 환경 시간대가 UTC여도 한국시간으로 계산하고, 자정은 24:00이 아니라 00:00이다", () => {
    const saved = process.env.TZ;
    process.env.TZ = "UTC";
    try {
      // UTC로는 10-03 15:00이지만 한국시간 날짜는 10-04다.
      const midnight = { at: "2026-10-04T00:00:00+09:00" };
      expect(new Date(midnight.at).getUTCDate()).toBe(3);
      expect(changeDate(midnight)).toBe("2026-10-04");
      expect(formatChangeTime(midnight)).toBe("10-04 00:00");
      expect(changeDate({ at: "2026-10-03T23:59:59+09:00" })).toBe("2026-10-03");
      expect(changesOn("2026-10-04")).toHaveLength(3);
      expect(formatChangeTime(LANDING_CHANGES[LANDING_CHANGES.length - 1])).toBe("10-04 02:42");
    } finally {
      // 원래 값이 없었으면 되돌릴 때 문자열 "undefined"가 남지 않게 지운다.
      if (saved === undefined) delete process.env.TZ;
      else process.env.TZ = saved;
    }
  });
});
