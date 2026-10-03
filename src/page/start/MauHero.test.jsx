import { act, render, screen } from "@testing-library/react";
import MauHero from "./MauHero";
import { getLandingStats } from "../../api/stats";
import { floorTens } from "./mauStats";

jest.mock("../../api/stats", () => ({ getLandingStats: jest.fn() }));

/**
 * 가짜 타이머를 ms만큼 보낸다. 실제 시간처럼 50ms씩 나눠 보내야 API 응답(Promise)과 그 뒤 효과(숫자 올리기
 * 시작 등)가 제때 이어진다. 한 번에 크게 보내면 응답이 구간 끝에야 풀려 그 뒤 일이 다음 구간으로 밀린다.
 */
const advance = async (ms) => {
  for (let passed = 0; passed < ms; passed += 50) {
    // eslint-disable-next-line no-await-in-loop -- 구간마다 응답과 효과를 풀어야 한다
    await act(async () => {
      jest.advanceTimersByTime(Math.min(50, ms - passed));
    });
  }
};

/** API가 ms 뒤에 value로 답하게 한다. */
const answerWith = (value, ms = 400) => {
  getLandingStats.mockImplementation(
    () =>
      new Promise((resolve) => {
        setTimeout(() => resolve(value), ms);
      })
  );
};

describe("MauHero (랜딩 신뢰 표시: 최근 30일 참여 등록 220+명)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    answerWith({ count: 223, asOf: "2026-10-03" });
  });

  afterEach(() => {
    jest.useRealTimers();
    getLandingStats.mockReset();
  });

  test("페이지가 신호를 줄 때까지 세 줄은 투명한 채 자리만 차지하고, 신호가 오면 떠오르며 숫자가 0부터 220까지 올라간다", async () => {
    const { rerender } = render(<MauHero introDone={false} />);
    expect(screen.getByText("최근 30일 동안")).toBeInTheDocument();
    expect(screen.getByText("타임테이블로 시간을 아꼈어요")).toBeInTheDocument();

    await advance(2000);
    // 자리 잡기용 최종값만 220이고 보이는 숫자는 아직 0이다. 세 줄은 투명하다.
    expect(screen.getAllByText("220")).toHaveLength(1);
    expect(screen.getByText("최근 30일 동안")).toHaveStyle({ opacity: "0" });
    expect(screen.getByText("타임테이블로 시간을 아꼈어요")).toHaveStyle({ opacity: "0" });

    rerender(<MauHero introDone />);
    expect(screen.getByText("최근 30일 동안")).not.toHaveStyle({ opacity: "0" });
    expect(screen.getByText("타임테이블로 시간을 아꼈어요")).not.toHaveStyle({ opacity: "0" });
    // 0부터 올라간다. 0.3초에는 아직 끝 값이 아니고 +도 보이지 않는다("123+"는 뜻이 없다).
    await advance(300);
    expect(screen.getAllByText("220")).toHaveLength(1);
    expect(screen.getByText("+")).toHaveStyle({ opacity: "0" });

    await advance(700);
    expect(screen.getAllByText("220")).toHaveLength(2);
    expect(screen.getByText("+")).toHaveStyle({ opacity: "1" });
    expect(screen.queryByText("223")).not.toBeInTheDocument();
    expect(screen.getByText("최근 30일 동안 220명 넘게 타임테이블로 시간을 아꼈어요")).toBeInTheDocument();
  });

  test("신호가 먼저 와도 숫자를 받기 전에는 투명하고, 받은 뒤 떠오르며 올라간다", async () => {
    answerWith({ count: 223, asOf: "2026-10-03" }, 1500);
    render(<MauHero />);
    await advance(1000);
    expect(screen.getByText("최근 30일 동안")).toHaveStyle({ opacity: "0" });

    await advance(1500);
    expect(screen.getByText("최근 30일 동안")).not.toHaveStyle({ opacity: "0" });
    expect(screen.getAllByText("220")).toHaveLength(2);
    expect(screen.getByText("+")).toHaveStyle({ opacity: "1" });
  });

  test.each([
    ["100명이면", 100],
    ["99명이면", 99],
    ["0명이면", 0],
  ])("%s 세 줄을 그리지 않는다(100명 이하)", async (_, count) => {
    answerWith({ count, asOf: "2026-10-03" });
    render(<MauHero />);
    await advance(1500);
    expect(screen.queryByText("최근 30일 동안")).not.toBeInTheDocument();
    expect(screen.queryByText("타임테이블로 시간을 아꼈어요")).not.toBeInTheDocument();
  });

  test("101명이면 그린다(100+명)", async () => {
    answerWith({ count: 101, asOf: "2026-10-03" });
    render(<MauHero />);
    await advance(1500);
    expect(screen.getAllByText("100")).toHaveLength(2);
    expect(screen.getByText("최근 30일 동안 100명 넘게 타임테이블로 시간을 아꼈어요")).toBeInTheDocument();
  });

  test("API를 못 받으면(null) 세 줄을 그리지 않는다", async () => {
    answerWith(null);
    render(<MauHero />);
    await advance(1500);
    expect(screen.queryByText("최근 30일 동안")).not.toBeInTheDocument();
  });

  test("십 단위로 내린다(부풀리지 않는다)", () => {
    expect(floorTens(223)).toBe(220);
    expect(floorTens(229)).toBe(220);
    expect(floorTens(220)).toBe(220);
  });
});
