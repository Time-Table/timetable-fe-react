import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CoreMetricsCard, GrowthCard, OutcomeCard } from "./MetricsCards";
import { getMetricsOverview } from "../../api/admin";

jest.mock("../../api/admin", () => ({ getMetricsOverview: jest.fn() }));

// 핵심 유저 지표 카드(2026-10-09, 하네스 specs/metrics.md). 합성 응답만 쓴다.
const core = (over = {}) => ({
  activity: { visitors: 120, tables: { total: 20, time: 15, date: 5, dateRate: 25 } },
  creators: { tables: 20, knownTables: 18, creators: 16, repeat: 2, repeatRate: 12.5, returning: 3, returningRate: 18.8 },
  invite: { judged: 10, reached: 6, rate: 60, ongoing: 4, ongoingReached: 1 },
  outcomes: {
    ended: 8, achieved: 4, rate: 50,
    byType: { time: { ended: 6, achieved: 3, rate: 50 }, date: { ended: 2, achieved: 1, rate: 50 } },
    timeTo3: { tables: 4, medianHours: 30.5 },
    input: { registered: 30, withInput: 24, rate: 80 },
    common: { tables: 6, withCommon: 3, rate: 50 },
  },
  failures: { join: { submits: 40, failed: 2, rate: 5, invalidInput: 1 }, save: { attempts: 50, failed: 1, rate: 2 }, load: { retried: 0, failed: 1 }, rate: 3.3 },
  ...over,
});
const REPORT = {
  days: 7, startDate: "2026-10-03", endDate: "2026-10-09", asOf: "2026-10-09T12:00:00+09:00", eventsSince: "2026-08-01",
  current: core(),
  previous: core({ activity: { visitors: 100, tables: { total: 25, time: 25, date: 0, dateRate: 0 } }, invite: { judged: 8, reached: 4, rate: 50, ongoing: 0, ongoingReached: 0 } }),
  sources: [{ label: "naver", visitors: 50, converted: 10, rate: 20 }, { label: "direct", visitors: 30, converted: 3, rate: 10 }],
  retention: { cohort: 90, d7: { eligible: 60, returned: 12, rate: 20 }, d28: { eligible: 20, returned: 6, rate: 30 } },
};

test("대시보드 핵심 지표 7칸과 직전 기간 대비(수는 %, 비율은 %p)", async () => {
  getMetricsOverview.mockResolvedValue(REPORT);
  render(<CoreMetricsCard days={7} />);
  expect(await screen.findByText("방문자")).toBeInTheDocument();
  expect(getMetricsOverview).toHaveBeenCalledWith(7);
  for (const label of ["방문자", "만든 표", "초대 도달", "3인 달성", "입력 완료", "공통 시간 있음", "참여·저장 실패율"]) {
    expect(screen.getByText(label)).toBeInTheDocument();
  }
  expect(screen.getByText("+20%")).toBeInTheDocument(); // 방문자 100 → 120
  expect(screen.getByText("-20%")).toBeInTheDocument(); // 만든 표 25 → 20
  expect(screen.getByText("+10%p")).toBeInTheDocument(); // 초대 도달 50 → 60
  expect(screen.getByText(/날짜 투표 5개\(25%\)/)).toBeInTheDocument();
  expect(screen.getByText(/2026-10-03 ~ 2026-10-09\(7일\)/)).toBeInTheDocument();
});

test("BE 배포 전이면 그렇게 알리고, 실패하면 다시 조회한다", async () => {
  getMetricsOverview.mockResolvedValueOnce({ error: "notDeployed" });
  const { unmount } = render(<CoreMetricsCard days={30} />);
  expect(await screen.findByText(/BE를 먼저 배포하면 보입니다/)).toBeInTheDocument();
  unmount();
  getMetricsOverview.mockResolvedValueOnce({ error: "failed" }).mockResolvedValueOnce(REPORT);
  render(<CoreMetricsCard days={30} />);
  fireEvent.click(await screen.findByRole("button", { name: "다시 조회" }));
  expect(await screen.findByText("초대 도달")).toBeInTheDocument();
  await waitFor(() => expect(getMetricsOverview).toHaveBeenCalledTimes(3));
});

test("3인 탭: 표 유형별 달성과 3명 모이는 데 걸린 시간", async () => {
  getMetricsOverview.mockResolvedValue(REPORT);
  render(<OutcomeCard days={0} />);
  expect(await screen.findByText("날짜 투표 3인 달성")).toBeInTheDocument();
  expect(screen.getByText("30.5시간")).toBeInTheDocument();
  expect(screen.getByText("마감 2개 중 1개")).toBeInTheDocument();
});

test("사용자 분석: 재방문·다시 만들기·출처별 전환 표", async () => {
  getMetricsOverview.mockResolvedValue(REPORT);
  render(<GrowthCard days={30} />);
  expect(await screen.findByText("7일 재방문")).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "naver" })).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(screen.getByText("12.5%")).toBeInTheDocument();
});
