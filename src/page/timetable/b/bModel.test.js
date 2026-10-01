import {
  blocksOf,
  calWeeks,
  commonBlocksOf,
  datesOf,
  duration,
  firstWeekOf,
  goldenKeyOf,
  infoOf,
  maxOf,
  periodOf,
  rankBlocks,
  resolveName,
  timesOf,
  unreadOf,
  validateJoin,
  weekRangeOf,
} from "./bModel";

// 새 화면 계산(확정 시안 shared.js·kit.js·wx.js와 같은 규칙). 합성 자료만 쓴다.
const table = {
  tableId: "t",
  title: "표",
  dates: ["2026-10-06", "2026-10-05", "2026-10-13"],
  startHour: "10:00",
  endHour: "12:00",
  banedCells: ["2026-10-05-11:30"],
};
const grid = (users, t = table) => {
  const info = infoOf(users, t);
  return { dates: datesOf(t), times: timesOf(t), locked: new Set(t.banedCells), info };
};

test("칸 시각은 실제 시작·끝까지(10:30 시작이면 10:30부터, 끝은 24시까지, 기존 화면과 같다)", () => {
  expect(timesOf({ startHour: "10:30", endHour: "12:00" })).toEqual(["10:30", "11:00", "11:30"]);
  expect(timesOf({ startHour: "10:00", endHour: "11:30" })).toEqual(["10:00", "10:30", "11:00"]);
  expect(timesOf({ startHour: "22:00", endHour: "25:00" })).toEqual(["22:00", "22:30", "23:00", "23:30"]);
  expect(timesOf({ startHour: "12:00", endHour: "12:00" })).toEqual([]);
});

test("칸별 인원은 표 칸만, 막은 칸 밖만, 한 사람의 같은 시간은 한 번만 센다", () => {
  const info = infoOf(
    [
      { name: "민준", availableTimes: ["2026-10-05-10:00", "2026-10-05-10:00", "2026-10-05-11:30", "2026-10-07-10:00"] },
      { name: "서연", availableTimes: ["2026-10-05-10:00"] },
    ],
    table,
  );
  expect(info.get("2026-10-05-10:00")).toEqual({ count: 2, members: ["민준", "서연"] });
  expect(info.has("2026-10-05-11:30")).toBe(false); // 막은 칸
  expect(info.has("2026-10-07-10:00")).toBe(false); // 표에 없는 날
  expect(maxOf(info)).toBe(2);
  expect(maxOf(new Map())).toBe(1);
});

test("주는 월요일부터 일요일까지 통째로, 후보 밖 날은 on=false로 남긴다", () => {
  const weeks = calWeeks(datesOf(table));
  expect(weeks).toHaveLength(2);
  expect(weeks[0].map((d) => d.key)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]);
  expect(weeks[0].filter((d) => d.on).map((d) => d.key)).toEqual(["2026-10-05", "2026-10-06"]);
  expect(weekRangeOf(weeks[1])).toBe("10.13");
});

test("골든타임은 같은 사람들이 이어서 되는 칸을 묶고, 같은 인원은 같은 순위다", () => {
  const g = grid([
    { name: "민준", availableTimes: ["2026-10-06-10:00", "2026-10-06-10:30", "2026-10-13-10:00"] },
    { name: "서연", availableTimes: ["2026-10-06-10:00", "2026-10-06-10:30", "2026-10-13-11:00"] },
  ]);
  const blocks = blocksOf(g);
  expect(blocks[0]).toEqual(expect.objectContaining({ date: "2026-10-06", start: "10:00", len: 2, count: 2 }));
  expect(rankBlocks(blocks).map(({ rank }) => rank)).toEqual([1, 2, 2]);
  expect(goldenKeyOf(blocks, maxOf(g.info))).toBe("2026-10-06-10:00");
  expect(firstWeekOf(blocks, calWeeks(g.dates))).toBe(0);
  // 한 명만 되면 골든(반짝임·안내)이 없다
  expect(goldenKeyOf(blocksOf(grid([{ name: "민준", availableTimes: ["2026-10-13-10:00"] }])), 1)).toBeNull();
});

test("여러 명을 고르면 그 사람들 모두 되는 구간을 긴 순으로 준다(막은 칸은 끊는다)", () => {
  const g = grid([
    { name: "민준", availableTimes: ["2026-10-05-10:00", "2026-10-05-10:30", "2026-10-05-11:00", "2026-10-06-11:00"] },
    { name: "서연", availableTimes: ["2026-10-05-10:00", "2026-10-05-10:30", "2026-10-06-11:00"] },
    { name: "지우", availableTimes: [] },
  ]);
  expect(commonBlocksOf(["민준", "서연"], g)).toEqual([
    { date: "2026-10-05", start: "10:00", len: 2 },
    { date: "2026-10-06", start: "11:00", len: 1 },
  ]);
  expect(commonBlocksOf(["민준", "지우"], g)).toEqual([]);
});

test("기간·길이 글", () => {
  expect(periodOf(["2026-10-05", "2026-10-25"])).toBe("10.5 – 10.25");
  expect(periodOf(["2026-12-30", "2027-01-02"])).toBe("2026.12.30 – 2027.1.2");
  expect(periodOf(["2026-10-05"])).toBe("10.5");
  expect(duration(3)).toBe("1시간 30분");
  expect(duration(0)).toBe("0분");
});

test("참여 이름: 형식 검사와 뒤 공백 이름 살리기(기존 화면 규칙)", () => {
  expect(validateJoin("", "1")).toBe("이름과 비밀번호를 모두 넣어 주세요.");
  expect(validateJoin("민준!", "1")).toBe("이름과 비밀번호는 한글·영문·숫자·공백만 쓸 수 있어요.");
  expect(validateJoin("민준", "1")).toBe("");
  expect(resolveName("  민준 ", ["민준 "])).toBe("민준 ");
  expect(resolveName("민준 ", ["민준"])).toBe("민준");
  expect(resolveName("서연", ["민준"])).toBe("서연");
});

test("안 읽은 글: 본 뒤 다른 사람이 쓴 글만, 본 적 없으면 다른 사람 글 전부", () => {
  const chats = [
    { name: "민준", message: "a", timestamp: "2026-10-01T00:00:00.000Z" },
    { name: "서연", message: "b", timestamp: "2026-10-01T01:00:00.000Z" },
    { name: "서연", message: "c", timestamp: "2026-10-01T02:00:00.000Z" },
  ];
  expect(unreadOf(chats, null, "민준")).toBe(2);
  expect(unreadOf(chats, Date.parse("2026-10-01T01:00:00.000Z"), "민준")).toBe(1);
  expect(unreadOf(chats, null, null)).toBe(3);
});
