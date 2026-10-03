import { render, screen, act } from "@testing-library/react";
import LandingStatsCard from "./LandingStatsCard";
import { fetchLandingStats } from "../../api/stats";

jest.mock("../../api/stats", () => ({ fetchLandingStats: jest.fn() }));

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe("LandingStatsCard (대시보드 랜딩 신뢰 표시 카드)", () => {
  test("101명 이상이면 랜딩이 보여 주는 값(십 단위 내림 +명)과 집계 기간, 표시 중 상태를 보여 준다", async () => {
    fetchLandingStats.mockResolvedValue({ ok: true, count: 231, asOf: "2026-10-03", startDate: "2026-09-04", days: 30 });
    render(<LandingStatsCard />);
    expect(screen.getByText("불러오는 중")).toBeInTheDocument();
    await flush();
    expect(screen.getByText("230+명")).toBeInTheDocument();
    expect(screen.getByText("표시 중")).toBeInTheDocument();
    expect(screen.getByText(/집계 231건 · 9월 4일~10월 3일\(어제까지 30일\) · 101명 이상이면 표시/)).toBeInTheDocument();
  });

  test.each([100, 0])("%s명이면 랜딩이 숨기므로 숨김 상태로 보여 준다", async (count) => {
    fetchLandingStats.mockResolvedValue({ ok: true, count, asOf: "2026-10-03", startDate: "2026-09-04", days: 30 });
    render(<LandingStatsCard />);
    await flush();
    expect(screen.getByText("표시 안 함")).toBeInTheDocument();
    expect(screen.getByText("숨김 · 100명 이하")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`집계 ${count}건`))).toBeInTheDocument();
  });

  test.each([
    ["missing", "BE에 집계 경로가 없습니다"],
    ["timeout", "2.5초 안에 응답이 없습니다"],
    ["invalid", "응답 모양이 계약과 다릅니다"],
    ["error", "응답을 못 받았습니다"],
  ])("못 받으면(%s) 실패 이유를 보여 준다", async (reason, text) => {
    fetchLandingStats.mockResolvedValue({ ok: false, reason });
    render(<LandingStatsCard />);
    await flush();
    expect(screen.getByText("응답 실패")).toBeInTheDocument();
    expect(screen.getByText("표시 안 함")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
  });
});
