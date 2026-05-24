import styled from "@emotion/styled/macro";
import theme from "../../theme";
import Button from "../../component/Button";
import InviteSection from "./components/InviteSection";
import DashboardPanel from "./components/DashboardPanel";
import PersonalSchedule from "./components/PersonalSchedule";
import JoinForm from "./components/JoinForm";
import RankingList from "./components/RankingList";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { getTableInfo } from "../../api/table";
import { getAllSchedule } from "../../api/user";
import { getSchedule } from "../../api/schedule";
import Loader from "./components/Loading";
import NotFoundTable from "../NotFoundTable";
import Seo from "../../Seo";
import { trackVisit } from "../../api/visit";
import FloatingButton from "./components/FloatingButton";
import TimeGridModal from "./components/TimeGridModal";
import { AnimatePresence, motion } from "framer-motion";
import { FiUserPlus, FiShare2, FiCalendar, FiGrid } from "react-icons/fi";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import GroupTimeGrid from "./components/GroupTimeGrid";
import AdSense from "../../component/AdSense";
import Arrow from "../../assets/svg/Arrow";
import GuideOverlay from "./components/GuideOverlay";

const TOGGLE_TIPS = {
  인원: {
    emoji: "👥",
    description: "참여한 멤버들의 일정을 한눈에 확인하세요. 멤버 이름을 클릭하면 해당 멤버만의 가능 시간을 시간표에서 따로 확인할 수 있습니다.",
    tips: [
      { title: "멤버 이름을 클릭해보세요", desc: "멤버 이름을 클릭하면 해당 멤버의 가능 시간만 시간표에 강조됩니다. 특정 인원의 스케줄을 빠르게 파악할 수 있어요." },
      { title: "아직 참여 안 한 분을 초대하세요", desc: "상단 '초대' 버튼을 누르면 고유 링크가 복사됩니다. 카카오톡이나 단체 채팅방에 공유해 더 많은 멤버를 초대하세요." },
      { title: "참여 인원이 많을수록 정확해요", desc: "모든 구성원이 일정을 입력해야 가장 정확한 골든타임을 찾을 수 있습니다. 아직 참여하지 않은 분들에게 독려해보세요." },
    ],
    lastP: "모두가 입력을 마치면 '순위' 탭에서 가장 많은 인원이 모일 수 있는 최적의 시간을 바로 확인할 수 있습니다.",
  },
  "내 일정": {
    emoji: "📝",
    description: "가능한 시간대를 드래그로 빠르게 선택하세요. PC와 모바일 모두 드래그를 지원합니다.",
    tips: [
      { title: "드래그로 한 번에 입력하세요", desc: "셀을 드래그하면 여러 시간대를 한꺼번에 선택할 수 있습니다. 하나씩 누를 필요 없이 쭉 밀면 돼요." },
      { title: "저장 버튼을 꼭 눌러주세요", desc: "시간을 선택한 뒤 반드시 저장 버튼을 눌러야 그룹 시간표에 반영됩니다. 저장 전에 페이지를 떠나면 입력이 사라져요." },
      { title: "언제든 수정할 수 있어요", desc: "이름과 비밀번호로 다시 로그인하면 기존 일정을 수정하거나 삭제할 수 있습니다. 일정이 바뀌어도 걱정 없어요." },
    ],
    lastP: "가능한 시간대를 넉넉하게 선택할수록 그룹 일정 조율이 더 수월해집니다. 애매한 시간도 일단 선택해두는 걸 추천해요.",
  },
  순위: {
    emoji: "🏆",
    description: "가장 많은 인원이 모일 수 있는 최적의 시간(골든타임)을 자동으로 계산해 순위별로 보여줍니다.",
    tips: [
      { title: "1위가 골든타임이에요", desc: "가장 많은 멤버가 참여 가능한 시간대가 상위에 표시됩니다. 1~3위 시간대를 비교해 최적의 약속 시간을 결정하세요." },
      { title: "항목을 눌러 참여자를 확인하세요", desc: "순위 항목을 클릭하면 해당 시간에 가능한 멤버 목록을 볼 수 있습니다. 누가 되고 안 되는지 한눈에 파악할 수 있어요." },
      { title: "모두 입력 후 최종 결정하세요", desc: "아직 일정을 입력하지 않은 멤버가 있다면 순위가 바뀔 수 있습니다. 모두가 입력을 마친 뒤 최종 결정을 내리세요." },
    ],
    lastP: "순위 화면을 캡처해 단체 채팅방에 공유하면 모두가 한눈에 확인할 수 있어 빠른 의사결정이 가능합니다.",
  },
  default: {
    emoji: "🚀",
    description: "이름만 입력하면 바로 참여할 수 있습니다. 회원가입이나 개인정보 입력은 필요 없어요.",
    tips: [
      { title: "닉네임만으로 익명 참여", desc: "이메일이나 전화번호 없이 이름(닉네임)만으로 참여가 가능합니다. 원하는 이름을 자유롭게 입력해보세요." },
      { title: "비밀번호로 내 일정 관리", desc: "비밀번호를 설정하면 나중에 다시 로그인해 일정을 수정하거나 삭제할 수 있습니다." },
      { title: "참여 후 시간 입력까지 30초", desc: "이름 입력 → 시간 드래그 → 저장. 단 3단계로 내 일정 등록이 완료됩니다." },
    ],
    lastP: "참여 후 '내 일정' 탭에서 드래그로 가능 시간을 입력하고, '순위' 탭에서 골든타임을 확인해보세요.",
  },
};

export default function TimetablePage() {
  const { tableId } = useParams();
  const [tableInfo, setTableInfo] = useState(null);
  const [usersScheduleList, setUsersScheduleList] = useState([]);
  const { startHour, endHour, dates, title, banedCells } = tableInfo || {};
  const [saveButtonState, setSaveButtonState] = useState(true);
  const [timeInfo, setTimeInfo] = useState([]);
  const [rightScreen, setRightScreen] = useState("DashboardPanel");
  const [selectedToggle, setSelectedToggle] = useState("인원");
  const [selectedName, setSelectedName] = useState(null);
  const [name, setName] = useState("");
  const [isValidTableId, setIsValidTableId] = useState(null);
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);

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

    const membersSchedule = await getAllSchedule(tableId);
    if (membersSchedule.code === 200) {
      setUsersScheduleList(membersSchedule.data);
    }
    const timeData = await getSchedule(tableId);
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
          />
        ) : (
          <Loader />
        );
      case "RankingList":
        return (
          <RankingList
            setRightScreen={setRightScreen}
            timeInfo={timeInfo}
            selectedName={selectedName}
            setSelectedName={handleUserClickWrapper}
            usersCount={usersScheduleList.length}
          />
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

  const HeaderContent = () => (
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
      <Description>
        일정을 등록하고 링크를 공유해
        <br />
        친구를 초대해보세요.
      </Description>
      <ActionButtons>
        <PrimaryActionButton
          id="guide-quick-join"
          $highlight={!name}
          onClick={() => {
            setRightScreen("JoinForm");
            setSelectedToggle(null);
          }}
        >
          <FiUserPlus />
          <span>빠른 참여</span>
        </PrimaryActionButton>
        <SecondaryActionButton
          id="guide-invite"
          onClick={() => {
            setRightScreen("InviteSection");
            setSelectedToggle(null);
          }}
        >
          <FiShare2 />
          <span>초대</span>
        </SecondaryActionButton>
      </ActionButtons>
    </HeaderSection>
  );

  const ToggleButtons = () => (
    <>
      <ToggleBar>
        <Button
          title={`인원 (${usersScheduleList.length})`}
          variant="text"
          onClick={() => handleToggleClick("DashboardPanel", "인원")}
          className={selectedToggle === "인원" ? "active" : ""}
        />
        <Button
          title="내 일정"
          variant="text"
          onClick={() => handleToggleClick("PersonalSchedule", "내 일정")}
          className={selectedToggle === "내 일정" ? "active" : ""}
        />
        <Button
          title="순위"
          variant="text"
          onClick={() => handleToggleClick("RankingList", "순위")}
          className={selectedToggle === "순위" ? "active" : ""}
        />
      </ToggleBar>
      {!isDesktop && (
        <ViewAllTimetableButton
          $disabled={usersScheduleList.length === 0}
          onClick={() => usersScheduleList.length > 0 && setIsGridModalOpen(true)}
        >
          <FiGrid size={16} />
          전체 시간표 보기
        </ViewAllTimetableButton>
      )}
    </>
  );

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
            <ToggleButtons />
            <ContentPanel>
              <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            </ContentPanel>
            <AdSense slot="7512892307" layout="in-article" format="fluid" isReady={!!tableInfo && usersScheduleList.length >= 2} />
          </RightPanel>
        </DesktopContainer>
      ) : (
        <MainContent>
          <HeaderContent />
          <ToggleButtons />
          <ContentPanel>
            <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
          </ContentPanel>
          <AdSense slot="7512892307" layout="in-article" format="fluid" isReady={!!tableInfo && usersScheduleList.length >= 2} />
          <FloatingButton onClick={() => setIsGridModalOpen(true)} selectedName={selectedName} />
        </MainContent>
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

const Description = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 18px;
  color: ${theme.text.gamma[500]};
  margin: 0;
  text-align: center;
  line-height: 1.6;
  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 20px;
`;

const CustomActionButton = styled.button`
  font-family: "Pretendard-SemiBold";
  height: 52px;
  padding: 0 28px;
  border-radius: 12px;
  font-size: 17px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
`;

const PrimaryActionButton = styled(CustomActionButton)`
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
  color: white;

  ${props => props.$highlight && `
    animation: pulseHighlight 1.4s ease-in-out infinite;
    position: relative;
  `}

  @keyframes pulseHighlight {
    0% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 0px ${theme.color.primary}70;
      transform: scale(1);
    }
    50% {
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18), 0 0 0 10px ${theme.color.primary}00;
      transform: scale(1.04);
    }
    100% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 0px ${theme.color.primary}00;
      transform: scale(1);
    }
  }
`;

const SecondaryActionButton = styled(CustomActionButton)`
  background: ${theme.color.button.blue};
  color: white;
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
  border: 2px solid;

  ${props => props.$disabled
    ? `
      background: ${theme.text.gamma[900]};
      border-color: ${theme.text.gamma[800]};
      color: ${theme.text.gamma[600]};
      cursor: not-allowed;
      pointer-events: none;
    `
    : `
      background: linear-gradient(135deg, ${theme.color.primary}18, ${theme.color.primaryTint}28);
      border-color: ${theme.color.primary}60;
      color: ${theme.color.primary};
      box-shadow: 0 4px 14px ${theme.color.primary}20;

      &:hover {
        background: linear-gradient(135deg, ${theme.color.primary}28, ${theme.color.primaryTint}40);
        border-color: ${theme.color.primary};
        transform: translateY(-2px);
        box-shadow: 0 8px 24px ${theme.color.primary}35;
      }

      &:active {
        transform: translateY(0);
      }
    `
  }
`;

const ToggleBar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  button {
    flex: 1;
    font-size: 16px;
    height: 42px;
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
