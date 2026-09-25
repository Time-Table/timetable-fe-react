import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ManagerPage from "./ManagerPage";
import { getFunnels } from "../api/event";
import { adminVerify, getTrends } from "../api/admin";
import { getTrackVisit } from "../api/visit";

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("../Seo", () => () => null);
jest.mock("./manager/charts", () => ({ TrendChart: () => null, BarList: () => null }));
jest.mock("../api/event", () => ({ getFunnels: jest.fn() }));
jest.mock("../api/admin", () => ({ adminVerify: jest.fn(), getTrends: jest.fn() }));
jest.mock("../api/visit", () => ({ getTrackVisit: jest.fn() }));
jest.mock("../api/table", () => ({ getAllTables: jest.fn(), updateTable: jest.fn(), deleteTable: jest.fn() }));
jest.mock("../utils/admin", () => ({ isAdmin: () => true }));
jest.mock("sweetalert2", () => ({ fire: jest.fn(), mixin: () => ({ fire: jest.fn() }) }));
// 설치된 testing-library와 React 18.3의 act API를 맞춘다.
jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"), act: require("react").act,
}));

const report = (rate = 75) => ({ data: {
  startDate: "2026-09-01", funnels: [], participationMetrics: {
    version: 1, status: "ok", definition: "current_registration_before_deadline", firstCollectedAt: "2026-09-01T00:00:00Z",
    asOf: "2026-09-25T00:00:00Z",
    period: { days: 0, startAt: null, endAt: "2026-09-25T00:00:00Z" },
    ended: { total: 4, achieved: 3, notAchieved: 1, incomplete: 0, ratePercent: rate },
    ongoing: { total: 2, achieved: 1, notAchieved: 1, incomplete: 0 },
    quality: { existingTables: 0, trackedTables: 0, excludedAdminTables: 0, invalidTables: 0, missingLedgers: 0, scheduleChangedTables: 0 },
  },

} });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

beforeEach(() => {
  jest.clearAllMocks();
  adminVerify.mockResolvedValue({ success: true });
  getTrackVisit.mockResolvedValue({ data: [] });
  getTrends.mockResolvedValue({ days: 30, metrics: [{ key: "signUps", total: 123 }], series: [] });
  getFunnels.mockResolvedValue(report());
});

const flushUpdates = async () => { await act(async () => { await Promise.resolve(); }); };
const click = async (element) => { fireEvent.click(element); await flushUpdates(); };

const openParticipation = async () => {
  await screen.findByText("123");
  await click(screen.getByText("3인 참여 달성률", { selector: "div" }));
};

test("참여 달성률은 별도 탭에서만 조회하고 대시보드는 표로 시작한다", async () => {
  render(<ManagerPage />); await flushUpdates();
  expect(await screen.findByText("123")).toBeTruthy();
  expect(screen.getByRole("button", {name: "그래프로 보기"})).toBeTruthy();
  expect(screen.getByRole("table")).toBeTruthy();
  expect(getFunnels).not.toHaveBeenCalled();
  expect(screen.queryByRole("heading", {name: "3인 참여 달성률"})).toBeNull();
  await openParticipation();
  expect(await screen.findByText("75%")).toBeTruthy();
  expect(screen.getByText("종료 · 미달")).toBeTruthy();
  expect(getFunnels.mock.calls.map(([days])=>days)).toEqual([0]);
  await click(screen.getByText("퍼널 분석", {selector: "div"}));
  await waitFor(()=>expect(getFunnels).toHaveBeenCalledWith(30));
  expect(screen.queryByText("75%")).toBeNull();
});

test("오늘 한국시간 날짜의 네 수치를 일별 추이 위에 표시하며 마지막 행을 임의로 쓰지 않는다", async () => {
  const today = new Intl.DateTimeFormat("sv-SE", {timeZone:"Asia/Seoul"}).format(new Date());
  getTrends.mockResolvedValue({days:30,metrics:[],series:[
    {date:today,visits:17,tables:3,signUps:8,logins:4},
    {date:"2020-01-01",visits:99,tables:99,signUps:99,logins:99},
  ]});
  render(<ManagerPage />); await flushUpdates();
  const summary=await screen.findByRole("region",{name:"오늘 통계"});
  expect(within(summary).getByText(`오늘 · ${today}`)).toBeTruthy();
  for(const value of [17,3,8,4]) expect(within(summary).getByText(String(value))).toBeTruthy();
  expect(within(summary).queryByText("99")).toBeNull();
  expect(summary.compareDocumentPosition(screen.getByRole("heading",{name:"일별 추이"})) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await click(screen.getByRole("button", {name:"그래프로 보기"}));
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.getByRole("button", {name:"표로 보기"})).toBeTruthy();
});

test("오늘 기록이 없으면 과거 값이나 가짜 0 대신 미조회 상태로 표시한다", async()=>{
  render(<ManagerPage />); await flushUpdates();
  const summary=await screen.findByRole("region",{name:"오늘 통계"});
  expect(within(summary).getByText(/오늘 통계를 불러오지 못했습니다/)).toBeTruthy();
  expect(within(summary).getAllByText("—")).toHaveLength(4);
});

test("KPI 조회 실패를 표시하고 재시도로 회복한다", async () => {
  const pending=deferred(); getFunnels.mockReturnValueOnce(pending.promise);
  render(<ManagerPage />); await flushUpdates(); await openParticipation();
  expect(screen.getByText("참여 달성 지표를 불러오는 중입니다.")).toBeTruthy();
  await act(async()=>pending.resolve(null));
  expect(await screen.findByText(/통계 조회에 실패했습니다/)).toBeTruthy();
  await click(screen.getByRole("button",{name:"지표 다시 조회"}));
  expect(await screen.findByText("75%")).toBeTruthy();
});

test("방문 통계가 실패해도 참여 탭은 독립적으로 조회된다",async()=>{
  getTrends.mockResolvedValue(null); render(<ManagerPage />); await flushUpdates();
  expect(await screen.findByText("방문·등록 통계를 불러오지 못했습니다.")).toBeTruthy();
  await click(screen.getByText("3인 참여 달성률",{selector:"div"}));
  expect(await screen.findByText("75%")).toBeTruthy();
});

test("기간 변경 후 늦은 이전 응답이 최신 KPI를 덮지 않는다",async()=>{
  const old=deferred(); getFunnels.mockReturnValueOnce(old.promise).mockResolvedValueOnce(report(50));
  render(<ManagerPage />); await flushUpdates(); await openParticipation();
  await waitFor(()=>expect(getFunnels).toHaveBeenCalledWith(0));
  await click(within(screen.getByRole("group",{name:"참여 달성 집계 기간"})).getByRole("button",{name:"7일",exact:true}));
  expect(await screen.findByText("50%")).toBeTruthy();
  await act(async()=>old.resolve(report(75)));
  expect(screen.queryByText("75%")).toBeNull();
});

test("구 입력 지표를 참여 지표로 표시하지 않는다",async()=>{
  const response=report(); response.data.metricsV2=response.data.participationMetrics; delete response.data.participationMetrics;
  getFunnels.mockResolvedValue(response); render(<ManagerPage />); await flushUpdates(); await openParticipation();
  expect(await screen.findByText(/새 지표 수집이 아직 연결되지/)).toBeTruthy();
  expect(screen.queryByText("75%")).toBeNull();
});

test("참여 기간과 대시보드 기간은 탭 이동에도 독립적으로 유지된다",async()=>{
  getFunnels.mockImplementation(async(days)=>report(days===0?17.2:48.6));
  render(<ManagerPage />); await flushUpdates(); await screen.findByText("123");
  await click(within(screen.getByRole("group",{name:"조회 기간"})).getByRole("button",{name:"7일",exact:true}));
  await waitFor(()=>expect(getTrends).toHaveBeenCalledWith(7));
  await openParticipation(); expect(await screen.findByText("17.2%")).toBeTruthy();
  await click(within(screen.getByRole("group",{name:"참여 달성 집계 기간"})).getByRole("button",{name:"30일",exact:true}));
  expect(await screen.findByText("48.6%")).toBeTruthy();
  await click(screen.getByText("대시보드",{selector:"div"}));
  await openParticipation(); expect(await screen.findByText("48.6%")).toBeTruthy();
  expect(getTrends).not.toHaveBeenCalledWith(0);
});

test("전체 보관 표와 기존 카운터를 각 탭에서 보존한다",async()=>{
  const response=report(17.2); response.data.participationMetrics.quality.existingTables=384;
  getFunnels.mockResolvedValue(response); getTrackVisit.mockResolvedValue({data:[{totalTableCreateCount:402}]});
  render(<ManagerPage />); await flushUpdates(); expect(await screen.findByText("402")).toBeTruthy();
  expect(screen.getByText("기존 표 생성 카운터")).toBeTruthy();
  await openParticipation(); expect(await screen.findByText("384")).toBeTruthy();
  expect(screen.getByText("전체 보관 표")).toBeTruthy();
});
