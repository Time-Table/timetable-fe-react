import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import styled from "@emotion/styled";
import { Global, css } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiLayers,
  FiUsers,
  FiFilter,
  FiMessageSquare,
  FiExternalLink,
  FiEdit3,
  FiTrash2,
  FiX,
  FiShield,
  FiLogOut,
  FiSearch,
  FiBarChart2,
  FiTable,
  FiBookOpen,
  FiAlertCircle,
  FiMail,
  FiShuffle,
} from "react-icons/fi";
import Swal from "sweetalert2";

import Seo from "../Seo";
import { getTrackVisit } from "../api/visit";
import { getAllTables, updateTable, deleteTable } from "../api/table";
import { getFunnels } from "../api/event";
import {
  adminLogin,
  adminVerify,
  getTrends,
  getAudience,
  getChatFeed,
  getTableDetail,
  getBlogStats,
} from "../api/admin";
import { isAdmin, grantAdmin, revokeAdmin } from "../utils/admin";

import t from "./manager/tokens";
import {
  Card,
  CardTitle,
  CardSubtitle,
  SectionHeader,
  SectionTitle,
  SectionCaption,
  Grid,
  Segmented,
  SegmentedItem,
  Field,
  Select,
  Tag,
  Empty,
  Spinner,
  Loading,
  DataTable,
  IconButton,
  Button,
} from "./manager/ui";
import StatTile, { formatStat } from "./manager/StatTile";
import FunnelCard from "./manager/FunnelCard";
import ActivationCard from "./manager/ActivationCard";
import InquiryFeed from "./manager/InquiryFeed";
import ExperimentPanel from "./manager/ExperimentPanel";
import Explain from "./manager/Explain";
import Pagination, { usePaged, Anchor } from "./manager/Pagination";
import { joinBlogStats, sortBlogRows } from "./manager/blogStats";
import { createRequestSequence } from "./manager/latestRequest";
import { monthlyCreationSeries } from "./manager/monthlyTrend";
import { blogPosts } from "../data/blogPosts";
import { TrendChart, MonthlyBarChart, BarList } from "./manager/charts";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

const TABS = [
  { key: "dashboard", label: "대시보드", icon: FiGrid, scoped: true },
  { key: "monthly", label: "월별 추이", icon: FiBarChart2, scoped: false },
  { key: "participation", label: "3인 참여 달성률", icon: FiBarChart2, scoped: false },
  { key: "funnel", label: "퍼널 분석", icon: FiFilter, scoped: true },
  { key: "audience", label: "사용자 분석", icon: FiUsers, scoped: true },
  { key: "blog", label: "블로그", icon: FiBookOpen, scoped: true },
  { key: "tables", label: "테이블 관리", icon: FiLayers, scoped: false },
  { key: "chats", label: "채팅 모니터링", icon: FiMessageSquare, scoped: false },
  { key: "inquiries", label: "문의함", icon: FiMail, scoped: false },
  // 랜딩 A/B 1회차(2026-09-29). 기간은 실험 기간이라 기간 선택을 쓰지 않는다.
  { key: "experiments", label: "A/B 테스트", icon: FiShuffle, scoped: false },
];

const PERIODS = [
  { label: "7일", value: 7 },
  { label: "30일", value: 30 },
  { label: "90일", value: 90 },
];

const MONTHLY_PERIODS = [
  { label: "최근 3개월", value: 3 },
  { label: "6개월", value: 6 },
  { label: "1년", value: 12 },
  { label: "전체", value: 0 },
];

const METRIC_LABELS = {
  visits: "페이지 방문",
  tables: "테이블 생성",
  signUps: "참여 등록 건수",
  logins: "재로그인",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parts = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
};

const ManagerPage = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const isChecking = useRef(false);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [period, setPeriod] = useState(30);
  const [monthlyPeriod, setMonthlyPeriod] = useState(3);
  const [monthlyVisits, setMonthlyVisits] = useState(null);
  const [monthlyFailed, setMonthlyFailed] = useState(false);
  const [participationPeriod, setParticipationPeriod] = useState(0);
  const [participationReport, setParticipationReport] = useState(null);
  const [participationLoading, setParticipationLoading] = useState(false);
  const [participationFailed, setParticipationFailed] = useState(false);
  const [participationRefresh, setParticipationRefresh] = useState(0);

  const [trends, setTrends] = useState(null);
  const [funnelReport, setFunnelReport] = useState(null);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [funnelFailed, setFunnelFailed] = useState(false);
  const [funnelRefresh, setFunnelRefresh] = useState(0);
  const [audience, setAudience] = useState(null);
  const [tables, setTables] = useState([]);
  const [chatFeed, setChatFeed] = useState(null);
  const [visitRaw, setVisitRaw] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showTrendTable, setShowTrendTable] = useState(true);

  // 블로그 탭
  const [blogStats, setBlogStats] = useState(null);
  const [showBlogTable, setShowBlogTable] = useState(false);
  const [blogSort, setBlogSort] = useState("views");
  const [blogOnlyZero, setBlogOnlyZero] = useState(false);
  // 기간·탭을 빠르게 바꾸면 이전 요청의 응답이 나중에 도착해 최신 화면을 덮거나 로딩을 조기에 끈다.
  // 모든 탭의 요청에 순번을 주고, 마지막 요청만 화면과 로딩 상태를 바꾼다.
  const requestSeq = useRef(createRequestSequence());

  // 테이블 관리 필터
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [onlyEmpty, setOnlyEmpty] = useState(false);

  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [chatQuery, setChatQuery] = useState("");

  /* ---------------------------------------------------------------- 인증 */

  const checkAuth = useCallback(async () => {
    if (authed || isChecking.current) return;
    isChecking.current = true;

    if (isAdmin()) {
      const res = await adminVerify();
      if (res?.success) {
        setAuthed(true);
        isChecking.current = false;
        return;
      }
      revokeAdmin();
    }

    const { value: password, isDismissed } = await Swal.fire({
      title: "관리자 인증",
      input: "password",
      inputLabel: "관리자 비밀번호를 입력하세요",
      inputPlaceholder: "Password",
      allowOutsideClick: false,
      showCancelButton: true,
      cancelButtonText: "홈으로",
      confirmButtonColor: t.color.series1,
      inputAttributes: { autocapitalize: "off", autocorrect: "off" },
    });

    isChecking.current = false;

    if (isDismissed) {
      navigate("/");
      return;
    }

    const res = await adminLogin(password);
    if (res?.success) {
      grantAdmin(res.data.token);
      setAuthed(true);
      Toast.fire({
        icon: "success",
        title: "관리자 인증 완료",
        text: "관리자 인증 중인 브라우저는 자체 방문·행동·생성·참여 계측에서 제외됩니다. GA·Clarity 자동 수집은 별도입니다.",
      });
    } else {
      await Swal.fire("인증 실패", res?.message || "비밀번호가 틀렸습니다.", "error");
      navigate("/");
    }
  }, [authed, navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /* ---------------------------------------------------------------- 데이터 */

  const showsActivation = activeTab === "participation";
  useEffect(() => {
    if (!authed || !showsActivation) return;
    let cancelled = false;
    setParticipationLoading(true);
    setParticipationFailed(false);
    setParticipationReport(null);
    const load = async () => {
      try {
        const res = await getFunnels(participationPeriod);
        if (cancelled) return;
        setParticipationReport(res?.data?.participationMetrics || null);
        setParticipationFailed(!res?.data);
      } catch {
        if (!cancelled) setParticipationFailed(true);
      } finally {
        if (!cancelled) setParticipationLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [authed, showsActivation, participationPeriod, participationRefresh]);

  useEffect(() => {
    if (!authed || activeTab !== "funnel") return;
    let cancelled = false;
    setFunnelLoading(true);
    setFunnelFailed(false);
    setFunnelReport(null);
    const load = async () => {
      try {
        const res = await getFunnels(period);
        if (cancelled) return;
        setFunnelReport(res?.data || null);
        setFunnelFailed(!res?.data);
      } catch {
        if (!cancelled) setFunnelFailed(true);
      } finally {
        if (!cancelled) setFunnelLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [authed, activeTab, period, funnelRefresh]);

  const loadTab = useCallback(async () => {
    if (!authed) return;
    const isLatest = requestSeq.current.next();
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const [trendRes, visitRes] = await Promise.all([getTrends(period), getTrackVisit()]);
        if (!isLatest()) return;
        setTrends(trendRes);
        setVisitRaw(Array.isArray(visitRes?.data) ? visitRes.data : []);
      } else if (activeTab === "monthly") {
        setMonthlyFailed(false);
        try {
          const res = await getTrackVisit();
          if (!isLatest()) return;
          setMonthlyVisits(Array.isArray(res?.data) ? res.data : null);
          setMonthlyFailed(!Array.isArray(res?.data));
        } catch {
          if (!isLatest()) return;
          setMonthlyVisits(null);
          setMonthlyFailed(true);
        }
      } else if (activeTab === "audience") {
        const [audienceRes, tableRes] = await Promise.all([getAudience(period), getAllTables()]);
        if (!isLatest()) return;
        setAudience(audienceRes);
        setTables(tableRes?.data || []);
      } else if (activeTab === "blog") {
        const res = await getBlogStats(period);
        if (!isLatest()) return;
        setBlogStats(res);
      } else if (activeTab === "tables") {
        const res = await getAllTables();
        if (!isLatest()) return;
        setTables(res?.data || []);
      } else if (activeTab === "chats") {
        const res = await getChatFeed(200);
        if (!isLatest()) return;
        setChatFeed(res);
      }
    } finally {
      // 더 새 요청이 진행 중이면 로딩 표시를 끄지 않는다. 옛 응답이 "완료된 것처럼" 보이면 안 된다.
      if (isLatest()) setLoading(false);
    }
  }, [authed, activeTab, period]);

  useEffect(() => {
    loadTab();
  }, [loadTab]);

  const openDetail = async (tableId) => {
    setDetailLoading(true);
    setDetail({ loading: true });
    const res = await getTableDetail(tableId);
    setDetail(res);
    setDetailLoading(false);
  };

  const handleDelete = (table) => {
    Swal.fire({
      html: `
        <div style="text-align: left">
          <p style="margin: 0">다음 내용이 함께 삭제됩니다.</p>
          <ul style="margin: ${t.space(3)} 0 ${t.space(4)}; padding-left: ${t.space(6)}; line-height: 1.8">
            <li>모임 표</li>
            <li>참여자 정보</li>
            <li>가능 시간과 일정 집계</li>
            <li>참여 취소 기록</li>
            <li>채팅</li>
          </ul>
          <p style="margin: 0 0 ${t.space(4)}"><strong>삭제 후에는 복구할 수 없습니다.</strong></p>
          <p style="margin: 0">누적 방문·생성·참여 카운터는 유지됩니다.<br>현재 자료로 계산하는 현황·달성률은 바뀝니다.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "표와 참여 기록 삭제",
      cancelButtonText: "취소",
      confirmButtonColor: t.color.critical,
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      const result = await deleteTable(table.tableId);
      if (result?.success) {
        Toast.fire({ icon: "success", title: "삭제 완료" });
        setTables((prev) => prev.filter((row) => row.tableId !== table.tableId));
      } else {
        Toast.fire({ icon: "error", title: "삭제에 실패했습니다." });
      }
    });
  };

  /* ---------------------------------------------------------------- 파생값 */

  const visibleTables = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    let rows = tables.filter((row) => {
      if (onlyEmpty && (row.participantCount || 0) > 0) return false;
      if (!keyword) return true;
      return (
        row.title?.toLowerCase().includes(keyword) || row.tableId?.toLowerCase().includes(keyword)
      );
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "participants") return (b.participantCount || 0) - (a.participantCount || 0);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return rows;
  }, [tables, query, sortBy, onlyEmpty]);

  // 받아 둔 목록을 쪽으로 나눠 그린다. 요청 수·요청 크기는 그대로다.
  const tablePages = usePaged(visibleTables, 15, `${query}|${sortBy}|${onlyEmpty}`);

  const meetingPattern = useMemo(() => {
    if (!tables.length) return null;
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    tables.forEach((table) =>
      table.dates?.forEach((date) => {
        const day = new Date(`${date}T00:00:00+09:00`).getDay();
        if (!Number.isNaN(day)) dayCounts[day] += 1;
      }),
    );
    const labels = ["일", "월", "화", "수", "목", "금", "토"];
    const avgDates =
      tables.reduce((acc, table) => acc + (table.dates?.length || 0), 0) / tables.length;
    const weekendShare =
      (tables.filter((table) =>
        table.dates?.some((date) => [0, 6].includes(new Date(`${date}T00:00:00+09:00`).getDay())),
      ).length /
        tables.length) *
      100;

    return {
      days: labels.map((label, i) => ({ label, count: dayCounts[i] })),
      avgDates: avgDates.toFixed(1),
      weekendShare: weekendShare.toFixed(1),
      best: labels[dayCounts.indexOf(Math.max(...dayCounts))],
    };
  }, [tables]);

  const visibleChats = useMemo(() => {
    if (!chatFeed?.messages) return [];
    const keyword = chatQuery.trim().toLowerCase();
    if (!keyword) return chatFeed.messages;
    return chatFeed.messages.filter(
      (m) =>
        m.message.toLowerCase().includes(keyword) ||
        m.name.toLowerCase().includes(keyword) ||
        m.tableTitle.toLowerCase().includes(keyword),
    );
  }, [chatFeed, chatQuery]);

  const blogRows = useMemo(() => {
    if (!blogStats || blogStats.error) return [];
    const rows = joinBlogStats(blogPosts, blogStats);
    return sortBlogRows(blogOnlyZero ? rows.filter((row) => row.views === 0) : rows, blogSort);
  }, [blogStats, blogSort, blogOnlyZero]);

  const monthlySeries = useMemo(
    () => monthlyCreationSeries(monthlyVisits, monthlyPeriod),
    [monthlyVisits, monthlyPeriod],
  );

  const trendRows = useMemo(() => (trends?.series ? [...trends.series].reverse() : []), [trends]);
  const trendPages = usePaged(trendRows, 10, String(period));
  const blogPages = usePaged(blogRows, 10, `${blogSort}|${blogOnlyZero}|${period}`);
  const chatPages = usePaged(visibleChats, 20, chatQuery);

  if (!authed) return null;

  const logout = () => {
    revokeAdmin();
    window.location.href = "/";
  };

  const currentTab = TABS.find((tab) => tab.key === activeTab);
  const todayDate = formatDateTime(new Date()).slice(0, 10);
  const todayStats = trends?.series.find((row) => row.date === todayDate);

  // 블로그 조회수는 누적치가 의미 있어서 이 탭에만 "전체" 기간을 둔다.
  // 다른 탭은 0을 각자 다르게 해석하므로(추이는 30일, 퍼널은 전체) 탭을 나가면 30일로 되돌린다.
  const periodOptions = activeTab === "blog" ? [...PERIODS, { label: "전체", value: 0 }] : PERIODS;
  const blogPeriodLabel = period ? `최근 ${period}일` : "전체 기간";

  /* ---------------------------------------------------------------- 렌더 */

  return (
    <Shell data-admin-console>
      <Global styles={consoleReset} />
      <Seo title="Admin Console - 타임테이블" noindex />
      {/* 1023px 이하: 사이드바 대신 이 머리줄과 위쪽 탭 줄. 햄버거를 열지 않고 한 번에 탭을 옮긴다. */}
      <MobileBar>
        <Brand>
          <FiShield size={16} />
          <div>
            <strong>Admin</strong>
            <span>자체 행동 계측 제외 · GA·Clarity 별도</span>
          </div>
        </Brand>
        <IconButton onClick={logout} aria-label="로그아웃">
          <FiLogOut size={16} />
        </IconButton>
      </MobileBar>

      <Sidebar>
        <SidebarBrand>
          <FiShield size={17} />
          <div>
            <strong>Timetable</strong>
            <span>Admin Console</span>
          </div>
        </SidebarBrand>

        <Nav aria-label="관리 메뉴" data-tabstrip>
          {TABS.map((tab) => (
            <NavItem
              key={tab.key}
              type="button"
              $active={activeTab === tab.key}
              aria-current={activeTab === tab.key ? "page" : undefined}
              onClick={(event) => {
                setActiveTab(tab.key);
                if (tab.key !== "blog" && period === 0) setPeriod(30);
                // 탭 줄에서 고른 탭이 화면 밖에 걸쳐 있으면 보이게 끌어온다.
                event.currentTarget.scrollIntoView?.({ block: "nearest", inline: "nearest" });
                if (window.scrollY > 0) window.scrollTo(0, 0);
              }}
            >
              <tab.icon size={15} aria-hidden="true" />
              {tab.label}
            </NavItem>
          ))}
        </Nav>

        <SidebarFoot>
          <ExcludedNote>자체 행동 계측 제외 · GA·Clarity 별도</ExcludedNote>
          <NavItem type="button" onClick={logout}>
            <FiLogOut size={15} />
            로그아웃
          </NavItem>
        </SidebarFoot>
      </Sidebar>

      <Main>
        <TopBar>
          <div>
            <TopTitle>{currentTab?.label}</TopTitle>
            <SectionCaption>
              {activeTab === "dashboard" && "핵심 지표와 일별 추이"}
              {activeTab === "monthly" && "테이블 생성 수를 월별로 확인"}
              {activeTab === "participation" && "현재 보관 기록으로 보는 마감 전 참여 등록"}
              {activeTab === "funnel" && "행동 기록·등록 현황"}
              {activeTab === "audience" && "누가, 어디서, 어떤 기기로 오는지"}
              {activeTab === "blog" && "어떤 글이 읽히고, 읽은 사람이 서비스까지 오는지"}
              {activeTab === "tables" && `전체 ${tables.length.toLocaleString()}개`}
              {activeTab === "chats" && `전체 메시지 ${chatFeed?.total?.toLocaleString() || 0}건`}
              {activeTab === "inquiries" && "문의하기 양식으로 들어온 문의 · 10년 보관"}
              {activeTab === "experiments" && "랜딩 v1·v2 비교 · 브라우저 수 · 관리자 제외"}
            </SectionCaption>
          </div>

          {currentTab?.scoped && (
            <div>
              {showsActivation && <SectionCaption>보조 지표 기간</SectionCaption>}
              <Segmented role="group" aria-label={showsActivation ? "보조 지표 기간" : "조회 기간"}>
                {periodOptions.map((option) => (
                  <SegmentedItem
                    key={option.value}
                    $active={period === option.value}
                    onClick={() => setPeriod(option.value)}
                  >
                    {option.label}
                  </SegmentedItem>
                ))}
              </Segmented>
            </div>
          )}
        </TopBar>

        <Content $dim={loading}>
          {loading && activeTab !== "dashboard" && activeTab !== "monthly" && activeTab !== "participation" && !trends && !funnelReport && !audience && !chatFeed && !tables.length && !blogStats ? (
            <Loading>
              <Spinner />
              데이터를 불러오는 중입니다
            </Loading>
          ) : (
            <>
              {/* ------------------------------------------------ 대시보드 */}
              {activeTab === "dashboard" && (
                <Stack>
                  {trends ? <>
                  <Explain label="지표 설명">
                    <SectionCaption>보조 지표 · 선택 기간에 발생한 방문·생성·참여 등록 기록입니다. 참여 등록은 사람 수나 시간 입력 완료를 뜻하지 않습니다.</SectionCaption>
                  </Explain>
                  <Grid $min="200px" $mobileCols={2}>
                    {trends.metrics.map((metric) => (
                      <StatTile
                        key={metric.key}
                        label={METRIC_LABELS[metric.key]}
                        value={metric.total}
                        delta={metric.changePercent}
                        deltaLabel={`직전 ${trends.days}일 대비`}
                      />
                    ))}
                  </Grid>

                  {/* 오늘 네 수치는 한 줄 띠로 둔다. 타일 네 장이면 일별 추이가 첫 화면 밖으로 밀린다(2026-09-28). */}
                  <TodayStrip as="section" aria-label="오늘 통계">
                    <div>
                      <CardTitle>오늘 · {todayDate}</CardTitle>
                      <CardSubtitle>한국시간 기준 · 조회 시점까지의 누적 수치입니다.</CardSubtitle>
                      {!todayStats && <SectionCaption>오늘 통계를 불러오지 못했습니다. 다시 조회해 주세요.</SectionCaption>}
                    </div>
                    <TodayStats>
                      {["visits", "tables", "signUps", "logins"].map((key) => (
                        <TodayStat key={key}>
                          <span>{METRIC_LABELS[key]}</span>
                          <strong>{formatStat(todayStats?.[key])}</strong>
                        </TodayStat>
                      ))}
                    </TodayStats>
                  </TodayStrip>

                  <div>
                  <SectionHeader>
                    <TrendHead>
                      <SectionTitle as="h3" style={{ fontSize: "0.9375rem" }}>
                        일별 추이
                      </SectionTitle>
                      <SectionCaption>
                        한국시간 기준 · 최신 날짜부터 표시합니다. 그래프 보기로 전환할 수 있습니다.
                      </SectionCaption>
                    </TrendHead>
                    <Button onClick={() => setShowTrendTable((v) => !v)}>
                      {showTrendTable ? (
                        <>
                          <FiBarChart2 size={13} /> 그래프로 보기
                        </>
                      ) : (
                        <>
                          <FiTable size={13} /> 표로 보기
                        </>
                      )}
                    </Button>
                  </SectionHeader>

                  {showTrendTable ? (
                    <Anchor ref={trendPages.anchor}>
                    <Card style={{ padding: 0, overflowX: "auto" }}>
                      <DataTable $compact $dense>
                        <thead>
                          <tr>
                            <th>날짜</th>
                            <th>방문</th>
                            <th>생성</th>
                            <th>참여 등록</th>
                            <th>로그인</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendPages.rows.map((row) => (
                            <tr key={row.date}>
                              <td className="mono">{row.date}</td>
                              <td className="num strong">{row.visits.toLocaleString()}</td>
                              <td className="num">{row.tables.toLocaleString()}</td>
                              <td className="num">{row.signUps.toLocaleString()}</td>
                              <td className="num">{row.logins.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </DataTable>
                    </Card>
                    <div style={{ marginTop: t.space(3) }}>
                      <Pagination paged={trendPages} label="일별 추이 쪽" />
                    </div>
                    </Anchor>
                  ) : (
                    <Grid $min="300px">
                      {[
                        { key: "visits", color: t.color.series1 },
                        { key: "tables", color: t.color.series2 },
                        { key: "signUps", color: t.color.series3 },
                      ].map((item) => (
                        <Card key={item.key}>
                          <CardTitle>{METRIC_LABELS[item.key]}</CardTitle>
                          <CardSubtitle>최근 {trends.days}일</CardSubtitle>
                          <div style={{ marginTop: t.space(4) }}>
                            <TrendChart
                              series={trends.series}
                              valueKey={item.key}
                              color={item.color}
                              label={METRIC_LABELS[item.key]}
                            />
                          </div>
                        </Card>
                      ))}
                    </Grid>
                  )}
                  </div>

                  </> : <Card>
                    <CardTitle>방문·등록 통계</CardTitle>
                    <CardSubtitle>{loading ? "통계를 불러오는 중입니다." : "방문·등록 통계를 불러오지 못했습니다."}</CardSubtitle>
                    {!loading && <Button onClick={loadTab}>방문·등록 통계 다시 조회</Button>}
                  </Card>}
                  <Card>
                    <CardTitle>기존 누적 기록</CardTitle>
                    <CardSubtitle>기존 카운터를 보존한 값입니다. 생성 카운터는 과거 집계 방식이 변경되어 전체 보관 표 수와 다를 수 있습니다.</CardSubtitle>
                    <TotalsRow>
                      {[
                        { label: "누적 참여 등록 건수", value: visitRaw[0]?.totalSignUp },
                        { label: "기존 표 생성 카운터", value: visitRaw[0]?.totalTableCreateCount },
                        { label: "누적 랜딩 방문 수", value: visitRaw[0]?.totalVisitLandingPage },
                        { label: "기록된 일수", value: visitRaw.length },
                      ].map((item) => (
                        <Total key={item.label}>
                          <span>{item.label}</span>
                          <strong>{(item.value || 0).toLocaleString()}</strong>
                        </Total>
                      ))}
                    </TotalsRow>
                  </Card>
                </Stack>
              )}

              {activeTab === "monthly" && (
                <Stack>
                  <div>
                    <Segmented role="group" aria-label="월별 추이 기간">
                      {MONTHLY_PERIODS.map((option) => (
                        <SegmentedItem key={option.value} $active={monthlyPeriod === option.value}
                          aria-pressed={monthlyPeriod === option.value}
                          onClick={() => setMonthlyPeriod(option.value)}>
                          {option.label}
                        </SegmentedItem>
                      ))}
                    </Segmented>
                  </div>
                  <Card>
                    <CardTitle>월별 테이블 생성 수</CardTitle>
                    <CardSubtitle>한국시간 기준 일별 생성 기록을 월별로 합산했습니다. 현행 계측에서는 관리자 생성 표를 제외합니다.</CardSubtitle>
                    {monthlyFailed ? (
                      <>
                        <Empty>월별 생성 기록을 불러오지 못했습니다.</Empty>
                        <Button onClick={loadTab}>다시 조회</Button>
                      </>
                    ) : monthlyVisits === null ? (
                      <Loading><Spinner />월별 생성 기록을 불러오는 중입니다</Loading>
                    ) : monthlySeries.length === 0 ? (
                      <Empty>아직 기록된 생성 통계가 없습니다.</Empty>
                    ) : (
                      <>
                        <div style={{ marginTop: t.space(5) }}>
                          <MonthlyBarChart series={monthlySeries} />
                        </div>
                        {monthlySeries.some((row) => row.month === "2025-03") && (
                          <CardSubtitle>* 2025년 3월은 생성 계측 도입(18일) 전 건수가 빠져 있습니다.</CardSubtitle>
                        )}
                        <CardSubtitle>이번 달은 조회 시점까지의 수치입니다. 과거 계측 누락이 있어 정확한 평생 생성 총수와는 다를 수 있습니다.</CardSubtitle>
                      </>
                    )}
                  </Card>
                </Stack>
              )}

              {activeTab === "participation" && (
                <ActivationCard report={participationReport} loading={participationLoading} failed={participationFailed}
                  periodDays={participationPeriod} onPeriodChange={setParticipationPeriod}
                  onRetry={() => setParticipationRefresh((n) => n + 1)} />
              )}

              {/* ------------------------------------------------ 퍼널 */}
              {activeTab === "funnel" && (
                <Stack>
                  {(funnelLoading || funnelFailed) && <Card>
                    <CardTitle>행동 기록·등록 현황</CardTitle>
                    <CardSubtitle>{funnelLoading ? "보조 지표를 불러오는 중입니다." : "보조 지표를 불러오지 못했습니다."}</CardSubtitle>
                    {funnelFailed && <Button onClick={() => setFunnelRefresh((n) => n + 1)}>보조 지표 다시 조회</Button>}
                  </Card>}
                  {!funnelLoading && !funnelFailed && funnelReport && <>
                    <Explain label="행동 기록 기준">
                      <Notice>
                        행동 기록은 <strong>선택 기간에 이벤트를 남긴 브라우저</strong> 기준입니다.
                        같은 표·실제 행동 순서를 보장하지 않으며 차이만으로 이탈 원인을 확정할 수 없습니다.
                        관리자 인증 중인 브라우저의 자체 행동 기록은 제외합니다. GA·Clarity 자동 수집은 별도 설정입니다.
                      </Notice>
                    </Explain>
                    {funnelReport.funnels?.filter((funnel) => funnel.key !== "maturity").map((funnel) => (
                      <FunnelCard key={funnel.key} funnel={funnel} startDate={funnelReport.startDate} />
                    ))}
                    <Explain label="등록 인원 현황 기준">
                      <Notice>
                        등록 인원 현황은 <strong>선택 기간에 생성되어 현재 남아 있는 표</strong> 기준입니다.
                        현재 등록 이름 수를 보므로 참여 취소·표 삭제에 따라 줄어들며, 마감까지의 참여 달성률과 다릅니다.
                      </Notice>
                    </Explain>
                    {funnelReport.funnels?.filter((funnel) => funnel.key === "maturity").map((funnel) => (
                      <FunnelCard key={funnel.key} funnel={funnel} startDate={funnelReport.startDate} />
                    ))}
                  </>}
                </Stack>
              )}

              {/* ------------------------------------------------ 사용자 분석 */}
              {activeTab === "audience" && audience && (
                <Stack>
                  <Grid $min="200px" $mobileCols={2}>
                    <StatTile
                      label="측정된 방문자"
                      value={audience.totalVisitors}
                      hint="퍼널 이벤트를 한 번 이상 남긴 브라우저 수"
                    />
                    <StatTile
                      label="재방문율"
                      value={`${audience.retention.returningPercent}%`}
                      hint={`이틀 이상 방문 ${audience.retention.returning.toLocaleString()}명`}
                    />
                    <StatTile
                      label="참여 취소율"
                      value={`${audience.churn.deletedPercent}%`}
                      hint={`참여했다 삭제 ${audience.churn.deleted.toLocaleString()}명 / 유지 ${audience.churn.active.toLocaleString()}명`}
                    />
                    <StatTile
                      label="테이블당 평균 후보 날짜"
                      value={meetingPattern ? `${meetingPattern.avgDates}일` : "—"}
                      hint="모임 하나를 잡을 때 몇 개의 날짜를 놓고 고민하는지"
                    />
                  </Grid>

                  <Grid $min="320px">
                    <Card>
                      <CardTitle>기기 구성</CardTitle>
                      <CardSubtitle>
                        화면 폭 기준. 반응형 대응 우선순위를 정할 때 봅니다.
                      </CardSubtitle>
                      <div style={{ marginTop: t.space(5) }}>
                        <BarList
                          items={audience.devices}
                          emptyText="아직 기기 데이터가 없습니다. 사용자가 방문하면 쌓입니다."
                        />
                      </div>
                    </Card>

                    <Card>
                      <CardTitle>유입 경로</CardTitle>
                      <CardSubtitle>
                        첫 방문 시점의 출처만 기록합니다(first-touch). 블로그·검색이 실제로 유입을
                        만드는지 여기서 확인합니다.
                      </CardSubtitle>
                      <div style={{ marginTop: t.space(5) }}>
                        <BarList
                          items={audience.sources.slice(0, 8)}
                          emptyText="아직 유입 데이터가 없습니다."
                        />
                      </div>
                    </Card>
                  </Grid>

                  {meetingPattern && (
                    <Card>
                      <CardTitle>모임 패턴</CardTitle>
                      <CardSubtitle>
                        가장 인기 있는 요일은 <strong>{meetingPattern.best}요일</strong>이고, 후보에
                        주말이 포함된 테이블은 {meetingPattern.weekendShare}%입니다.
                      </CardSubtitle>
                      <div style={{ marginTop: t.space(5) }}>
                        <BarList items={meetingPattern.days} unit="회" />
                      </div>
                    </Card>
                  )}
                </Stack>
              )}

              {/* ------------------------------------------------ 블로그 */}
              {activeTab === "blog" && blogStats && (
                <Stack>
                  {blogStats.error === "notDeployed" && (
                    <Notice>
                      <NoticeIcon aria-hidden="true">
                        <FiAlertCircle size={14} />
                      </NoticeIcon>
                      <strong>블로그 통계 API가 아직 배포되지 않았습니다.</strong> GET /api/blog-views/stats 가
                      404를 돌려줍니다. 백엔드를 먼저 배포한 뒤 다시 확인하세요.
                      <NoticeAction>
                        <Button onClick={loadTab}>다시 확인</Button>
                      </NoticeAction>
                    </Notice>
                  )}

                  {blogStats.error === "failed" && (
                    <Notice>
                      <NoticeIcon aria-hidden="true">
                        <FiAlertCircle size={14} />
                      </NoticeIcon>
                      <strong>블로그 통계를 불러오지 못했습니다.</strong> 잠시 후 다시 시도해 주세요.
                      <NoticeAction>
                        <Button onClick={loadTab}>다시 시도</Button>
                      </NoticeAction>
                    </Notice>
                  )}

                  {!blogStats.error && (
                    <>
                      <Grid $min="200px" $mobileCols={2}>
                        <StatTile
                          label="조회수"
                          value={blogStats.total.views}
                          hint="글 페이지가 열린 횟수. 같은 사람이 다시 열어도 셉니다"
                        />
                        <StatTile
                          label="방문자"
                          value={blogStats.total.visitors}
                          hint="글을 한 번 이상 연 브라우저 수"
                        />
                        <StatTile
                          label="블로그 → 랜딩 도달"
                          value={
                            blogStats.conversion.blogVisitors
                              ? `${blogStats.conversion.reachedLandingPercent}%`
                              : "—"
                          }
                          hint={
                            blogStats.conversion.blogVisitors
                              ? `블로그 방문자 ${blogStats.conversion.blogVisitors.toLocaleString()}명 중 ${blogStats.conversion.reachedLanding.toLocaleString()}명의 서비스 첫 화면 방문이 보존된 기록에서 확인됐습니다`
                              : "아직 블로그 방문자가 없습니다"
                          }
                        />
                        <StatTile
                          label="블로그 → 테이블 생성"
                          value={
                            blogStats.conversion.blogVisitors
                              ? `${blogStats.conversion.createdTablePercent}%`
                              : "—"
                          }
                          hint={
                            blogStats.conversion.blogVisitors
                              ? `블로그 방문자 ${blogStats.conversion.blogVisitors.toLocaleString()}명 중 ${blogStats.conversion.createdTable.toLocaleString()}명의 테이블 생성이 보존된 기록에서 확인됐습니다`
                              : "아직 블로그 방문자가 없습니다"
                          }
                        />
                      </Grid>

                      {(!period || period > 180) && (
                        <Notice>
                          <strong>전환 기록은 최근 180일까지만 보관됩니다.</strong> 조회수와 방문자 수는
                          선택한 전체 기간을 포함하지만, 180일이 지난 전환 기록은 제외되어 전환율이
                          실제보다 낮게 표시될 수 있습니다.
                        </Notice>
                      )}

                      {blogStats.total.views === 0 ? (
                        <Card>
                          <Empty>
                            {blogPeriodLabel} 동안 기록된 블로그 조회가 없습니다. 기간을 늘려 보거나, 측정을
                            방금 시작했다면 누군가 글을 연 뒤 다시 확인하세요.
                          </Empty>
                        </Card>
                      ) : (
                        <>
                          <Grid $min="320px">
                            <Card>
                              <SectionHeader style={{ marginBottom: 0 }}>
                                <div>
                                  <CardTitle>일별 조회</CardTitle>
                                  <CardSubtitle>
                                    {blogPeriodLabel}. 모든 글의 조회수를 날짜별로 합쳤습니다.
                                  </CardSubtitle>
                                </div>
                                <Button
                                  aria-pressed={showBlogTable}
                                  onClick={() => setShowBlogTable((v) => !v)}
                                >
                                  {showBlogTable ? (
                                    <>
                                      <FiBarChart2 size={13} /> 그래프로 보기
                                    </>
                                  ) : (
                                    <>
                                      <FiTable size={13} /> 표로 보기
                                    </>
                                  )}
                                </Button>
                              </SectionHeader>
                              <div style={{ marginTop: t.space(4) }}>
                                {blogStats.series.length === 0 ? (
                                  <Empty>아직 일별 데이터가 없습니다.</Empty>
                                ) : showBlogTable ? (
                                  <ScrollBox tabIndex={0} aria-label="일별 조회 표">
                                    <DataTable $compact>
                                      <thead>
                                        <tr>
                                          <th scope="col">날짜</th>
                                          <th scope="col">조회</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {[...blogStats.series].reverse().map((row) => (
                                          <tr key={row.date}>
                                            <td className="mono">{row.date}</td>
                                            <td className="num strong">{row.views.toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </DataTable>
                                  </ScrollBox>
                                ) : (
                                  <TrendChart
                                    series={blogStats.series}
                                    valueKey="views"
                                    color={t.color.series1}
                                    label="조회"
                                  />
                                )}
                              </div>
                            </Card>

                            <Card>
                              <CardTitle>유입 출처</CardTitle>
                              <CardSubtitle>
                                블로그 글을 연 방문자가 어디서 왔는지. 상위 8개만 보입니다.
                              </CardSubtitle>
                              <div style={{ marginTop: t.space(5) }}>
                                <BarList
                                  items={blogStats.sources.slice(0, 8)}
                                  unit="명"
                                  emptyText="아직 유입 출처 데이터가 없습니다."
                                />
                              </div>
                            </Card>
                          </Grid>
                        </>
                      )}

                      <SectionHeader>
                        <div>
                          <SectionTitle as="h3" style={{ fontSize: "0.9375rem" }}>
                            글별 조회
                          </SectionTitle>
                          <Explain label="읽는 법">
                            <SectionCaption>
                              조회가 0인 글은 교체 후보입니다. 발행한 지 오래됐는데도 0이면 제목이나 주제를
                              바꿔 보세요.
                            </SectionCaption>
                          </Explain>
                        </div>
                        <FilterRow>
                          <Select
                            aria-label="글 정렬"
                            value={blogSort}
                            onChange={(e) => setBlogSort(e.target.value)}
                          >
                            <option value="views">조회순</option>
                            <option value="recent">최신순</option>
                          </Select>
                          <Toggle
                            $active={blogOnlyZero}
                            aria-pressed={blogOnlyZero}
                            onClick={() => setBlogOnlyZero((v) => !v)}
                          >
                            조회 0인 글만
                          </Toggle>
                          <ResultCount>{blogRows.length.toLocaleString()}개 글</ResultCount>
                        </FilterRow>
                      </SectionHeader>

                      <Anchor ref={blogPages.anchor}>
                      <Card style={{ padding: 0, overflowX: "auto" }}>
                        {blogRows.length === 0 ? (
                          <Empty>조회가 0인 글이 없습니다. 모든 글이 최소 한 번은 읽혔습니다.</Empty>
                        ) : (
                          <DataTable $stack>
                            <thead>
                              <tr>
                                <th scope="col" style={{ minWidth: 260 }}>
                                  제목
                                </th>
                                <th scope="col">카테고리</th>
                                <th scope="col">조회</th>
                                <th scope="col">방문자</th>
                                <th scope="col">마지막 조회</th>
                                <th scope="col">발행일</th>
                                <th scope="col">열기</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blogPages.rows.map((row) => (
                                <tr key={row.slug}>
                                  <td className={row.listed ? "strong title" : "mono title"}>
                                    {row.listed ? (
                                      row.title
                                    ) : (
                                      <>
                                        {row.slug} <Tag>목록에 없음</Tag>
                                      </>
                                    )}
                                  </td>
                                  <td>{row.listed ? <Tag>{row.category}</Tag> : "—"}</td>
                                  <td className="num">
                                    {row.views === 0 ? (
                                      <Tag $tone="critical">
                                        <FiAlertCircle size={11} /> 0회
                                      </Tag>
                                    ) : (
                                      <Tag>{row.views.toLocaleString()}회</Tag>
                                    )}
                                  </td>
                                  <td className="num" data-label="방문자">{row.visitors.toLocaleString()}</td>
                                  <td className="mono nowrap" data-label="마지막 조회">{formatDateTime(row.lastViewedAt)}</td>
                                  <td className="mono nowrap" data-label="발행일">{row.listed ? row.date : "—"}</td>
                                  <td className="actions">
                                    {row.listed && (
                                      <IconButton
                                        as="a"
                                        href={`/blog/${row.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={`${row.title} 새 탭에서 열기`}
                                      >
                                        <FiExternalLink size={13} />
                                      </IconButton>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </DataTable>
                        )}
                      </Card>
                      <div style={{ marginTop: t.space(3) }}>
                        <Pagination paged={blogPages} label="글별 조회 쪽" />
                      </div>
                      </Anchor>
                    </>
                  )}
                </Stack>
              )}

              {/* ------------------------------------------------ 테이블 관리 */}
              {activeTab === "tables" && (
                <Stack>
                  <Explain label="등록 인원 기준">
                    <Notice>등록 인원은 현재 표에 남아 있는 이름 수입니다. 시간 입력 여부나 마감 전 등록 여부를 구분하지 않으므로 3인 참여 달성률의 집계 인원과 다를 수 있습니다.</Notice>
                  </Explain>
                  <FilterRow>
                    <SearchBox>
                      <FiSearch size={14} />
                      <Field
                        placeholder="제목 또는 테이블 ID 검색"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </SearchBox>
                    <Select aria-label="테이블 정렬" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="recent">최신순</option>
                      <option value="oldest">오래된순</option>
                      <option value="participants">등록 인원 많은순</option>
                      <option value="title">제목순</option>
                    </Select>
                    <Toggle $active={onlyEmpty} aria-pressed={onlyEmpty} onClick={() => setOnlyEmpty((v) => !v)}>
                      등록 인원 0명만
                    </Toggle>
                    <ResultCount>{visibleTables.length.toLocaleString()}개</ResultCount>
                  </FilterRow>

                  <Anchor ref={tablePages.anchor}>
                  <Card style={{ padding: 0, overflowX: "auto" }}>
                    {tablePages.rows.length === 0 ? (
                      <Empty>조건에 맞는 테이블이 없습니다.</Empty>
                    ) : (
                      <DataTable $stack>
                        <thead>
                          <tr>
                            <th>제목</th>
                            <th>등록 인원</th>
                            <th>기간</th>
                            <th>생성일</th>
                            <th>ID</th>
                            <th>관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tablePages.rows.map((table) => (
                            <tr key={table.tableId}>
                              <td className="strong title">
                                <LinkTitle onClick={() => openDetail(table.tableId)}>
                                  {table.title}
                                </LinkTitle>
                              </td>
                              <td className="num">
                                {(table.participantCount || 0) === 0 ? (
                                  <Tag $tone="critical">
                                    <FiAlertCircle size={11} aria-hidden="true" /> {table.participantCount || 0}명
                                  </Tag>
                                ) : (
                                  <Tag>{table.participantCount}명</Tag>
                                )}
                              </td>
                              <td className="num">
                                {table.dates?.length || 0}일 · {table.startHour}~{table.endHour}
                              </td>
                              <td className="mono" data-label="생성일">{formatDateTime(table.createdAt)}</td>
                              <td className="mono" data-label="ID">{table.tableId.slice(0, 8)}</td>
                              <td className="actions">
                                <Actions>
                                  <IconButton
                                    $color={t.color.series1}
                                    onClick={() => setEditing({ ...table })}
                                    aria-label="수정"
                                  >
                                    <FiEdit3 size={13} />
                                  </IconButton>
                                  <IconButton
                                    as="a"
                                    href={`/table/${table.tableId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="새 탭에서 열기"
                                  >
                                    <FiExternalLink size={13} />
                                  </IconButton>
                                  <IconButton
                                    $color={t.color.critical}
                                    onClick={() => handleDelete(table)}
                                    aria-label="삭제"
                                  >
                                    <FiTrash2 size={13} />
                                  </IconButton>
                                </Actions>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </DataTable>
                    )}
                  </Card>
                  </Anchor>

                  <Pagination paged={tablePages} label="테이블 목록 쪽" />
                </Stack>
              )}

              {/* ------------------------------------------------ 채팅 */}
              {activeTab === "chats" && chatFeed && (
                <Stack>
                  <Explain label="모니터링 안내">
                    <Notice>
                      익명 서비스라 스팸이나 욕설이 올라와도 알아채기 어렵습니다. 최근 메시지를 최신순으로
                      모아 두었으니 훑어보고 문제가 있으면 해당 테이블을 조치하세요.
                    </Notice>
                  </Explain>

                  <FilterRow>
                    <SearchBox>
                      <FiSearch size={14} />
                      <Field
                        placeholder="메시지 · 작성자 · 테이블 검색"
                        value={chatQuery}
                        onChange={(e) => setChatQuery(e.target.value)}
                      />
                    </SearchBox>
                    <ResultCount>{visibleChats.length.toLocaleString()}건</ResultCount>
                  </FilterRow>

                  <Anchor ref={chatPages.anchor}>
                  <Card style={{ padding: 0 }}>
                    {visibleChats.length === 0 ? (
                      <Empty>메시지가 없습니다.</Empty>
                    ) : (
                      chatPages.rows.map((message, i) => (
                        <ChatRow key={`${message.tableId}-${chatPages.page}-${i}`}>
                          <ChatHead>
                            <ChatName>{message.name}</ChatName>
                            <ChatTable onClick={() => openDetail(message.tableId)}>
                              {message.tableTitle}
                            </ChatTable>
                            <ChatTime>{formatDateTime(message.timestamp)}</ChatTime>
                          </ChatHead>
                          <ChatBody>{message.message}</ChatBody>
                        </ChatRow>
                      ))
                    )}
                  </Card>
                  </Anchor>
                  <Pagination paged={chatPages} label="채팅 쪽" />
                </Stack>
              )}

              {/* ------------------------------------------------ 문의함 */}
              {activeTab === "inquiries" && <InquiryFeed onOpenTable={openDetail} />}

              {/* ------------------------------------------------ A/B 테스트 */}
              {activeTab === "experiments" && <ExperimentPanel />}
            </>
          )}
        </Content>
      </Main>

      {/* ------------------------------------------------ 테이블 상세 */}
      {detail && (
        <Overlay onClick={() => setDetail(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            {detailLoading || detail.loading ? (
              <Loading>
                <Spinner />
                불러오는 중
              </Loading>
            ) : (
              <>
                <ModalHead>
                  <div>
                    <CardTitle>{detail.table.title}</CardTitle>
                    <CardSubtitle>
                      {formatDateTime(detail.table.createdAt)} 생성 · {detail.table.dates?.length}일
                      후보 · {detail.table.startHour}~{detail.table.endHour}
                    </CardSubtitle>
                  </div>
                  <IconButton onClick={() => setDetail(null)} aria-label="닫기">
                    <FiX size={15} />
                  </IconButton>
                </ModalHead>

                <ModalBody>
                  <Grid $min="130px">
                    <MiniStat>
                      <span>참여자</span>
                      <strong>{detail.participants.length}</strong>
                    </MiniStat>
                    <MiniStat>
                      <span>참여 취소</span>
                      <strong>{detail.deleted.length}</strong>
                    </MiniStat>
                    <MiniStat>
                      <span>채팅</span>
                      <strong>{detail.chatCount}</strong>
                    </MiniStat>
                  </Grid>

                  <SubTitle>참여자별 입력량</SubTitle>
                  {detail.participants.length === 0 ? (
                    <Empty>아직 참여자가 없습니다.</Empty>
                  ) : (
                    <BarList
                      items={detail.participants.map((p) => ({
                        label: p.name,
                        count: p.slotCount,
                      }))}
                      unit="칸"
                    />
                  )}

                  {detail.topSlots.length > 0 && (
                    <>
                      <SubTitle>가장 많이 겹치는 시간</SubTitle>
                      <BarList
                        items={detail.topSlots.map((slot) => ({
                          label: slot.cell,
                          count: slot.count,
                        }))}
                        color={t.color.series3}
                      />
                    </>
                  )}

                  {detail.deleted.length > 0 && (
                    <>
                      <SubTitle>참여를 취소한 사람</SubTitle>
                      <TagRow>
                        {detail.deleted.map((d, i) => (
                          <Tag key={`${d.name}-${i}`}>{d.name}</Tag>
                        ))}
                      </TagRow>
                    </>
                  )}
                </ModalBody>

                <ModalFoot>
                  <Button as="a" href={`/table/${detail.table.tableId}`} target="_blank" rel="noreferrer">
                    테이블 열기
                  </Button>
                  <Button $variant="primary" onClick={() => setDetail(null)}>
                    닫기
                  </Button>
                </ModalFoot>
              </>
            )}
          </Modal>
        </Overlay>
      )}

      {/* ------------------------------------------------ 테이블 수정 */}
      {editing && (
        <Overlay onClick={() => setEditing(null)}>
          <Modal onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <ModalHead>
              <CardTitle>테이블 수정</CardTitle>
              <IconButton onClick={() => setEditing(null)} aria-label="닫기">
                <FiX size={15} />
              </IconButton>
            </ModalHead>
            <ModalBody>
              <FormRow>
                <label htmlFor="edit-title">제목</label>
                <Field
                  id="edit-title"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </FormRow>
              <TwoUp>
                <FormRow>
                  <label htmlFor="edit-start">시작</label>
                  <Field
                    id="edit-start"
                    value={editing.startHour}
                    onChange={(e) => setEditing({ ...editing, startHour: e.target.value })}
                  />
                </FormRow>
                <FormRow>
                  <label htmlFor="edit-end">종료</label>
                  <Field
                    id="edit-end"
                    value={editing.endHour}
                    onChange={(e) => setEditing({ ...editing, endHour: e.target.value })}
                  />
                </FormRow>
              </TwoUp>
            </ModalBody>
            <ModalFoot>
              <Button onClick={() => setEditing(null)}>취소</Button>
              <Button
                $variant="primary"
                onClick={async () => {
                  const res = await updateTable(editing.tableId, editing);
                  if (res?.success) {
                    Toast.fire({ icon: "success", title: "수정 완료" });
                    setEditing(null);
                    loadTab();
                  } else {
                    Toast.fire({ icon: "error", title: "수정에 실패했습니다." });
                  }
                }}
              >
                저장
              </Button>
            </ModalFoot>
          </Modal>
        </Overlay>
      )}
    </Shell>
  );
};

/* ------------------------------------------------------------------ 레이아웃 */

/**
 * 콘솔 안 제목·문단의 브라우저 기본 여백(위아래 1em)을 없앤다. 전역 초기화가 없어 타일 이름 한 줄에도
 * 위아래 12px씩 붙어 화면이 성겼다(2026-09-28). :where()로 우선순위를 0으로 둬서
 * 부품이 직접 정한 여백(CardSubtitle의 margin-top 등)은 그대로 이긴다.
 */
const consoleReset = css`
  :where([data-admin-console]) :where(p, h1, h2, h3, h4, dl, dd) {
    margin: 0;
  }
`;

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${t.color.bg};
  color: ${t.color.ink};
  font-family: ${t.font.sans};

  @media ${t.media.compact} {
    flex-direction: column;
  }
`;

const MobileBar = styled.header`
  display: none;

  @media ${t.media.compact} {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${t.space(3)};
    padding: 0 ${t.space(2)} 0 ${t.space(4)};
    background: ${t.color.surface};
  }
`;

// 모바일 머리줄은 한 줄로 둔다. 좁으면 안내 문구가 다음 줄로 내려간다.
const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${t.space(2)};
  min-width: 0;

  svg {
    flex-shrink: 0;
  }
  div {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: ${t.space(2)};
  }
  strong {
    font-size: 0.9375rem;
    font-weight: 600;
  }
  span {
    font-size: 0.75rem;
    color: ${t.color.muted};
  }
`;

/* 1023px 이하에서는 같은 메뉴를 위쪽에 붙는 가로 탭 줄로 바꾼다. 버튼은 한 벌만 둔다. */
const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 232px;
  background: ${t.color.sidebar};
  color: ${t.color.onDarkMuted};

  @media ${t.media.compact} {
    position: sticky;
    top: 0;
    z-index: 30;
    width: 100%;
    background: ${t.color.surface};
    border-bottom: 1px solid ${t.color.border};
  }
`;

const SidebarBrand = styled.div`
  display: flex;
  align-items: center;
  gap: ${t.space(3)};
  padding: ${t.space(6)} ${t.space(5)};
  color: ${t.color.onDark};
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  strong {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  span {
    display: block;
    margin-top: 1px;
    font-size: 0.75rem;
    color: ${t.color.onDarkMuted};
  }

  @media ${t.media.compact} {
    display: none;
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: ${t.space(3)};
  display: flex;
  flex-direction: column;
  gap: 2px;

  @media ${t.media.compact} {
    flex-direction: row;
    gap: 0;
    padding: 0 ${t.space(2)};
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${t.space(3)};
  width: 100%;
  padding: ${t.space(3)} ${t.space(3)};
  border: none;
  border-radius: ${t.radius.md};
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  text-align: left;
  color: ${(p) => (p.$active ? t.color.onDark : t.color.onDarkMuted)};
  background: ${(p) => (p.$active ? "rgba(255,255,255,0.10)" : "transparent")};
  transition: background 0.15s ease;

  &:hover {
    background: ${t.color.sidebarHover};
    color: ${t.color.onDark};
  }
  &:focus-visible {
    outline: 2px solid ${t.color.onDark};
    outline-offset: -2px;
  }

  @media ${t.media.compact} {
    flex-shrink: 0;
    width: auto;
    min-height: ${t.touch};
    gap: ${t.space(1)};
    padding: 0 ${t.space(3)};
    border-radius: 0;
    white-space: nowrap;
    font-size: 0.875rem;
    color: ${(p) => (p.$active ? t.color.ink : t.color.ink2)};
    background: none;
    box-shadow: ${(p) => (p.$active ? `inset 0 -2px 0 ${t.color.ink}` : "none")};

    &:hover {
      background: none;
      color: ${t.color.ink};
    }
    &:focus-visible {
      outline-color: ${t.color.series1};
    }
    svg {
      display: none;
    }
  }
`;

const SidebarFoot = styled.div`
  padding: ${t.space(3)};
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  @media ${t.media.compact} {
    display: none;
  }
`;

const ExcludedNote = styled.p`
  padding: 0 ${t.space(3)} ${t.space(3)};
  font-size: 0.75rem;
  line-height: 1.5;
  color: ${t.color.onDarkMuted};
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${t.space(4)};
  padding: ${t.space(5)} ${t.space(8)} ${t.space(4)};
  border-bottom: 1px solid ${t.color.border};
  background: ${t.color.surface};

  /* 모바일: 설명 한 줄과 기간 버튼을 한 줄에 두고, 안 들어가면 다음 줄로 넘긴다. */
  @media ${t.media.mobile} {
    align-items: center;
    gap: ${t.space(2)} ${t.space(3)};
    padding: ${t.space(2)} ${t.space(4)};

    & > div:first-of-type {
      flex: 1 1 120px;
      min-width: 0;
    }
    p {
      margin-top: 0;
    }
  }
`;

// 모바일에서는 바로 위 탭 줄이 같은 이름을 보여 주므로 제목은 화면 읽기용으로만 남긴다.
const TopTitle = styled(SectionTitle)`
  @media ${t.media.mobile} {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: ${t.space(6)} ${t.space(8)} ${t.space(8)};
  opacity: ${(p) => (p.$dim ? 0.55 : 1)};
  transition: opacity 0.15s ease;

  @media ${t.media.mobile} {
    padding: ${t.space(3)};
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.space(4)};

  @media ${t.media.mobile} {
    gap: ${t.space(3)};
  }
`;

const TodayStrip = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${t.space(3)} ${t.space(8)};
  padding: ${t.space(4)} ${t.space(6)};

  @media ${t.media.mobile} {
    padding: ${t.space(3)} ${t.space(4)};
  }
`;

const TodayStats = styled.div`
  flex: 1 1 480px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${t.space(4)};

  @media ${t.media.mobile} {
    flex-basis: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${t.space(1)} ${t.space(4)};
  }
`;

const TodayStat = styled.div`
  span {
    display: block;
    font-size: 0.75rem;
    color: ${t.color.ink2};
  }
  strong {
    display: block;
    margin-top: 2px;
    font-size: 1.25rem;
    font-weight: 600;
    color: ${t.color.ink};
  }

  /* 모바일은 이름과 값을 한 줄에 둔다. */
  @media ${t.media.mobile} {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: ${t.space(2)};

    strong {
      margin-top: 0;
      font-size: 1rem;
    }
  }
`;

// 일별 추이 제목과 설명을 PC에서는 한 줄로 둔다.
const TrendHead = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  column-gap: ${t.space(3)};

  p {
    margin-top: 0;
  }

  /* 모바일: 제목과 버튼을 한 줄에, 설명은 그 아래 줄에 둔다. */
  @media ${t.media.mobile} {
    display: contents;

    h3 {
      flex: 1;
    }
    p {
      order: 2;
      flex-basis: 100%;
    }
  }
`;

const Notice = styled.p`
  padding: ${t.space(4)};

  @media ${t.media.mobile} {
    padding: ${t.space(3)};
  }
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.md};
  background: ${t.color.surface};
  font-size: 0.8125rem;
  line-height: 1.7;
  color: ${t.color.ink2};

  strong {
    font-weight: 600;
    color: ${t.color.ink};
  }
`;

// Notice 안에서 아이콘은 critical(4.68:1)을 쓴다. warning은 1.79:1이라 아이콘으로도 안 보인다.
const NoticeIcon = styled.span`
  display: inline-flex;
  vertical-align: -2px;
  margin-right: ${t.space(1)};
  color: ${t.color.critical};
`;

const NoticeAction = styled.span`
  display: inline-block;
  margin-left: ${t.space(2)};
`;

// 표/그래프 토글 시 카드 높이가 튀지 않도록 차트 높이(150 + 16 + 26)에 맞춘다.
const ScrollBox = styled.div`
  max-height: 192px;
  overflow-y: auto;
`;

const TotalsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${t.space(4)};
  margin-top: ${t.space(5)};
`;

const Total = styled.div`
  span {
    display: block;
    font-size: 0.75rem;
    color: ${t.color.muted};
  }
  strong {
    display: block;
    margin-top: ${t.space(1)};
    font-size: 1.125rem;
    font-weight: 600;
    color: ${t.color.ink};
  }
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${t.space(3)};
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;

  @media ${t.media.mobile} {
    flex-basis: 100%;
    min-width: 0;
  }
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: ${t.space(3)};
    color: ${t.color.muted};
    pointer-events: none;
  }
  input {
    padding-left: ${t.space(9)};
  }
`;

const Toggle = styled.button`
  padding: ${t.space(2)} ${t.space(4)};
  border-radius: ${t.radius.md};
  border: 1px solid ${(p) => (p.$active ? t.color.critical : t.color.border)};
  background: ${(p) => (p.$active ? `${t.color.critical}10` : t.color.surface)};
  color: ${(p) => (p.$active ? t.color.critical : t.color.ink2)};
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${t.color.series1};
    outline-offset: 1px;
  }

  @media ${t.media.mobile} {
    min-height: ${t.touch};
  }
`;

const ResultCount = styled.span`
  font-size: 0.75rem;
  color: ${t.color.muted};
  font-variant-numeric: tabular-nums;
`;

const LinkTitle = styled.button`
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  color: ${t.color.ink};
  cursor: pointer;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${t.color.series1};
    outline-offset: 2px;
  }

  @media ${t.media.mobile} {
    font-size: 0.9375rem;
    text-decoration: underline;
    text-decoration-color: ${t.color.grid};
    text-underline-offset: 3px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: ${t.space(2)};
`;

const ChatRow = styled.div`
  padding: ${t.space(4)} ${t.space(5)};

  @media ${t.media.mobile} {
    padding: ${t.space(3)} ${t.space(4)};
  }
  border-bottom: 1px solid ${t.color.grid};

  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${t.color.surfaceSunken};
  }
`;

const ChatHead = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${t.space(2)};
  margin-bottom: ${t.space(2)};
`;

const ChatName = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${t.color.ink};
`;

// 13px 이하 글자는 series1(4.30:1)로 쓰지 않는다. 링크임은 밑줄로 알린다.
const ChatTable = styled.button`
  border: none;
  background: none;
  padding: 0;
  font-family: inherit;
  font-size: 0.75rem;
  color: ${t.color.ink2};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover {
    color: ${t.color.ink};
  }
`;

const ChatTime = styled.span`
  margin-left: auto;
  font-size: 0.75rem;
  color: ${t.color.muted};
  font-variant-numeric: tabular-nums;
`;

const ChatBody = styled.p`
  font-size: 0.8125rem;
  line-height: 1.6;
  color: ${t.color.ink2};
  word-break: break-word;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${t.space(5)};
  background: rgba(11, 11, 11, 0.45);

  @media ${t.media.mobile} {
    padding: ${t.space(3)};
  }
`;

const Modal = styled.div`
  width: 100%;
  max-width: 560px;
  max-height: 88vh;
  overflow-y: auto;
  background: ${t.color.surface};
  border-radius: ${t.radius.lg};
  box-shadow: ${t.shadow.modal};
`;

const ModalHead = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${t.space(4)};
  padding: ${t.space(5)};
  border-bottom: 1px solid ${t.color.border};
  background: ${t.color.surface};
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.space(4)};
  padding: ${t.space(5)};
`;

const ModalFoot = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${t.space(2)};
  padding: ${t.space(4)} ${t.space(5)};
  border-top: 1px solid ${t.color.border};
`;

const MiniStat = styled.div`
  padding: ${t.space(3)} ${t.space(4)};
  background: ${t.color.surfaceSunken};
  border-radius: ${t.radius.md};

  span {
    display: block;
    font-size: 0.75rem;
    color: ${t.color.muted};
  }
  strong {
    display: block;
    margin-top: 2px;
    font-size: 1.125rem;
    font-weight: 600;
    color: ${t.color.ink};
  }
`;

const SubTitle = styled.h4`
  margin-top: ${t.space(2)};
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.color.ink2};
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${t.space(2)};
`;

const FormRow = styled.div`
  flex: 1;

  label {
    display: block;
    margin-bottom: ${t.space(2)};
    font-size: 0.75rem;
    font-weight: 500;
    color: ${t.color.ink2};
  }
`;

const TwoUp = styled.div`
  display: flex;
  gap: ${t.space(3)};
`;

export default ManagerPage;
