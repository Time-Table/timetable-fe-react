import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ManagerPage from "./ManagerPage";
import Swal from "sweetalert2";
import { getAllTables, deleteTable } from "../api/table";
import { getFunnels } from "../api/event";
import { adminVerify, getTrends, getBlogStats } from "../api/admin";
import { getTrackVisit } from "../api/visit";
import { MonthlyBarChart } from "./manager/charts";

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("../Seo", () => () => null);
jest.mock("./manager/charts", () => ({
  TrendChart: () => null,
  MonthlyBarChart: jest.fn(() => null),
  BarList: () => null,
}));
jest.mock("../api/event", () => ({ getFunnels: jest.fn() }));
jest.mock("../api/admin", () => ({ adminVerify: jest.fn(), getTrends: jest.fn(), getBlogStats: jest.fn() }));
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
  getBlogStats.mockResolvedValue({
    total: { views: 0, visitors: 0 },
    conversion: { blogVisitors: 0 },
    posts: [], series: [], sources: [],
  });
});

const flushUpdates = async () => { await act(async () => { await Promise.resolve(); }); };
const click = async (element) => { fireEvent.click(element); await flushUpdates(); };

const openParticipation = async () => {
  await screen.findByText("123");
  await click(screen.getByText("3인 참여 달성률", { selector: "button" }));
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
  await click(screen.getByText("퍼널 분석", {selector: "button"}));
  await waitFor(()=>expect(getFunnels).toHaveBeenCalledWith(30));
  expect(screen.queryByText("75%")).toBeNull();
});

test("오늘 한국시간 날짜의 다섯 수치를 일별 추이 위에 표시하며 마지막 행을 임의로 쓰지 않는다", async () => {
  const today = new Intl.DateTimeFormat("sv-SE", {timeZone:"Asia/Seoul"}).format(new Date());
  getTrends.mockResolvedValue({days:30,metrics:[],series:[
    {date:today,visitors:12,visits:17,tables:3,signUps:8,logins:4},
    {date:"2020-01-01",visitors:99,visits:99,tables:99,signUps:99,logins:99},
  ]});
  render(<ManagerPage />); await flushUpdates();
  const summary=await screen.findByRole("region",{name:"오늘 통계"});
  expect(within(summary).getByText(`오늘 · ${today}`)).toBeTruthy();
  for(const value of [12,17,3,8,4]) expect(within(summary).getByText(String(value))).toBeTruthy();
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
  expect(within(summary).getAllByText("—")).toHaveLength(5);
});

test("월별 추이는 별도 메뉴에서 최근 3개월로 시작하고 기간 버튼만으로 범위를 바꾼다", async () => {
  getTrackVisit.mockResolvedValue({ data: [
    { date: "2025-03-18", todayTableCreateCount: 2 },
    { date: "2026-08-01", todayTableCreateCount: 3 },
  ] });
  render(<ManagerPage />); await flushUpdates();
  await click(screen.getByText("월별 추이", { selector: "button" }));
  expect(await screen.findByRole("heading", { name: "월별 테이블 생성 수" })).toBeTruthy();
  const periods = screen.getByRole("group", { name: "월별 추이 기간" });
  expect(within(periods).getByRole("button", { name: "최근 3개월" }).getAttribute("aria-pressed")).toBe("true");
  await waitFor(() => expect(MonthlyBarChart.mock.calls.at(-1)[0].series).toHaveLength(3));
  const calls = getTrackVisit.mock.calls.length;
  await click(within(periods).getByRole("button", { name: "6개월" }));
  expect(MonthlyBarChart.mock.calls.at(-1)[0].series).toHaveLength(6);
  await click(within(periods).getByRole("button", { name: "1년" }));
  expect(MonthlyBarChart.mock.calls.at(-1)[0].series).toHaveLength(12);
  await click(within(periods).getByRole("button", { name: "전체" }));
  expect(MonthlyBarChart.mock.calls.at(-1)[0].series[0]).toEqual({ month: "2025-03", count: 2 });
  expect(getTrackVisit).toHaveBeenCalledTimes(calls);
});

test("월별 기록의 빈 상태와 조회 실패를 구분하고 재시도한다", async () => {
  getTrackVisit.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce("failed")
    .mockResolvedValueOnce({ data: [] });
  render(<ManagerPage />); await flushUpdates();
  await click(screen.getByText("월별 추이", { selector: "button" }));
  expect(await screen.findByText("월별 생성 기록을 불러오지 못했습니다.")).toBeTruthy();
  await click(screen.getByRole("button", { name: "다시 조회" }));
  expect(await screen.findByText("아직 기록된 생성 통계가 없습니다.")).toBeTruthy();
});

test("방문자·방문·페이지 열기 타일을 이름·설명과 함께 보여 주고, 기록 시작 전이 직전 기간에 섞이면 알린다", async () => {
  getTrends.mockResolvedValue({ days: 30, startDate: "2026-09-05", previousStart: "2026-08-06", eventsSince: "2026-08-20", series: [], metrics: [
    { key: "visitors", total: 451, previousTotal: 300, changePercent: 50.3 },
    { key: "visitDays", total: 620, previousTotal: 400, changePercent: 55 },
    { key: "visits", total: 1476, previousTotal: 396, changePercent: 272.7 },
  ] });
  render(<ManagerPage />); await flushUpdates();
  // 이름은 타일과 일별 추이 표 머리에 함께 있다.
  expect(screen.getAllByText("방문자").length).toBeGreaterThan(0);
  expect(screen.getByText("451")).toBeInTheDocument();
  expect(screen.getByText("기록을 남긴 서로 다른 브라우저")).toBeInTheDocument();
  expect(screen.getByText("방문")).toBeInTheDocument();
  expect(screen.getByText("620")).toBeInTheDocument();
  expect(screen.getAllByText("페이지 열기").length).toBeGreaterThan(0);
  expect(screen.queryByText("페이지 방문")).not.toBeInTheDocument();
  expect(screen.getByText(/방문자·방문 기록은 2026-08-20부터 쌓여 직전 기간 비교에 그 전이 섞여 있습니다/)).toBeInTheDocument();
});

test("관리자 통계가 실패해도 랜딩 신뢰 표시 카드는 따로 보인다", async () => {
  getTrends.mockResolvedValue(null);
  render(<ManagerPage />); await flushUpdates();
  expect(screen.getByText("랜딩 신뢰 표시")).toBeInTheDocument();
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
  await click(screen.getByText("3인 참여 달성률",{selector: "button"}));
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
  await click(screen.getByText("대시보드",{selector: "button"}));
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

test("블로그 조회가 0건이어도 글별 목록을 보여주고 전체 기간의 기록 한계를 알린다", async () => {
  render(<ManagerPage />); await flushUpdates();
  await click(screen.getByText("블로그", { selector: "button" }));
  expect(await screen.findByRole("heading", { name: "글별 조회" })).toBeTruthy();
  expect(screen.getByRole("table")).toBeTruthy();
  expect(screen.queryByText(/전환 기록은 최근 180일까지만 보관됩니다/)).toBeNull();
  await click(within(screen.getByRole("group", { name: "조회 기간" })).getByRole("button", { name: "전체" }));
  expect(await screen.findByText(/전환 기록은 최근 180일까지만 보관됩니다/)).toBeTruthy();
  expect(getBlogStats).toHaveBeenCalledWith(0);
});


const localTable = { tableId: "local-delete-target", title: "로컬 삭제 검증 표", participantCount: 1,
  dates: ["2099-01-01"], startHour: "09:00", endHour: "18:00", createdAt: "2026-09-25T00:00:00Z" };
const openTableDeletion = async () => {
  getAllTables.mockResolvedValue({ data: [localTable] });
  render(<ManagerPage />); await flushUpdates();
  await click(screen.getByText("테이블 관리", { selector: "button" }));
  await screen.findByText(localTable.title);
  await click(screen.getByRole("button", { name: "삭제" }));
};
test("삭제 범위와 복구 불가·통계 영향을 고지하고 취소하면 요청하지 않는다", async () => {
  Swal.fire.mockResolvedValue({ isConfirmed: false });
  await openTableDeletion();
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
    html: expect.stringContaining("삭제 후에는 복구할 수 없습니다."),
    confirmButtonText: "표와 참여 기록 삭제",
  }));
  expect(Swal.fire.mock.calls[0][0].html).toContain("카운터는 유지됩니다.");
  expect(deleteTable).not.toHaveBeenCalled();
  expect(screen.getByText(localTable.title)).toBeTruthy();
});
test("확인한 표만 삭제하고 성공 응답 후 목록에서 제거한다", async () => {
  Swal.fire.mockResolvedValue({ isConfirmed: true });
  deleteTable.mockResolvedValue({ success: true });
  await openTableDeletion();
  expect(deleteTable).toHaveBeenCalledTimes(1);
  expect(deleteTable).toHaveBeenCalledWith(localTable.tableId);
  expect(screen.queryByText(localTable.title)).toBeNull();
});
test("삭제 실패 시 표를 목록에 유지한다", async () => {
  Swal.fire.mockResolvedValue({ isConfirmed: true });
  deleteTable.mockResolvedValue({ success: false });
  await openTableDeletion();
  expect(screen.getByText(localTable.title)).toBeTruthy();
});
