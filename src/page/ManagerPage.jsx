import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import styled from "@emotion/styled";
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
  FiMenu,
  FiLogOut,
  FiSearch,
  FiBarChart2,
  FiTable,
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
import StatTile from "./manager/StatTile";
import FunnelCard from "./manager/FunnelCard";
import { TrendChart, BarList } from "./manager/charts";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

const TABS = [
  { key: "dashboard", label: "대시보드", icon: FiGrid, scoped: true },
  { key: "funnel", label: "퍼널 분석", icon: FiFilter, scoped: true },
  { key: "audience", label: "사용자 분석", icon: FiUsers, scoped: true },
  { key: "tables", label: "테이블 관리", icon: FiLayers, scoped: false },
  { key: "chats", label: "채팅 모니터링", icon: FiMessageSquare, scoped: false },
];

const PERIODS = [
  { label: "7일", value: 7 },
  { label: "30일", value: 30 },
  { label: "90일", value: 90 },
];

const METRIC_LABELS = {
  visits: "페이지 방문",
  tables: "테이블 생성",
  signUps: "신규 참여",
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState(30);

  const [trends, setTrends] = useState(null);
  const [funnelReport, setFunnelReport] = useState(null);
  const [audience, setAudience] = useState(null);
  const [tables, setTables] = useState([]);
  const [chatFeed, setChatFeed] = useState(null);
  const [visitRaw, setVisitRaw] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showTrendTable, setShowTrendTable] = useState(false);

  // 테이블 관리 필터
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 15;

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
        text: "이 브라우저의 활동은 통계에서 제외됩니다.",
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

  const loadTab = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const [trendRes, visitRes] = await Promise.all([getTrends(period), getTrackVisit()]);
        setTrends(trendRes);
        setVisitRaw(Array.isArray(visitRes?.data) ? visitRes.data : []);
      } else if (activeTab === "funnel") {
        const res = await getFunnels(period);
        setFunnelReport(res?.data || null);
      } else if (activeTab === "audience") {
        const [audienceRes, tableRes] = await Promise.all([getAudience(period), getAllTables()]);
        setAudience(audienceRes);
        setTables(tableRes?.data || []);
      } else if (activeTab === "tables") {
        const res = await getAllTables();
        setTables(res?.data || []);
      } else if (activeTab === "chats") {
        setChatFeed(await getChatFeed(200));
      }
    } finally {
      setLoading(false);
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
      title: "테이블을 삭제할까요?",
      text: `"${table.title}" · 참여자 ${table.participantCount || 0}명`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "삭제",
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

  const totalPages = Math.max(Math.ceil(visibleTables.length / perPage), 1);
  const pagedTables = visibleTables.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [query, sortBy, onlyEmpty]);

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

  if (!authed) return null;

  const currentTab = TABS.find((tab) => tab.key === activeTab);

  /* ---------------------------------------------------------------- 렌더 */

  return (
    <Shell>
      <Seo title="Admin Console - 타임테이블" noindex />
      <MobileBar>
        <Brand>
          <FiShield size={16} />
          <span>Admin</span>
        </Brand>
        <IconButton onClick={() => setSidebarOpen((v) => !v)} aria-label="메뉴">
          {sidebarOpen ? <FiX size={16} /> : <FiMenu size={16} />}
        </IconButton>
      </MobileBar>

      {sidebarOpen && <Scrim onClick={() => setSidebarOpen(false)} />}

      <Sidebar $open={sidebarOpen}>
        <SidebarBrand>
          <FiShield size={17} />
          <div>
            <strong>Timetable</strong>
            <span>Admin Console</span>
          </div>
        </SidebarBrand>

        <Nav>
          {TABS.map((tab) => (
            <NavItem
              key={tab.key}
              $active={activeTab === tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSidebarOpen(false);
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </NavItem>
          ))}
        </Nav>

        <SidebarFoot>
          <ExcludedNote>이 브라우저는 통계에서 제외됩니다</ExcludedNote>
          <NavItem
            as="button"
            onClick={() => {
              revokeAdmin();
              window.location.href = "/";
            }}
          >
            <FiLogOut size={15} />
            로그아웃
          </NavItem>
        </SidebarFoot>
      </Sidebar>

      <Main>
        <TopBar>
          <div>
            <SectionTitle>{currentTab?.label}</SectionTitle>
            <SectionCaption>
              {activeTab === "dashboard" && "핵심 지표와 일별 추이"}
              {activeTab === "funnel" && "사용자가 어디서 이탈하는지"}
              {activeTab === "audience" && "누가, 어디서, 어떤 기기로 오는지"}
              {activeTab === "tables" && `전체 ${tables.length.toLocaleString()}개`}
              {activeTab === "chats" && `전체 메시지 ${chatFeed?.total?.toLocaleString() || 0}건`}
            </SectionCaption>
          </div>

          {currentTab?.scoped && (
            <Segmented>
              {PERIODS.map((option) => (
                <SegmentedItem
                  key={option.value}
                  $active={period === option.value}
                  onClick={() => setPeriod(option.value)}
                >
                  {option.label}
                </SegmentedItem>
              ))}
            </Segmented>
          )}
        </TopBar>

        <Content $dim={loading}>
          {loading && !trends && !funnelReport && !audience && !chatFeed && !tables.length ? (
            <Loading>
              <Spinner />
              데이터를 불러오는 중입니다
            </Loading>
          ) : (
            <>
              {/* ------------------------------------------------ 대시보드 */}
              {activeTab === "dashboard" && trends && (
                <Stack>
                  <Grid $min="200px">
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

                  <SectionHeader>
                    <div>
                      <SectionTitle as="h3" style={{ fontSize: "0.9375rem" }}>
                        일별 추이
                      </SectionTitle>
                      <SectionCaption>
                        지표마다 자릿수가 달라 하나씩 나눠 그립니다. 축이 두 개인 그래프는 없는
                        상관관계를 만들어냅니다.
                      </SectionCaption>
                    </div>
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
                    <Card style={{ padding: 0, overflowX: "auto" }}>
                      <DataTable>
                        <thead>
                          <tr>
                            <th>날짜</th>
                            <th>방문</th>
                            <th>생성</th>
                            <th>참여</th>
                            <th>로그인</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...trends.series].reverse().map((row) => (
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

                  <Card>
                    <CardTitle>누적 지표</CardTitle>
                    <CardSubtitle>서비스 시작 이후 전체</CardSubtitle>
                    <TotalsRow>
                      {[
                        { label: "누적 참여자", value: visitRaw[0]?.totalSignUp },
                        { label: "누적 테이블", value: visitRaw[0]?.totalTableCreateCount },
                        { label: "누적 방문", value: visitRaw[0]?.totalVisitLandingPage },
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

              {/* ------------------------------------------------ 퍼널 */}
              {activeTab === "funnel" && (
                <Stack>
                  <Notice>
                    각 단계는 <strong>앞 단계를 모두 거친 사람</strong>만 세는 순서 퍼널입니다.
                    관리자로 인증한 브라우저의 활동은 집계에서 제외됩니다.
                    {funnelReport?.startDate && ` (${funnelReport.startDate} ~ 오늘)`}
                  </Notice>
                  {funnelReport?.funnels?.map((funnel) => (
                    <FunnelCard key={funnel.key} funnel={funnel} />
                  ))}
                </Stack>
              )}

              {/* ------------------------------------------------ 사용자 분석 */}
              {activeTab === "audience" && audience && (
                <Stack>
                  <Grid $min="200px">
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

              {/* ------------------------------------------------ 테이블 관리 */}
              {activeTab === "tables" && (
                <Stack>
                  <FilterRow>
                    <SearchBox>
                      <FiSearch size={14} />
                      <Field
                        placeholder="제목 또는 테이블 ID 검색"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </SearchBox>
                    <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="recent">최신순</option>
                      <option value="oldest">오래된순</option>
                      <option value="participants">참여자 많은순</option>
                      <option value="title">제목순</option>
                    </Select>
                    <Toggle $active={onlyEmpty} onClick={() => setOnlyEmpty((v) => !v)}>
                      참여자 0명만
                    </Toggle>
                    <ResultCount>{visibleTables.length.toLocaleString()}개</ResultCount>
                  </FilterRow>

                  <Card style={{ padding: 0, overflowX: "auto" }}>
                    {pagedTables.length === 0 ? (
                      <Empty>조건에 맞는 테이블이 없습니다.</Empty>
                    ) : (
                      <DataTable>
                        <thead>
                          <tr>
                            <th>제목</th>
                            <th>참여</th>
                            <th>기간</th>
                            <th>생성일</th>
                            <th>ID</th>
                            <th>관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedTables.map((table) => (
                            <tr key={table.tableId}>
                              <td className="strong">
                                <LinkTitle onClick={() => openDetail(table.tableId)}>
                                  {table.title}
                                </LinkTitle>
                              </td>
                              <td className="num">
                                <Tag
                                  style={
                                    (table.participantCount || 0) === 0
                                      ? { color: t.color.critical, borderColor: `${t.color.critical}40` }
                                      : undefined
                                  }
                                >
                                  {table.participantCount || 0}명
                                </Tag>
                              </td>
                              <td className="num">
                                {table.dates?.length || 0}일 · {table.startHour}~{table.endHour}
                              </td>
                              <td className="mono">{formatDateTime(table.createdAt)}</td>
                              <td className="mono">{table.tableId.slice(0, 8)}</td>
                              <td>
                                <Actions>
                                  <IconButton
                                    $$color={t.color.series1}
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
                                    $$color={t.color.critical}
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

                  {totalPages > 1 && (
                    <Pager>
                      <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                        이전
                      </Button>
                      <span>
                        {page} / {totalPages}
                      </span>
                      <Button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                        다음
                      </Button>
                    </Pager>
                  )}
                </Stack>
              )}

              {/* ------------------------------------------------ 채팅 */}
              {activeTab === "chats" && chatFeed && (
                <Stack>
                  <Notice>
                    익명 서비스라 스팸이나 욕설이 올라와도 알아채기 어렵습니다. 최근 메시지를 최신순으로
                    모아 두었으니 훑어보고 문제가 있으면 해당 테이블을 조치하세요.
                  </Notice>

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

                  <Card style={{ padding: 0 }}>
                    {visibleChats.length === 0 ? (
                      <Empty>메시지가 없습니다.</Empty>
                    ) : (
                      visibleChats.map((message, i) => (
                        <ChatRow key={`${message.tableId}-${i}`}>
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
                </Stack>
              )}
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

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${t.color.bg};
  color: ${t.color.ink};
  font-family: ${t.font.sans};

  @media (max-width: 1023px) {
    flex-direction: column;
  }
`;

const MobileBar = styled.header`
  display: none;

  @media (max-width: 1023px) {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 ${t.space(4)};
    background: ${t.color.surface};
    border-bottom: 1px solid ${t.color.border};
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${t.space(2)};
  font-size: 0.875rem;
  font-weight: 600;
`;

const Scrim = styled.div`
  display: none;

  @media (max-width: 1023px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(11, 11, 11, 0.4);
  }
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 232px;
  background: ${t.color.sidebar};
  color: ${t.color.onDarkMuted};

  @media (max-width: 1023px) {
    position: fixed;
    top: 0;
    bottom: 0;
    left: ${(p) => (p.$open ? "0" : "-232px")};
    z-index: 50;
    transition: left 0.22s ease;
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
    font-size: 0.6875rem;
    color: ${t.color.onDarkMuted};
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: ${t.space(3)};
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NavItem = styled.div`
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
`;

const SidebarFoot = styled.div`
  padding: ${t.space(3)};
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const ExcludedNote = styled.p`
  padding: 0 ${t.space(3)} ${t.space(3)};
  font-size: 0.6875rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.42);
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
  padding: ${t.space(7)} ${t.space(8)} ${t.space(5)};
  border-bottom: 1px solid ${t.color.border};
  background: ${t.color.surface};

  @media (max-width: 640px) {
    padding: ${t.space(5)} ${t.space(4)} ${t.space(4)};
  }
`;

const Content = styled.div`
  flex: 1;
  padding: ${t.space(8)};
  opacity: ${(p) => (p.$dim ? 0.55 : 1)};
  transition: opacity 0.15s ease;

  @media (max-width: 640px) {
    padding: ${t.space(4)};
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.space(6)};
`;

const Notice = styled.p`
  padding: ${t.space(4)};
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

const TotalsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${t.space(4)};
  margin-top: ${t.space(5)};
`;

const Total = styled.div`
  span {
    display: block;
    font-size: 0.6875rem;
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
    color: ${t.color.series1};
    text-decoration: underline;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: ${t.space(2)};
`;

const Pager = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${t.space(4)};
  font-size: 0.8125rem;
  color: ${t.color.ink2};
  font-variant-numeric: tabular-nums;
`;

const ChatRow = styled.div`
  padding: ${t.space(4)} ${t.space(5)};
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

const ChatTable = styled.button`
  border: none;
  background: none;
  padding: 0;
  font-family: inherit;
  font-size: 0.6875rem;
  color: ${t.color.series1};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const ChatTime = styled.span`
  margin-left: auto;
  font-size: 0.6875rem;
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
    font-size: 0.6875rem;
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
