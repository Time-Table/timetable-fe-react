import styled from "@emotion/styled/macro";
import theme from "../../theme";
import InviteSection from "./components/InviteSection";
import DashboardPanel from "./components/DashboardPanel";
import PersonalSchedule from "./components/PersonalSchedule";
import JoinForm from "./components/JoinForm";
import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { useParams } from "react-router-dom";
import { getTableInfo } from "../../api/table";
import { getAllSchedule } from "../../api/user";
import { getSchedule } from "../../api/schedule";
import Loader from "./components/Loading";
import NotFoundTable from "../NotFoundTable";
import Seo from "../../Seo";
import { trackVisit } from "../../api/visit";
import TimeGridModal from "./components/TimeGridModal";
import { AnimatePresence, motion } from "framer-motion";
import { FiUserPlus, FiShare2, FiCalendar, FiGrid, FiUsers, FiChevronRight } from "react-icons/fi";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import GroupTimeGrid from "./components/GroupTimeGrid";
import AdSense from "../../component/AdSense";
import Arrow from "../../assets/svg/Arrow";
import GuideOverlay from "./components/GuideOverlay";

const TOGGLE_TIPS = {
  인원: {
    emoji: "👥",
    description:
      "참여한 멤버들의 일정을 한눈에 확인하세요. 멤버 이름을 클릭하면 해당 멤버만의 가능 시간을 시간표에서 따로 확인할 수 있습니다.",
    tips: [
      {
        title: "멤버 이름을 클릭해보세요",
        desc: "멤버 이름을 클릭하면 해당 멤버의 가능 시간만 시간표에 강조됩니다. 특정 인원의 스케줄을 빠르게 파악할 수 있어요.",
      },
      {
        title: "아직 참여 안 한 분을 초대하세요",
        desc: "상단 '초대' 버튼을 누르면 고유 링크가 복사됩니다. 카카오톡이나 단체 채팅방에 공유해 더 많은 멤버를 초대하세요.",
      },
      {
        title: "참여 인원이 많을수록 정확해요",
        desc: "모든 구성원이 일정을 입력해야 가장 정확한 골든타임을 찾을 수 있습니다. 아직 참여하지 않은 분들에게 독려해보세요.",
      },
    ],
    lastP:
      "모두가 입력을 마치면 '순위' 탭에서 가장 많은 인원이 모일 수 있는 최적의 시간을 바로 확인할 수 있습니다.",
  },
  "내 일정": {
    emoji: "📝",
    description:
      "가능한 시간대를 드래그로 빠르게 선택하세요. PC와 모바일 모두 드래그를 지원합니다.",
    tips: [
      {
        title: "드래그로 한 번에 입력하세요",
        desc: "셀을 드래그하면 여러 시간대를 한꺼번에 선택할 수 있습니다. 하나씩 누를 필요 없이 쭉 밀면 돼요.",
      },
      {
        title: "저장 버튼을 꼭 눌러주세요",
        desc: "시간을 선택한 뒤 반드시 저장 버튼을 눌러야 그룹 시간표에 반영됩니다. 저장 전에 페이지를 떠나면 입력이 사라져요.",
      },
      {
        title: "언제든 수정할 수 있어요",
        desc: "이름과 비밀번호로 다시 로그인하면 기존 일정을 수정하거나 삭제할 수 있습니다. 일정이 바뀌어도 걱정 없어요.",
      },
    ],
    lastP:
      "가능한 시간대를 넉넉하게 선택할수록 그룹 일정 조율이 더 수월해집니다. 애매한 시간도 일단 선택해두는 걸 추천해요.",
  },
  순위: {
    emoji: "🏆",
    description:
      "가장 많은 인원이 모일 수 있는 최적의 시간(골든타임)을 자동으로 계산해 순위별로 보여줍니다.",
    tips: [
      {
        title: "1위가 골든타임이에요",
        desc: "가장 많은 멤버가 참여 가능한 시간대가 상위에 표시됩니다. 1~3위 시간대를 비교해 최적의 약속 시간을 결정하세요.",
      },
      {
        title: "항목을 눌러 참여자를 확인하세요",
        desc: "순위 항목을 클릭하면 해당 시간에 가능한 멤버 목록을 볼 수 있습니다. 누가 되고 안 되는지 한눈에 파악할 수 있어요.",
      },
      {
        title: "모두 입력 후 최종 결정하세요",
        desc: "아직 일정을 입력하지 않은 멤버가 있다면 순위가 바뀔 수 있습니다. 모두가 입력을 마친 뒤 최종 결정을 내리세요.",
      },
    ],
    lastP:
      "순위 화면을 캡처해 단체 채팅방에 공유하면 모두가 한눈에 확인할 수 있어 빠른 의사결정이 가능합니다.",
  },
  default: {
    emoji: "🚀",
    description:
      "이름만 입력하면 바로 참여할 수 있습니다. 회원가입이나 개인정보 입력은 필요 없어요.",
    tips: [
      {
        title: "닉네임만으로 익명 참여",
        desc: "이메일이나 전화번호 없이 이름(닉네임)만으로 참여가 가능합니다. 원하는 이름을 자유롭게 입력해보세요.",
      },
      {
        title: "비밀번호로 내 일정 관리",
        desc: "비밀번호를 설정하면 나중에 다시 로그인해 일정을 수정하거나 삭제할 수 있습니다.",
      },
      {
        title: "참여 후 시간 입력까지 30초",
        desc: "이름 입력 → 시간 드래그 → 저장. 단 3단계로 내 일정 등록이 완료됩니다.",
      },
    ],
    lastP:
      "참여 후 '내 일정' 탭에서 드래그로 가능 시간을 입력하고, '순위' 탭에서 골든타임을 확인해보세요.",
  },
};

export default function TimetablePage() {
  const { tableId } = useParams();
  const [tableInfo, setTableInfo] = useState(null);
  const [usersScheduleList, setUsersScheduleList] = useState([]);
  const { startHour, endHour, dates, title, banedCells } = tableInfo || {};
  const [saveButtonState, setSaveButtonState] = useState(true);
  const [timeInfo, setTimeInfo] = useState([]);
  const [rightScreen, setRightScreen] = useState(() => {
    const storedName =
      localStorage.getItem("tableId") === tableId ? localStorage.getItem("name") : null;
    return storedName ? "PersonalSchedule" : "JoinForm";
  });
  const [selectedToggle, setSelectedToggle] = useState(() => {
    const storedName =
      localStorage.getItem("tableId") === tableId ? localStorage.getItem("name") : null;
    return storedName ? "내 일정" : null;
  });
  const [selectedName, setSelectedName] = useState(null);
  const [name, setName] = useState("");
  const [isValidTableId, setIsValidTableId] = useState(null);
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const hasTrackedVisit = useRef(false);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isTipsOpen, setIsTipsOpen] = useState(() => {
    const saved = localStorage.getItem("isTipsOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("isTipsOpen", JSON.stringify(isTipsOpen));
  }, [isTipsOpen]);

  const fetchAllData = useCallback(async () => {
    const res = await getTableInfo(tableId);
    if (res.status === 404) {
      setIsValidTableId(false);
      return;
    }

    const tableData = res.data || res;
    setTableInfo(tableData);
    setIsValidTableId(true);

    const [membersSchedule, timeData] = await Promise.all([
      getAllSchedule(tableId),
      getSchedule(tableId),
    ]);
    if (membersSchedule.code === 200) {
      setUsersScheduleList(membersSchedule.data);
    }
    setTimeInfo(timeData);
  }, [tableId]);

  // 저장 후 테이블 구조 제외, 일정 데이터만 갱신
  const refreshScheduleData = useCallback(async () => {
    const [membersSchedule, timeData] = await Promise.all([
      getAllSchedule(tableId),
      getSchedule(tableId),
    ]);
    if (membersSchedule.code === 200) {
      setUsersScheduleList(membersSchedule.data);
    }
    setTimeInfo(timeData);
  }, [tableId]);

  useEffect(() => {
    if (!hasTrackedVisit.current) {
      trackVisit("table");
      hasTrackedVisit.current = true;
    }
  }, [tableId]);

  useEffect(() => {
    const storedName = localStorage.getItem("name");
    if (tableId !== localStorage.getItem("tableId")) {
      localStorage.clear();
      localStorage.setItem("tableId", tableId);
    }
    if (storedName) {
      setName(storedName);
    }
    fetchAllData();
  }, [tableId, saveButtonState, fetchAllData]);

  const datesInfo = useCallback(() => {
    if (selectedName) {
      const scheduleOfSelectedName = usersScheduleList.find((user) => user.name === selectedName);
      return scheduleOfSelectedName ? scheduleOfSelectedName.availableTimes : [];
    }
    return [];
  }, [selectedName, usersScheduleList]);

  const handleToggleClick = (screen, toggle) => {
    const storedName = localStorage.getItem("name");

    if (screen === "PersonalSchedule" && !storedName) {
      setRightScreen("JoinForm");
      setSelectedToggle(null);
      return;
    }

    setRightScreen(screen);
    setSelectedToggle(toggle);
    setSelectedName(null);
  };

  const handleUserClickWrapper = (newName, forceOpen = false) => {
    setSelectedName(newName);
    if (!isDesktop && (newName || forceOpen)) {
      setIsGridModalOpen(true);
    }
  };

  const handleCopyInvite = useCallback(() => {
    const url = `${process.env.REACT_APP_DOMAIN_URL}/table/${tableId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [tableId]);

  const renderContent = () => {
    switch (rightScreen) {
      case "JoinForm":
        return (
          <JoinForm
            setRightScreen={setRightScreen}
            setName={setName}
            name={name}
            tableId={tableId}
            setSelectedToggle={setSelectedToggle}
            refreshData={fetchAllData}
          />
        );
      case "InviteSection":
        return <InviteSection tableId={tableId} title={title} />;
      case "DashboardPanel":
        return (
          <DashboardPanel
            setRightScreen={setRightScreen}
            selectedName={selectedName}
            setSelectedName={handleUserClickWrapper}
            usersSchedule={usersScheduleList}
            name={name}
            tableId={tableId}
            onViewTimetable={!isDesktop ? () => setIsGridModalOpen(true) : undefined}
          />
        );
      case "PersonalSchedule":
        return tableInfo ? (
          <PersonalSchedule
            dates={dates}
            startHour={startHour}
            endHour={endHour}
            setRightScreen={setRightScreen}
            tableId={tableId}
            saveButtonState={saveButtonState}
            setSaveButtonState={setSaveButtonState}
            usersScheduleList={usersScheduleList}
            banedCells={banedCells}
            bgTimeInfo={timeInfo}
            onSaveSuccess={refreshScheduleData}
          />
        ) : (
          <Loader />
        );
      default:
        return (
          <DashboardPanel
            usersSchedule={usersScheduleList}
            tableId={tableId}
            setSelectedName={handleUserClickWrapper}
          />
        );
    }
  };

  const HeaderContent = () => {
    const tableUrl = `${process.env.REACT_APP_DOMAIN_URL}/table/${tableId}`;
    return (
      <HeaderSection>
        {dates && dates.length > 0 && dates[0] && dates[0].includes("-") && (
          <DateBadge>
            <FiCalendar />
            <span>
              {`${dates[0].split("-")[1]}.${dates[0].split("-")[2]} - ${
                dates[dates.length - 1].split("-")[1]
              }.${dates[dates.length - 1].split("-")[2]}`}
            </span>
          </DateBadge>
        )}
        <Title>{title}</Title>
        <InviteCard id="guide-invite">
          <InviteCardLabel>
            <FiShare2 size={12} />
            초대 링크
          </InviteCardLabel>
          <InviteRow>
            <InviteUrl>{tableUrl}</InviteUrl>
            <CopyBtn $copied={isCopied} onClick={handleCopyInvite}>
              {isCopied ? "✓ 복사됨" : "복사하기"}
            </CopyBtn>
          </InviteRow>
        </InviteCard>
      </HeaderSection>
    );
  };

  const StepBar = () => {
    const hasMySchedule = !!usersScheduleList.find((u) => u.name === name && u.availableTimes?.length > 0);
    const steps = [
      {
        id: "join",
        label: "참여",
        icon: <FiUserPlus size={16} />,
        done: !!name,
        active: rightScreen === "JoinForm" || !name,
        disabled: false,
        onClick: () => {
          setRightScreen("JoinForm");
          setSelectedToggle(null);
        },
      },
      {
        id: "schedule",
        label: "내 일정",
        icon: <FiCalendar size={16} />,
        done: hasMySchedule,
        active: selectedToggle === "내 일정",
        disabled: !name,
        onClick: () => handleToggleClick("PersonalSchedule", "내 일정"),
      },
      {
        id: "members",
        label: usersScheduleList.length > 0 ? `인원 (${usersScheduleList.length})` : "인원",
        icon: <FiUsers size={16} />,
        done: false,
        active: selectedToggle === "인원",
        disabled: false,
        onClick: () => handleToggleClick("DashboardPanel", "인원"),
      },
    ];
    return (
      <>
        <StepBarWrapper>
          {steps.map((step, i) => (
            <Fragment key={step.id}>
              <StepItemWrapper
                onClick={!step.disabled ? step.onClick : undefined}
                $disabled={step.disabled}
              >
                <StepCircle
                  $done={step.done && !step.active}
                  $active={step.active}
                  $disabled={step.disabled}
                >
                  <StepIcon>{step.icon}</StepIcon>
                </StepCircle>
                <StepLabel
                  $active={step.active}
                  $done={step.done && !step.active}
                  $disabled={step.disabled}
                >
                  {step.label}
                </StepLabel>
              </StepItemWrapper>
              {i < steps.length - 1 && <StepLine $filled={step.done} />}
            </Fragment>
          ))}
        </StepBarWrapper>
      </>
    );
  };

  if (isValidTableId === null) {
    return (
      <LoaderLayout>
        <Loader />
        <h1>테이블 정보를 불러오는 중입니다...</h1>
        <p>연결 상태에 따라 시간이 걸릴 수 있습니다.</p>
      </LoaderLayout>
    );
  }

  return isValidTableId ? (
    <PageWrapper>
      <GuideOverlay isDesktop={isDesktop} />
      <Seo
        title={`${title || "테이블"}`}
        description="팀 일정 조율이 더 쉬워집니다. 최적의 시간을 선택해 보세요."
        url={`${process.env.REACT_APP_DOMAIN_URL}/table/${tableId}`}
      />

      {isDesktop ? (
        <DesktopContainer>
          <LeftPanel id="guide-all-timetable">
            {tableInfo && (
              <GroupTimeGrid
                banedCells={banedCells}
                title={title}
                dates={dates}
                startHour={startHour}
                endHour={endHour}
                timeInfo={selectedName ? datesInfo() : timeInfo}
                selectedName={selectedName}
                setSelectedName={setSelectedName}
                setTableInfo={setTableInfo}
                tableId={tableId}
                usersSchedule={usersScheduleList}
              />
            )}
          </LeftPanel>
          <RightPanel>
            <HeaderContent />
            <StepBar />
            <ContentPanel>
              <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            </ContentPanel>
            <AdSense
              slot="7512892307"
              layout="in-article"
              format="fluid"
              isReady={!!tableInfo && usersScheduleList.length >= 2}
            />
          </RightPanel>
        </DesktopContainer>
      ) : (
        <>
          <MainContent>
            <HeaderContent />
            <StepBar />
            <ContentPanel>
              <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            </ContentPanel>
            <AdSense
              slot="7512892307"
              layout="in-article"
              format="fluid"
              isReady={!!tableInfo && usersScheduleList.length >= 2}
            />
          </MainContent>
          <IconFab
            id="guide-view-timetable"
            $disabled={usersScheduleList.length === 0}
            onClick={() => usersScheduleList.length > 0 && setIsGridModalOpen(true)}
          >
            <FiGrid size={22} />
          </IconFab>
        </>
      )}

      <TableFooterSection>
        {(() => {
          const tips = TOGGLE_TIPS[selectedToggle] || TOGGLE_TIPS.default;
          return (
            <>
              <div className="accordion-header" onClick={() => setIsTipsOpen(!isTipsOpen)}>
                <h3>{tips.emoji} 모임 시간 조율을 위한 팁</h3>
                <motion.div animate={{ rotate: isTipsOpen ? 180 : 0 }}>
                  <Arrow width={16} height={16} angle={90} />
                </motion.div>
              </div>
              <AnimatePresence>
                {isTipsOpen && (
                  <motion.div
                    key={selectedToggle}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="accordion-content">
                      <p>{tips.description}</p>
                      <div className="tip-grid">
                        {tips.tips.map((tip, i) => (
                          <div key={i} className="tip-item">
                            <h4>{tip.title}</h4>
                            <p>{tip.desc}</p>
                          </div>
                        ))}
                      </div>
                      <p className="last-p">{tips.lastP}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          );
        })()}
      </TableFooterSection>

      {tableInfo && !isDesktop && (
        <TimeGridModal
          $isOpen={isGridModalOpen}
          onClose={() => setIsGridModalOpen(false)}
          banedCells={banedCells}
          title={title}
          dates={dates}
          startHour={startHour}
          endHour={endHour}
          timeInfo={selectedName ? datesInfo() : timeInfo}
          selectedName={selectedName}
          setSelectedName={setSelectedName}
          setTableInfo={setTableInfo}
          tableId={tableId}
          usersSchedule={usersScheduleList}
        />
      )}
    </PageWrapper>
  ) : (
    <NotFoundTable />
  );
}

const TableFooterSection = styled.section`
  margin: 50px auto 0;
  max-width: 800px;
  width: 100%;
  padding: 0;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  text-align: left;
  font-family: "Pretendard-Regular";
  overflow: hidden;

  .accordion-header {
    padding: 24px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;

    @media (max-width: 480px) {
      padding: 20px;
    }

    &:hover {
      background-color: ${theme.text.gamma[950]};
    }

    h3 {
      font-family: "Pretendard-Bold";
      font-size: 22px;
      margin: 0;
      color: ${theme.color.primary};
      @media (max-width: 480px) {
        font-size: 18px;
      }
    }
  }

  .accordion-content {
    padding: 0 30px 30px;
    @media (max-width: 480px) {
      padding: 0 20px 24px;
    }
  }

  p {
    font-size: 15px;
    line-height: 1.6;
    color: ${theme.text.gamma[500]};
    margin-bottom: 25px;
    @media (max-width: 480px) {
      font-size: 14px;
    }
  }

  .tip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
    gap: 20px;
    margin-bottom: 30px;
    width: 100%;
    box-sizing: border-box;
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  .tip-item {
    padding: 20px;
    background-color: ${theme.text.gamma[950]};
    border-radius: 12px;
    min-width: 0; /* Grid overflow 방지 핵심 */
    width: 100%;
    box-sizing: border-box;
    word-break: keep-all;
    overflow-wrap: break-word;

    h4 {
      font-family: "Pretendard-Bold";
      font-size: 16px;
      margin-bottom: 10px;
      color: black;
      line-height: 1.4;
    }

    p {
      font-size: 14px;
      margin-bottom: 0;
      line-height: 1.6;
    }
  }

  .last-p {
    font-size: 13px;
    opacity: 0.8;
    margin-top: 20px;
    border-top: 1px solid ${theme.text.gamma[900]};
    padding-top: 20px;
  }
`;

const PageWrapper = styled.div`
  width: 100%;
  padding: 40px 24px 80px;
  box-sizing: border-box;
  background-color: #f8f9fa;
  min-height: calc(100vh - 72px); // Header height
  @media (max-width: 480px) {
    padding: 24px 16px 60px;
  }
`;

const MainContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const DesktopContainer = styled.div`
  display: flex;
  gap: 40px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  align-items: flex-start;
  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: center;
  }
`;

const LeftPanel = styled.div`
  flex: 1.4;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 24px;
  width: 100%;
  box-sizing: border-box;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 450px;
  flex-shrink: 0;
`;

const DateBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: ${theme.color.primary}12;
  color: ${theme.color.primary};
  padding: 6px 14px;
  border-radius: 99px;
  font-family: "Pretendard-Bold";
  font-size: 13px;
  margin-bottom: 8px;
`;

const HeaderSection = styled.header`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h1`
  font-family: "Pretendard-Bold";
  font-size: 36px;
  color: ${theme.text.gamma[100]};
  margin: 0;
  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const StepBarWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  background: white;
  border-radius: 14px;
  padding: 16px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const StepItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  flex: 0 0 auto;
  min-width: 64px;
  opacity: ${(p) => (p.$disabled ? 0.4 : 1)};
  transition: opacity 0.2s ease;

  &:hover {
    opacity: ${(p) => (p.$disabled ? 0.4 : 0.75)};
  }
`;


const StepCircle = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.25s ease,
    border-color 0.25s ease;

  ${(p) =>
    p.$active &&
    `
    background: linear-gradient(135deg, ${theme.color.primaryTint}, ${theme.color.primary});
    color: white;
    box-shadow: 0 4px 12px ${theme.color.primary}40;
  `}
  ${(p) =>
    p.$done &&
    !p.$active &&
    `
    background: white;
    color: ${theme.color.primary};
    border: 2.5px solid ${theme.color.primary};
    box-shadow: 0 0 0 3px ${theme.color.primary}18;
  `}
  ${(p) =>
    !p.$done &&
    !p.$active &&
    `
    background: ${theme.text.gamma[900]};
    color: ${theme.text.gamma[600]};
    border: 2px solid ${theme.text.gamma[700]};
  `}
`;

const StepIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StepLabel = styled.span`
  font-family: "Pretendard-SemiBold";
  font-size: 12px;
  white-space: nowrap;
  transition: color 0.2s;

  ${(p) => p.$active && `color: ${theme.color.primary};`}
  ${(p) => p.$done && !p.$active && `color: ${theme.color.primary};`}
  ${(p) => !p.$done && !p.$active && !p.$disabled && `color: ${theme.text.gamma[500]};`}
  ${(p) => p.$disabled && `color: ${theme.text.gamma[600]};`}
`;

const StepLine = styled.div`
  flex: 1;
  height: 2px;
  margin-top: 17px;
  border-radius: 2px;
  transition: background 0.3s ease;
  background: ${(p) =>
    p.$filled
      ? `linear-gradient(90deg, ${theme.color.primary}, ${theme.color.primaryTint})`
      : theme.text.gamma[900]};
`;

const InviteCard = styled.div`
  width: 100%;
  background: ${theme.color.primary}08;
  border: 1.5px solid ${theme.color.primary}22;
  border-radius: 14px;
  padding: 12px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: ${theme.color.primary}44;
  }
`;

const InviteCardLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: "Pretendard-SemiBold";
  font-size: 12px;
  color: ${theme.color.primary};
`;

const InviteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 38px;
  padding: 0 12px;
  background: white;
  border: 1px solid ${theme.color.primary}20;
  border-radius: 9px;
  box-sizing: border-box;
`;

const InviteUrl = styled.span`
  flex: 1;
  font-family: "Pretendard-Regular";
  font-size: 12px;
  color: ${theme.text.gamma[500]};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
`;

const CopyBtn = styled.button`
  flex-shrink: 0;
  height: 28px;
  padding: 0 14px;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  font-family: "Pretendard-Bold";
  font-size: 12px;
  transition: all 0.2s ease;

  ${(p) =>
    p.$copied
      ? `
    background: #dcfce7;
    color: #16a34a;
  `
      : `
    background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
    color: white;
    box-shadow: 0 2px 8px ${theme.color.primary}30;
    &:hover { opacity: 0.9; transform: translateY(-1px); }
  `}
`;

const ScheduleNudge = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 11px 16px;
  background: ${theme.color.button.blue}0f;
  border: 1px solid ${theme.color.button.blue}30;
  border-radius: 10px;
  color: ${theme.color.button.blue};
  font-family: "Pretendard-Medium";
  font-size: 14px;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s ease;

  span {
    flex: 1;
    text-align: left;
  }

  &:hover {
    background: ${theme.color.button.blue}18;
    border-color: ${theme.color.button.blue}60;
  }
`;

const ViewAllTimetableButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 52px;
  border-radius: 14px;
  font-family: "Pretendard-Bold";
  font-size: 16px;
  letter-spacing: -0.3px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${(props) =>
    props.$disabled
      ? `
      background: ${theme.text.gamma[900]};
      color: ${theme.text.gamma[600]};
      cursor: not-allowed;
      pointer-events: none;
    `
      : `
      background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
      color: white;
      box-shadow: 0 4px 16px ${theme.color.primary}35;

      &:hover {
        filter: brightness(1.06);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px ${theme.color.primary}45;
      }

      &:active {
        transform: translateY(0);
      }
    `}
`;

const IconFab = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  transition: all 0.2s ease;

  ${(p) =>
    p.$disabled
      ? `
    background: ${theme.text.gamma[900]};
    color: ${theme.text.gamma[600]};
    cursor: not-allowed;
    pointer-events: none;
  `
      : `
    background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
    color: white;
    box-shadow: 0 6px 20px ${theme.color.primary}40;
    &:hover { transform: scale(1.1); box-shadow: 0 8px 28px ${theme.color.primary}55; }
    &:active { transform: scale(0.93); }
  `}

  @media (max-width: 480px) {
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
  }
`;

const ContentPanel = styled.main`
  width: 100%;
`;

const LoaderLayout = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 150px);
  text-align: center;

  h1 {
    font-family: "Pretendard-Bold";
    font-size: 24px;
  }
  p {
    font-family: "Pretendard-Regular";
    font-size: 16px;
    color: ${theme.text.gamma[600]};
  }
`;
