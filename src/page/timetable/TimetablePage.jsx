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
import { AnimatePresence } from "framer-motion";
import { FiUserPlus, FiShare2, FiCalendar } from "react-icons/fi";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import GroupTimeGrid from "./components/GroupTimeGrid";

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

  const fetchAllData = useCallback(async () => {
    const tableData = await getTableInfo(tableId);
    if (tableData.status === 404) {
      setIsValidTableId(false);
      return;
    }
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
      {dates && dates.length > 0 && (
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
          onClick={() => {
            setRightScreen("JoinForm");
            setSelectedToggle(null);
          }}
        >
          <FiUserPlus />
          <span>빠른 참여</span>
        </PrimaryActionButton>
        <SecondaryActionButton
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
      <Seo
        title={`${title || "테이블"}`}
        description="팀 일정 조율이 더 쉬워집니다. 최적의 시간을 선택해 보세요."
        url={`${process.env.REACT_APP_DOMAIN_URL}/table/${tableId}`}
      />

      {isDesktop ? (
        <DesktopContainer>
          <LeftPanel>
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
          </RightPanel>
        </DesktopContainer>
      ) : (
        <MainContent>
          <HeaderContent />
          <ToggleButtons />
          <ContentPanel>
            <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
          </ContentPanel>
          <FloatingButton onClick={() => setIsGridModalOpen(true)} selectedName={selectedName} />
        </MainContent>
      )}
      {tableInfo && !isDesktop && (
        <TimeGridModal
          isOpen={isGridModalOpen}
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

const PageWrapper = styled.div`
  width: 100%;
  padding: 40px 24px 80px;
  box-sizing: border-box;
  background-color: #f8f9fa;
  min-height: calc(100vh - 72px); // Header height
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
`;

const SecondaryActionButton = styled(CustomActionButton)`
  background: ${theme.color.button.blue};
  color: white;
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
