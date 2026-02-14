import { useEffect, useState, useCallback, useRef } from "react";
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiLayers,
  FiUsers,
  FiBarChart2,
  FiExternalLink,
  FiCalendar,
  FiTrendingUp,
  FiEdit3,
  FiTrash2,
  FiX,
  FiPieChart,
  FiLock,
} from "react-icons/fi";
import { getTrackVisit } from "../api/visit";
import { getAllTables, updateTable, deleteTable } from "../api/table";
import Swal from "sweetalert2";

const ManagerPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [visitData, setVisitData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);

  // 초기 상태에서 즉시 로컬스토리지 확인 (딜레이 방지)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("admin_auth") === "verified";
  });
  const isChecking = useRef(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

  // 관리자 인증 로직
  const checkAuth = useCallback(async () => {
    // 이미 인증된 상태라면 실행하지 않음
    if (isAuthenticated || isChecking.current) return;

    isChecking.current = true;
    const { value: password, isDismissed } = await Swal.fire({
      title: "관리자 인증",
      input: "password",
      inputLabel: "비밀번호를 입력하세요 (기본: 관리자 생일)",
      inputPlaceholder: "Password",
      allowOutsideClick: false,
      showCancelButton: true,
      cancelButtonText: "홈으로 이동",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
      },
    });

    isChecking.current = false;

    if (isDismissed) {
      navigate("/");
      return;
    }

    if (password === "0222") {
      localStorage.setItem("admin_auth", "verified");
      setIsAuthenticated(true);
      Toast.fire({ icon: "success", title: "관리자 인증 성공" });
    } else {
      await Swal.fire("인증 실패", "비밀번호가 틀렸습니다.", "error");
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [trackVisitRes, tablesRes] = await Promise.all([getTrackVisit(), getAllTables()]);

      if (trackVisitRes?.data && Array.isArray(trackVisitRes.data)) {
        const sortedVisits = [...trackVisitRes.data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setVisitData(sortedVisits);
        const today = new Date().toISOString().split("T")[0];
        setSelectedDate(
          sortedVisits.find((v) => v.date === today) ? today : sortedVisits[0]?.date || "",
        );
      }

      const tables = Array.isArray(tablesRes)
        ? tablesRes
        : tablesRes?.success
          ? tablesRes.data
          : [];
      setTableData(tables);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  // 통계 계산 로직 (최적화)
  const getPeriodStats = (days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = visitData.filter((v) => new Date(v.date) >= cutoff);
    return {
      visits: filtered.reduce(
        (acc, curr) =>
          acc +
          (curr.todayVisitLandingPage || 0) +
          (curr.todayVisitCreatePage || 0) +
          (curr.todayVisitUsePage || 0) +
          (curr.todayVisitAboutPage || 0),
        0,
      ),
      tables: filtered.reduce((acc, curr) => acc + (curr.todayTableCreateCount || 0), 0),
      signUps: filtered.reduce((acc, curr) => acc + (curr.todaySignUp || 0), 0),
    };
  };

  const currentDayStats = selectedDate ? visitData.find((e) => e.date === selectedDate) || {} : {};

  // 수정 핸들러
  const handleEditClick = (table) => {
    setEditingTable({ ...table });
    setIsEditModalOpen(true);
  };

  if (!isAuthenticated) return null;

  return (
    <PageContainer>
      <Sidebar>
        <Logo>
          <FiLock /> <span>Admin Console</span>
        </Logo>
        <Menu>
          <MenuItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>
            <FiGrid /> 대시보드
          </MenuItem>
          <MenuItem active={activeTab === "tables"} onClick={() => setActiveTab("tables")}>
            <FiLayers /> 테이블 관리
          </MenuItem>
          <MenuItem active={activeTab === "stats"} onClick={() => setActiveTab("stats")}>
            <FiPieChart /> 상세 분석
          </MenuItem>
        </Menu>
        <SidebarFooter
          onClick={() => {
            localStorage.removeItem("admin_auth");
            window.location.reload();
          }}
        >
          로그아웃
        </SidebarFooter>
      </Sidebar>

      <MainContent>
        <TopBar>
          <FiCalendar />
          <span>
            {activeTab === "dashboard"
              ? "Dashboard Overview"
              : activeTab === "tables"
                ? "Table Management"
                : "Analytics Insight"}
          </span>
        </TopBar>

        {loading ? (
          <LoadingWrapper>
            <Spinner />
            <p>데이터를 분석 중입니다...</p>
          </LoadingWrapper>
        ) : (
          <ContentArea>
            {activeTab === "dashboard" && (
              <Section>
                <SectionTitle>Periodical Trends</SectionTitle>
                <PeriodGrid>
                  {[
                    { label: "최근 7일", data: getPeriodStats(7), color: "#4e73df" },
                    { label: "최근 30일", data: getPeriodStats(30), color: "#1cc88a" },
                    { label: "최근 1년", data: getPeriodStats(365), color: "#36b9cc" },
                  ].map((p) => (
                    <PeriodCard key={p.label} color={p.color}>
                      <PeriodLabel>{p.label}</PeriodLabel>
                      <PeriodStat>
                        <span>방문</span> <strong>{p.data.visits.toLocaleString()}</strong>
                      </PeriodStat>
                      <PeriodStat>
                        <span>생성</span> <strong>{p.data.tables.toLocaleString()}</strong>
                      </PeriodStat>
                      <PeriodStat>
                        <span>가입</span> <strong>{p.data.signUps.toLocaleString()}</strong>
                      </PeriodStat>
                    </PeriodCard>
                  ))}
                </PeriodGrid>

                <SectionTitle>Daily Performance ({selectedDate})</SectionTitle>
                <StatsGrid>
                  <StatCard
                    color="#4e73df"
                    icon={<FiUsers />}
                    label="신규 가입"
                    value={currentDayStats.todaySignUp}
                  />
                  <StatCard
                    color="#1cc88a"
                    icon={<FiLayers />}
                    label="테이블 생성"
                    value={currentDayStats.todayTableCreateCount}
                  />
                  <StatCard
                    color="#36b9cc"
                    icon={<FiBarChart2 />}
                    label="전체 데이터"
                    value={tableData.length}
                  />
                  <StatCard
                    color="#f6c23e"
                    icon={<FiTrendingUp />}
                    label="누적 가입"
                    value={currentDayStats.totalSignUp}
                  />
                </StatsGrid>

                <DetailGrid>
                  <DetailCard>
                    <CardHeader>Traffic Distribution</CardHeader>
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      {[
                        { key: "todayVisitLandingPage", label: "Landing (메인)", color: "#4e73df" },
                        { key: "todayVisitCreatePage", label: "Create (생성)", color: "#6610f2" },
                        { key: "todayVisitUsePage", label: "Table (이용)", color: "#1cc88a" },
                        { key: "todayVisitAboutPage", label: "About (소개)", color: "#36b9cc" },
                      ].map((item) => {
                        const val = currentDayStats[item.key] || 0;
                        const total =
                          (currentDayStats.todayVisitLandingPage || 0) +
                          (currentDayStats.todayVisitCreatePage || 0) +
                          (currentDayStats.todayVisitUsePage || 0) +
                          (currentDayStats.todayVisitAboutPage || 0);
                        const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                        return (
                          <div key={item.key}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "12px",
                                marginBottom: "6px",
                              }}
                            >
                              <span style={{ color: "#5a5c69" }}>{item.label}</span>
                              <span style={{ fontWeight: "bold" }}>
                                {val}명 ({percent}%)
                              </span>
                            </div>
                            <ProgressContainer>
                              <ProgressBar width={percent} color={item.color} />
                            </ProgressContainer>
                          </div>
                        );
                      })}
                    </div>
                  </DetailCard>
                  <DetailCard>
                    <CardHeader>Historical Lookup</CardHeader>
                    <DateSelect
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    >
                      {visitData.map((entry) => (
                        <option key={entry.date} value={entry.date}>
                          {entry.date}
                        </option>
                      ))}
                    </DateSelect>
                    <InfoBox>
                      날짜를 선택하면 해당 시점의 상세 지표와 방문 비중이 업데이트됩니다.
                    </InfoBox>
                  </DetailCard>
                </DetailGrid>
              </Section>
            )}

            {activeTab === "tables" && (
              <Section>
                <SectionTitle>Table Management ({tableData.length})</SectionTitle>
                <TableContainer>
                  <StyledTable>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Specs</th>
                        <th>Created At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((table) => (
                        <tr key={table.tableId}>
                          <td className="mono">{table.tableId.substring(0, 8)}</td>
                          <td className="bold">{table.title}</td>
                          <td>
                            <Tag>{table.dates?.length} Days</Tag>
                            <Tag>
                              {table.startHour}-{table.endHour}
                            </Tag>
                          </td>
                          <td>{new Date(table.createdAt).toLocaleDateString()}</td>
                          <td>
                            <ActionGroup>
                              <ActionBtn color="#4e73df" onClick={() => handleEditClick(table)}>
                                <FiEdit3 />
                              </ActionBtn>
                              <ActionBtn
                                color="#e74a3b"
                                onClick={() => {
                                  Swal.fire({
                                    title: "삭제하시겠습니까?",
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonText: "삭제",
                                    confirmButtonColor: "#e74a3b",
                                  }).then(async (res) => {
                                    if (res.isConfirmed) {
                                      const dRes = await deleteTable(table.tableId);
                                      if (dRes?.success) {
                                        Toast.fire({ icon: "success", title: "삭제 완료" });
                                        setTableData((prev) =>
                                          prev.filter((t) => t.tableId !== table.tableId),
                                        );
                                      }
                                    }
                                  });
                                }}
                              >
                                <FiTrash2 />
                              </ActionBtn>
                              <ActionBtn
                                color="#36b9cc"
                                as="a"
                                href={`/table/${table.tableId}`}
                                target="_blank"
                              >
                                <FiExternalLink />
                              </ActionBtn>
                            </ActionGroup>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </StyledTable>
                </TableContainer>
              </Section>
            )}

            {activeTab === "stats" && (
              <Section>
                <SectionTitle>Advanced Analytics</SectionTitle>
                <DetailGrid>
                  <DetailCard>
                    <CardHeader>Day-of-Week Popularity</CardHeader>
                    <ChartContainer>
                      {(() => {
                        const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
                        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
                        tableData.forEach((t) =>
                          t.dates?.forEach((d) => {
                            const day = new Date(d).getDay();
                            if (!isNaN(day)) dayCounts[day]++;
                          }),
                        );
                        const max = Math.max(...dayCounts, 1);
                        return dayCounts.map((count, i) => (
                          <BarWrapper key={i}>
                            <BarCount>{count}</BarCount>
                            <Bar height={(count / max) * 100} />
                            <BarLabel>{dayLabels[i]}</BarLabel>
                          </BarWrapper>
                        ));
                      })()}
                    </ChartContainer>
                  </DetailCard>
                  <DetailCard>
                    <CardHeader>User Behavior Insights</CardHeader>
                    <DetailRow>
                      <span>평균 후보 날짜</span>
                      <strong>
                        {(
                          tableData.reduce((acc, curr) => acc + (curr.dates?.length || 0), 0) /
                          (tableData.length || 1)
                        ).toFixed(1)}
                        개
                      </strong>
                    </DetailRow>
                    <DetailRow>
                      <span>주말 포함 비중</span>
                      <strong>
                        {(
                          (tableData.filter((t) =>
                            t.dates?.some((d) => [0, 6].includes(new Date(d).getDay())),
                          ).length /
                            (tableData.length || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </strong>
                    </DetailRow>
                    <InsightBox>
                      가장 인기 있는 요일은{" "}
                      <strong>
                        {
                          ["일", "월", "화", "수", "목", "금", "토"][
                            (() => {
                              const dayCounts = [0, 0, 0, 0, 0, 0, 0];
                              tableData.forEach((t) =>
                                t.dates?.forEach((d) => {
                                  const day = new Date(d).getDay();
                                  if (!isNaN(day)) dayCounts[day]++;
                                }),
                              );
                              return dayCounts.indexOf(Math.max(...dayCounts));
                            })()
                          ]
                        }
                        요일
                      </strong>
                      입니다.
                    </InsightBox>
                  </DetailCard>
                </DetailGrid>
              </Section>
            )}
          </ContentArea>
        )}
      </MainContent>

      {/* Edit Modal (간략화) */}
      {isEditModalOpen && editingTable && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <h3>Edit Table</h3>
              <FiX onClick={() => setIsEditModalOpen(false)} style={{ cursor: "pointer" }} />
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <label>Title</label>
                <input
                  value={editingTable.title}
                  onChange={(e) => setEditingTable({ ...editingTable, title: e.target.value })}
                />
              </FormGroup>
              <div style={{ display: "flex", gap: "15px" }}>
                <FormGroup style={{ flex: 1 }}>
                  <label>Start</label>
                  <input
                    value={editingTable.startHour}
                    onChange={(e) =>
                      setEditingTable({ ...editingTable, startHour: e.target.value })
                    }
                  />
                </FormGroup>
                <FormGroup style={{ flex: 1 }}>
                  <label>End</label>
                  <input
                    value={editingTable.endHour}
                    onChange={(e) => setEditingTable({ ...editingTable, endHour: e.target.value })}
                  />
                </FormGroup>
              </div>
            </ModalBody>
            <ModalFooter>
              <button className="cancel" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button
                className="save"
                onClick={async () => {
                  const res = await updateTable(editingTable.tableId, editingTable);
                  if (res?.success) {
                    Toast.fire({ icon: "success", title: "Update Success" });
                    setIsEditModalOpen(false);
                    fetchData();
                  }
                }}
              >
                Save Changes
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

// Reusable StatCard Component
const StatCard = ({ color, icon, label, value }) => (
  <StatCardWrapper border={color}>
    <div className="icon">{icon}</div>
    <div className="data">
      <div className="label" style={{ color }}>
        {label}
      </div>
      <div className="value">{value?.toLocaleString() || 0}</div>
    </div>
  </StatCardWrapper>
);

// Styled Components (Polished)
const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #f8f9fc;
  color: #5a5c69;
  overflow: hidden;
`;
const Sidebar = styled.aside`
  width: 240px;
  background: #4e73df;
  background-image: linear-gradient(180deg, #4e73df 10%, #224abe 100%);
  color: white;
  display: flex;
  flex-direction: column;
  z-index: 100;
`;
const Logo = styled.div`
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 800;
  font-size: 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;
const Menu = styled.nav`
  flex: 1;
  padding: 20px 0;
`;
const MenuItem = styled.div`
  padding: 15px 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  transition: 0.2s;
  background: ${(props) => (props.active ? "rgba(255,255,255,0.1)" : "transparent")};
  border-left: 4px solid ${(props) => (props.active ? "white" : "transparent")};
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;
const SidebarFooter = styled.div`
  padding: 20px;
  font-size: 0.75rem;
  text-align: center;
  opacity: 0.6;
  cursor: pointer;
  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
`;
const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
const TopBar = styled.header`
  height: 70px;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 30px;
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
  font-weight: 700;
  gap: 10px;
  font-size: 1rem;
`;
const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 30px;
`;
const Section = styled.div`
  margin-bottom: 40px;
`;
const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: #5a5c69;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
`;
const StatCardWrapper = styled.div`
  background: white;
  border-radius: 0.35rem;
  padding: 20px;
  border-left: 0.25rem solid ${(props) => props.border};
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
  display: flex;
  align-items: center;
  gap: 15px;
  .icon {
    font-size: 2rem;
    color: #dddfeb;
  }
  .label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0.2rem;
  }
  .value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #5a5c69;
  }
`;
const PeriodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;
const PeriodCard = styled.div`
  background: ${(props) => props.color};
  border-radius: 12px;
  padding: 25px;
  color: white;
  box-shadow: 0 4px 15px ${(props) => props.color}40;
`;
const PeriodLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 800;
  opacity: 0.8;
  margin-bottom: 15px;
`;
const PeriodStat = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  span {
    opacity: 0.7;
    font-size: 0.75rem;
  }
  strong {
    font-weight: 700;
  }
`;
const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
`;
const DetailCard = styled.div`
  background: white;
  border-radius: 0.35rem;
  padding: 25px;
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
`;
const CardHeader = styled.h3`
  font-size: 0.9rem;
  font-weight: 700;
  color: #4e73df;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e3e6f0;
`;
const ProgressContainer = styled.div`
  width: 100%;
  height: 8px;
  background: #eaecf4;
  border-radius: 10px;
  overflow: hidden;
`;
const ProgressBar = styled.div`
  width: ${(props) => props.width}%;
  height: 100%;
  background: ${(props) => props.color};
  transition: 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
`;
const DateSelect = styled.select`
  width: 100%;
  padding: 12px;
  border-radius: 5px;
  border: 1px solid #d1d3e2;
  background: white;
  font-family: inherit;
`;
const InfoBox = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fc;
  border-radius: 5px;
  font-size: 0.8rem;
  color: #858796;
  line-height: 1.5;
`;
const TableContainer = styled.div`
  background: white;
  border-radius: 0.35rem;
  overflow: hidden;
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
`;
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid #e3e6f0;
  }
  th {
    background: #f8f9fc;
    font-size: 0.75rem;
    color: #4e73df;
    font-weight: 700;
    text-transform: uppercase;
  }
  td {
    font-size: 0.85rem;
  }
  .mono {
    font-family: monospace;
    color: #b7b9cc;
  }
  .bold {
    font-weight: 700;
    color: #5a5c69;
  }
  tr:hover {
    background: #f8f9fc;
  }
`;
const Tag = styled.span`
  background: #f8f9fc;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  margin-right: 5px;
  border: 1px solid #e3e6f0;
`;
const ActionGroup = styled.div`
  display: flex;
  gap: 8px;
`;
const ActionBtn = styled.button`
  background: white;
  border: 1px solid #e3e6f0;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  color: ${(props) => props.color};
  display: flex;
  align-items: center;
  transition: 0.2s;
  &:hover {
    background: ${(props) => props.color};
    color: white;
    border-color: ${(props) => props.color};
  }
`;
const ChartContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 15px;
  height: 180px;
  padding: 30px 0 10px;
  border-bottom: 1px solid #f1f1f1;
`;
const BarWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;
const Bar = styled.div`
  width: 100%;
  height: ${(props) => props.height}%;
  background: #4e73df;
  border-radius: 4px 4px 0 0;
  transition: height 1s;
  min-height: 4px;
`;
const BarCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: #4e73df;
`;
const BarLabel = styled.span`
  font-size: 0.75rem;
  color: #858796;
`;
const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid #f8f9fc;
  font-size: 0.85rem;
  strong {
    color: #5a5c69;
  }
`;
const InsightBox = styled.div`
  margin-top: 30px;
  padding: 20px;
  background: #4e73df10;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #5a5c69;
  border-left: 4px solid #4e73df;
`;
const LoadingWrapper = styled.div`
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: #858796;
`;
const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4e73df;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background: white;
  width: 450px;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;
const ModalHeader = styled.div`
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 {
    font-size: 1rem;
    color: #4e73df;
  }
`;
const ModalBody = styled.div`
  padding: 25px;
`;
const ModalFooter = styled.div`
  padding: 20px 25px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  button {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 700;
    cursor: pointer;
    border: none;
  }
  .cancel {
    background: #f8f9fc;
    color: #858796;
  }
  .save {
    background: #4e73df;
    color: white;
  }
`;
const FormGroup = styled.div`
  margin-bottom: 15px;
  label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    margin-bottom: 6px;
  }
  input {
    width: 100%;
    padding: 12px;
    border: 1px solid #d1d3e2;
    border-radius: 6px;
    box-sizing: border-box;
  }
`;

export default ManagerPage;
