import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Swal from "sweetalert2";
import TableAbPanel from "./TableAbPanel";
import ExperimentsTab from "./ExperimentsTab";
import { getTableAb, startTableAb, stopTableAb, getLandingAb } from "../../api/admin";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
jest.mock("../../api/admin", () => ({
  getTableAb: jest.fn(), startTableAb: jest.fn(), stopTableAb: jest.fn(), getLandingAb: jest.fn(), stopLandingAb: jest.fn(),
}));

// 표 화면 A/B 2회차 매니저 패널(2026-10-01, 하네스 specs/table-ab-2.md). 합성 결과만 쓴다.
const experiment = (state) => ({
  key: "table-ab-2", state, startedAt: state === "off" ? null : "2026-10-10T09:00:00+09:00", stoppedAt: null,
  asOf: "2026-10-20T09:00:00+09:00", day: 11, maxDeadlineDays: 150, rule: { srmAlpha: 0.01, minTriedPerArm: null },
});
const side = (tried, finalB, rate) => ({ tried, finalB, ambiguous: 0, rate, ci95: [rate - 10, rate + 10] });
const pref = { A: side(10, 8, 80), B: side(10, 6, 60), mean: 70, ci95: [55, 85] };
const failures = (ui) => ({
  join: { requests: 10, failed: 1, rate: 10, invalidInput: 2, invalidRate: 16.7, byReason: { wrong_password: 1, invalid_input: 2 }, people: 9, peopleFailed: 2, peopleRate: 22.2 },
  save: { attempts: 8, failed: 1, rate: 12.5, people: 7, peopleFailed: 1, peopleRate: 14.3 },
  ...(ui === "B" ? { load: { people: 20, retried: 1, retryRate: 5, failed: 0, failedRate: 0 } } : {}),
});
const running = {
  experiment: experiment("running"),
  assignment: { A: 40, B: 42, srmPValue: 0.83, stateFailOnly: { A: 1, B: 0 } },
  tables: { qualifying: 5, changed: 1, closed: 9 },
  preference: { conditional: pref, allTables: pref, triedShare: { A: 25, B: 23.8 }, byHistory: { observed: pref, notObserved: pref } },
  failures: { A: failures("A"), B: failures("B") },
  joins: { A: { new: 3, returning: 1, unknown: 0 }, B: { new: 4, returning: 2, unknown: 0 } },
  votes: { A: 3, B: 7, voters: 10, exposed: 40, rate: 25 },
  verdict: "rule_pending",
};

beforeEach(() => {
  jest.resetAllMocks();
});

test("꺼져 있으면 상태와 [시작]만 보이고, 확인하면 시작한 뒤 다시 불러온다", async () => {
  getTableAb.mockResolvedValueOnce({ experiment: experiment("off") }).mockResolvedValueOnce(running);
  Swal.fire.mockResolvedValue({ isConfirmed: true });
  startTableAb.mockResolvedValue({ data: {} });
  render(<TableAbPanel />);
  expect(await screen.findByText("꺼짐")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /중단/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /시작/ }));
  await waitFor(() => expect(startTableAb).toHaveBeenCalledTimes(1));
  expect(await screen.findByText("진행 중")).toBeInTheDocument();
});

test("진행 중이면 조건부 선호·배정 점검·실패를 보이고, 판정 기준 전에는 판정하지 않는다", async () => {
  getTableAb.mockResolvedValue(running);
  render(<TableAbPanel />);
  expect(await screen.findByText(/^평균 70%/)).toBeInTheDocument();
  expect(screen.getByText(/판정 기준\(최소 인원·기간\)을 정하기 전/)).toBeInTheDocument();
  expect(screen.getByRole("row", { name: /A 배정 10 8 80%/ })).toBeInTheDocument();
  // 게이지(2026-10-04): 배정별 B 유지 비율과 브라우저 기준 실패 경험률을 막대로.
  expect(screen.getByText("B 유지 8 / 교체한 10 · 95% 구간 70%~90%")).toBeInTheDocument();
  expect(screen.getByText("B 유지 6 / 교체한 10 · 95% 구간 50%~70%")).toBeInTheDocument();
  expect(screen.getAllByText("2 / 9")).toHaveLength(2);
  expect(screen.getAllByText("1 / 7")).toHaveLength(2);
  // 막대 자리: A 배정 게이지는 50% 점선, 95% 구간 띠 70%~90%(폭 20%), 비율 선 80%. 실패 게이지는 채운 막대 22.2%.
  // eslint-disable-next-line testing-library/no-node-access
  const aBar = screen.getByText("B 유지 8 / 교체한 10 · 95% 구간 70%~90%").parentElement.querySelectorAll("span[style]");
  expect(aBar[0]).toHaveStyle({ left: "50%" });
  expect(aBar[1]).toHaveStyle({ left: "70%", width: "20%" });
  expect(aBar[2]).toHaveStyle({ left: "80%" });
  // eslint-disable-next-line testing-library/no-node-access
  const joinA = screen.getAllByText("2 / 9")[0].parentElement.querySelectorAll("span[style]");
  expect(joinA).toHaveLength(1);
  expect(joinA[0]).toHaveStyle({ width: "22.2%" });
  expect(screen.getByText(/50:50 검사 p = 0.83/)).toBeInTheDocument();
  expect(screen.getAllByText("비밀번호 1 · 입력 형식 2")).toHaveLength(2);
  expect(screen.getByRole("button", { name: /중단/ })).toBeInTheDocument();
  // 하트 투표: 수와 투표율만(2026-10-02 사람 지시 "단순 투표 수 양만").
  expect(screen.getByText("기존 화면 3표 · 새 화면 7표")).toBeInTheDocument();
  expect(screen.getByText(/투표율 25% \(투표한 브라우저 10 \/ 화면을 본 브라우저 40\)/)).toBeInTheDocument();
});

test("이미 시작한 실험이면 알리고, BE가 없으면 배포 안내를 보인다", async () => {
  getTableAb.mockResolvedValue({ experiment: experiment("off") });
  Swal.fire.mockResolvedValue({ isConfirmed: true });
  startTableAb.mockResolvedValue({ error: "conflict" });
  render(<TableAbPanel />);
  fireEvent.click(await screen.findByRole("button", { name: /시작/ }));
  expect(await screen.findByText("이미 시작한 실험입니다.")).toBeInTheDocument();
  expect(stopTableAb).not.toHaveBeenCalled();
});

test("A/B 탭에서 랜딩 1회차와 표 화면 2회차를 고른다", async () => {
  getLandingAb.mockResolvedValue({ error: "notDeployed" });
  getTableAb.mockResolvedValue({ error: "notDeployed" });
  render(<ExperimentsTab />);
  expect(await screen.findByText(/A\/B 결과 API가 아직 배포되지 않았습니다/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "표 화면 2회차" }));
  expect(await screen.findByText(/표 화면 A\/B API가 아직 배포되지 않았습니다/)).toBeInTheDocument();
});
