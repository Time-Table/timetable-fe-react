import { act, render, screen } from "@testing-library/react";
import MauHero from "./MauHero";
import { LANDING_COUNT } from "./mauStats";

/** 가짜 타이머를 ms만큼 50ms씩 나눠 보낸다. 한 번에 크게 보내면 숫자 올리기 효과가 다음 구간으로 밀린다. */
const advance = async (ms) => {
  for (let passed = 0; passed < ms; passed += 50) {
    // eslint-disable-next-line no-await-in-loop -- 구간마다 효과를 풀어야 한다
    await act(async () => {
      jest.advanceTimersByTime(Math.min(50, ms - passed));
    });
  }
};

describe("MauHero (랜딩 신뢰 표시: 최근 30일 동안 300+명, 사람이 정한 고정값)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("숫자는 공유 미리보기 이미지와 같은 300이다", () => {
    expect(LANDING_COUNT).toBe(300);
  });

  test("페이지가 신호를 줄 때까지 세 줄은 투명한 채 자리만 차지하고, 신호가 오면 떠오르며 숫자가 0부터 300까지 올라간다", async () => {
    const { rerender } = render(<MauHero introDone={false} />);
    // 집계를 기다리지 않고 처음부터 세 줄 자리를 잡는다. 자리 잡기용 최종값만 300이고 보이는 숫자는 0이다.
    expect(screen.getByText("최근 30일 동안")).toHaveStyle({ opacity: "0" });
    expect(screen.getByText("타임테이블로 시간을 아꼈어요")).toHaveStyle({ opacity: "0" });
    expect(screen.getAllByText("300")).toHaveLength(1);
    expect(screen.getByText("0")).toBeInTheDocument();

    await advance(2000);
    expect(screen.getAllByText("300")).toHaveLength(1);

    rerender(<MauHero introDone />);
    expect(screen.getByText("최근 30일 동안")).not.toHaveStyle({ opacity: "0" });
    expect(screen.getByText("타임테이블로 시간을 아꼈어요")).not.toHaveStyle({ opacity: "0" });
    // 0.3초에는 아직 끝 값이 아니고 +도 보이지 않는다("123+"는 뜻이 없다).
    await advance(300);
    expect(screen.getAllByText("300")).toHaveLength(1);
    expect(screen.getByText("+")).toHaveStyle({ opacity: "0" });

    await advance(700);
    expect(screen.getAllByText("300")).toHaveLength(2);
    expect(screen.getByText("+")).toHaveStyle({ opacity: "1" });
    expect(screen.getByText("최근 30일 동안 300명 넘게 타임테이블로 시간을 아꼈어요")).toBeInTheDocument();
  });

  test("그린 뒤 onSettled를 한 번 불러 페이지가 자리 높이를 재게 한다", () => {
    const onSettled = jest.fn();
    render(<MauHero onSettled={onSettled} />);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });
});
