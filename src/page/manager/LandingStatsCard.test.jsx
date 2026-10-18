import { render, screen, act } from "@testing-library/react";
import LandingStatsCard, { resetLandingStatsCache } from "./LandingStatsCard";
import { fetchLandingStats } from "../../api/stats";

jest.mock("../../api/stats", () => ({ fetchLandingStats: jest.fn() }));

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const OK = { ok: true, count: 231, asOf: "2026-10-03", startDate: "2026-09-04", days: 30 };

describe("LandingStatsCard (대시보드 랜딩 신뢰 표시 카드)", () => {
  beforeEach(() => {
    resetLandingStatsCache();
    fetchLandingStats.mockReset();
  });

  test("랜딩이 보여 주는 고정값 300+명과 참고 집계를 함께 보여 준다", async () => {
    fetchLandingStats.mockResolvedValue(OK);
    render(<LandingStatsCard />);
    expect(screen.getByText("300+명")).toBeInTheDocument();
    expect(screen.getByText("고정값")).toBeInTheDocument();
    expect(screen.getByText("참고 집계 불러오는 중")).toBeInTheDocument();
    await flush();
    // 집계가 300보다 작아도 랜딩 값은 그대로다.
    expect(screen.getByText("300+명")).toBeInTheDocument();
    expect(screen.getByText(/참고 집계 231건 · 9월 4일~10월 3일\(어제까지 30일\)/)).toBeInTheDocument();
  });

  test("참고 집계는 읽기 도구에 상태로 전해진다", async () => {
    fetchLandingStats.mockResolvedValue(OK);
    render(<LandingStatsCard />);
    await flush();
    expect(screen.getByRole("status")).toHaveTextContent("참고 집계 231건");
  });

  test("탭을 오가며 다시 그려도 한 번 받은 값을 쓴다(요청 1회). 실패했을 때는 다음에 다시 묻는다", async () => {
    fetchLandingStats.mockResolvedValue(OK);
    const { unmount } = render(<LandingStatsCard />);
    await flush();
    unmount();
    render(<LandingStatsCard />);
    await flush();
    expect(screen.getByText(/참고 집계 231건/)).toBeInTheDocument();
    expect(fetchLandingStats).toHaveBeenCalledTimes(1);

    resetLandingStatsCache();
    fetchLandingStats.mockResolvedValue({ ok: false, reason: "timeout" });
    const { unmount: unmountFailed } = render(<LandingStatsCard />);
    await flush();
    unmountFailed();
    render(<LandingStatsCard />);
    await flush();
    expect(fetchLandingStats).toHaveBeenCalledTimes(3);
  });

  test.each([
    ["missing", "BE에 집계 경로가 없습니다"],
    ["timeout", "2.5초 안에 응답이 없습니다"],
    ["invalid", "응답 모양이 계약과 다릅니다"],
    ["error", "응답을 못 받았습니다"],
  ])("참고 집계를 못 받으면(%s) 이유를 보여 주고 랜딩 값은 그대로 둔다", async (reason, text) => {
    fetchLandingStats.mockResolvedValue({ ok: false, reason });
    render(<LandingStatsCard />);
    await flush();
    expect(screen.getByText("300+명")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`참고 집계를 못 받았습니다. ${text}`))).toBeInTheDocument();
  });
});
