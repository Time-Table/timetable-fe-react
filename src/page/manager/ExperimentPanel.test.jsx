import { act, render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import Swal from "sweetalert2";
import ExperimentPanel from "./ExperimentPanel";
import { LANDING_CHANGES } from "./landingChanges";
import { getLandingAb, stopLandingAb } from "../../api/admin";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
jest.mock("../../api/admin", () => ({ getLandingAb: jest.fn(), stopLandingAb: jest.fn() }));

const step = (key, label, count, rate) => ({ key, event: key, label, count, rate });
const side = (exposed, success, extra = {}) => ({
  exposed,
  steps: [
    step("landing_view", "랜딩 방문", exposed, 100),
    step("create_view", "생성 폼 표시", exposed, 100),
    step("create_cta_click", "만들기 클릭", success + 1, Math.round(((success + 1) / exposed) * 1000) / 10),
    step("create_submit", "생성 요청", success, Math.round((success / exposed) * 1000) / 10),
    step("create_success", "랜딩 폼 생성 성공", success, Math.round((success / exposed) * 1000) / 10),
    step("invite_share", "공유·복사 시도", success, Math.round((success / exposed) * 1000) / 10),
  ],
  extraSteps: [
    step("create_success_quick", "빠른 생성 성공", 1, Math.round((1 / exposed) * 1000) / 10),
    step("create_success_unknown", "경로 없는 생성 성공", extra.unknown || 0, 0),
  ],
  primary: { count: success, rate: Math.round((success / exposed) * 1000) / 10, ci95: [5, 30] },
  tables: { landing: { created: success, closed: 2, reachedThree: 1 }, quickCreate: { created: 1, closed: 0, reachedThree: 0 } },
});

const report = (overrides = {}) => ({
  experiment: {
    key: "landing-ab-1",
    plannedStartDate: "2026-09-29",
    startAt: "2026-09-29T01:22:57+09:00",
    stoppedAt: null,
    v2Percent: 50,
    asOf: "2026-10-03T12:00:00+09:00",
    day: 5,
    phase: "running",
    rule: { srmAlpha: 0.01, minExposed: 100, minSuccess: 10 },
    excludedVisitors: 2,
    firstTrackedAt: "2026-09-29T01:23:00+09:00",
    startAtWarning: false,
    ...overrides.experiment,
  },
  device: overrides.device || "all",
  assignment: { v1: 31, v2: 27, expectedV2Share: 50, srmPValue: 0.6, ...overrides.assignment },
  variants: { v1: side(31, 5), v2: side(27, 4, overrides.v2 || {}) },
  difference: { primaryPoints: -1.3, ci95: [-20.1, 13.7] },
  verdict: overrides.verdict || "insufficient",
  daily: [{ date: "2026-09-29", v1: 3, v2: 2 }],
});

beforeEach(() => {
  jest.clearAllMocks();
});

test("진행 중에는 중간 수치로 판정을 보여 주고, 쪽별 주 지표와 단계 표를 그린다", async () => {
  getLandingAb.mockResolvedValue(report());
  render(<ExperimentPanel />);
  expect(await screen.findByText("판정 보류 · 표본 부족")).toBeInTheDocument();
  expect(screen.getByText(/중간 수치/)).toBeInTheDocument();
  expect(screen.getByText("한쪽이라도 노출 100·성공 10 이상이 되어야 판정합니다.")).toBeInTheDocument();
  // 큰 숫자(주 지표)는 문단, 표 안 비율은 span이다.
  expect(screen.getByText("16.1%", { selector: "p" })).toBeInTheDocument();
  expect(screen.getByText("14.8%", { selector: "p" })).toBeInTheDocument();
  expect(screen.getByText("5 / 31 · 95% 구간 5%~30%")).toBeInTheDocument();
  const table = screen.getAllByRole("table")[0];
  expect(within(table).getByText("랜딩 폼 생성 성공")).toBeInTheDocument();
  expect(within(table).getByText("빠른 생성 성공")).toBeInTheDocument();
  expect(screen.getByText(/점검용 방문자 ID 2개는 뺐습니다/)).toBeInTheDocument();
  expect(getLandingAb).toHaveBeenCalledWith("all");
});

test("기간 중 변경 카드가 최근 변경부터 시각·쪽·내용을 보여 준다", async () => {
  getLandingAb.mockResolvedValue(report());
  render(<ExperimentPanel />);
  await screen.findByText("단계별");
  const card = screen.getByRole("region", { name: "기간 중 변경" });
  expect(within(card).getAllByRole("listitem")).toHaveLength(LANDING_CHANGES.length);
  expect(within(card).getByText("A/B 1회차 시작(startAt)")).toBeInTheDocument();
  expect(within(card).getByText("FE f7451e6·41d6f5a")).toBeInTheDocument();
  expect(within(card).getAllByText("A·B 둘 다")).toHaveLength(8);
  expect(within(card).getByText("B만")).toBeInTheDocument();
  expect(within(card).getByText("계측")).toBeInTheDocument();
  // 최근 것이 먼저다.
  const first = within(card).getAllByRole("listitem")[0];
  expect(first).toHaveTextContent("10-10 08:02");
});

test("대시보드 표의 '변경'에서 왔으면(focusChangesKey) 기간 중 변경 카드로 초점을 옮기고 화면에 보이게 한다", async () => {
  getLandingAb.mockResolvedValue(report());
  const scrollIntoView = jest.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  try {
    render(<ExperimentPanel focusChangesKey={1} />);
    const card = await screen.findByRole("region", { name: "기간 중 변경" });
    await waitFor(() => expect(card).toHaveFocus());
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  } finally {
    delete Element.prototype.scrollIntoView;
  }
});

test("A/B 결과를 못 받아도(실패·불러오는 중) 기간 중 변경 카드는 보인다", async () => {
  let resolve;
  getLandingAb.mockReturnValue(new Promise((r) => { resolve = r; }));
  render(<ExperimentPanel />);
  expect(screen.getByText("A/B 결과를 불러오는 중입니다")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "기간 중 변경" })).toBeInTheDocument();
  await act(async () => { resolve({ error: "failed" }); });
  expect(screen.getByText("A/B 결과를 불러오지 못했습니다. 잠시 후 다시 시도하세요.")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "기간 중 변경" })).toBeInTheDocument();
});

test("기간 중 변경 카드는 그냥 열었을 때(focusChangesKey 없음)는 초점을 옮기지 않는다", async () => {
  getLandingAb.mockResolvedValue(report());
  render(<ExperimentPanel />);
  const card = await screen.findByRole("region", { name: "기간 중 변경" });
  expect(card).not.toHaveFocus();
});

test("기기를 바꾸면 그 기기로 다시 불러온다", async () => {
  getLandingAb.mockResolvedValue(report());
  render(<ExperimentPanel />);
  await screen.findByText("판정 보류 · 표본 부족");
  fireEvent.click(screen.getByRole("button", { name: "휴대폰" }));
  await waitFor(() => expect(getLandingAb).toHaveBeenLastCalledWith("mobile"));
});

test("중단은 확인 창에서 취소하면 요청하지 않고, 확인하면 중단한 뒤 다시 불러온다", async () => {
  getLandingAb.mockResolvedValueOnce(report()).mockResolvedValue(
    report({ experiment: { phase: "stopped", stoppedAt: "2026-10-10T14:00:00+09:00", day: 12 } }),
  );
  stopLandingAb.mockResolvedValue({ data: {} });
  render(<ExperimentPanel />);
  const stop = await screen.findByRole("button", { name: "중단" });

  Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
  fireEvent.click(stop);
  await waitFor(() => expect(Swal.fire).toHaveBeenCalledTimes(1));
  expect(stopLandingAb).not.toHaveBeenCalled();

  Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
  fireEvent.click(stop);
  await waitFor(() => expect(stopLandingAb).toHaveBeenCalledTimes(1));
  expect(await screen.findByText("중단됨")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "중단" })).not.toBeInTheDocument();
  expect(screen.getByText(/결과가 고정됐습니다/)).toBeInTheDocument();
});

test("이미 중단된 실험이면 그 시각을 알려 준다", async () => {
  getLandingAb.mockResolvedValue(report());
  stopLandingAb.mockResolvedValue({ error: "conflict", stoppedAt: "2026-10-10T14:00:00+09:00" });
  Swal.fire.mockResolvedValue({ isConfirmed: true });
  render(<ExperimentPanel />);
  fireEvent.click(await screen.findByRole("button", { name: "중단" }));
  expect(await screen.findByText(/이미 .*중단한 실험입니다/)).toBeInTheDocument();
});

test("배정 비율 이상·시작 시각 점검·경로 없는 성공을 경고한다", async () => {
  getLandingAb.mockResolvedValue(
    report({ verdict: "srm_alert", assignment: { srmPValue: 0.004 }, experiment: { startAtWarning: true }, v2: { unknown: 1 } }),
  );
  render(<ExperimentPanel />);
  expect(await screen.findByText("판정 보류 · 배정 비율 이상")).toBeInTheDocument();
  expect(screen.getByText(/배정 비율이 기대\(50:50\)와 다릅니다/)).toBeInTheDocument();
  expect(screen.getByText(/시작 시각보다 앞선 새 계측 기록이 있습니다/)).toBeInTheDocument();
  expect(screen.getByText(/경로 없는 생성 성공이 있습니다/)).toBeInTheDocument();
});

test("API가 아직 없으면 백엔드부터 배포하라고 알려 준다", async () => {
  getLandingAb.mockResolvedValue({ error: "notDeployed" });
  render(<ExperimentPanel />);
  expect(await screen.findByText(/백엔드부터 배포하세요/)).toBeInTheDocument();
});
