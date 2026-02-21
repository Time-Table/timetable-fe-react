import { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import theme from "../../theme";
import Seo from "../../Seo";
import Button from "../../component/Button.jsx";
import Calendar from "../../component/Calendar.jsx";
import TimeGrid from "../../component/TimeGrid";
import Arrow from "../../assets/svg/Arrow";
import { createTable } from "../../api/table";
import { trackVisit } from "../../api/visit";
import Swal from "sweetalert2";
import { FaLock } from "react-icons/fa";
import { BsLightningChargeFill } from "react-icons/bs";

export default function QuickCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [selectedDates, setSelectedDates] = useState([]);
  const [startHour, setStartHour] = useState("09:00");
  const [endHour, setEndHour] = useState("22:00");
  const [isLoading, setIsLoading] = useState(false);
  const [banedCells, setBanedCells] = useState([]);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isStartDropdownOpen, setStartDropdownOpen] = useState(false);
  const [isEndDropdownOpen, setEndDropdownOpen] = useState(false);
  const startDropdownRef = useRef(null);
  const endDropdownRef = useRef(null);

  const isStep1Done = selectedDates.length > 0;
  const isStep3Done = title.trim() !== "";
  const isPrerequisitesMet = isStep1Done && isStep3Done;
  const hasTrackedVisit = useRef(false);

  useEffect(() => {
    const getVisitLog = async () => {
      if (!hasTrackedVisit.current) {
        await trackVisit("create");
        hasTrackedVisit.current = true;
      }
    };
    getVisitLog();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (startDropdownRef.current && !startDropdownRef.current.contains(event.target))
        setStartDropdownOpen(false);
      if (endDropdownRef.current && !endDropdownRef.current.contains(event.target))
        setEndDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateTable = async () => {
    if (!isPrerequisitesMet) {
      Swal.fire("입력 오류", "날짜와 모임 이름을 먼저 입력해주세요.", "error");
      return;
    }
    setIsLoading(true);
    const res = await createTable(title, selectedDates, startHour, endHour, banedCells);
    setIsLoading(false);
    if (res.isRateLimit) return;
    if (res.success) {
      localStorage.setItem("title", title);
      const newTableId = res.data.tableId;
      const url = `${window.location.origin}/table/${newTableId}`;
      Swal.fire({
        icon: "success",
        title: "생성 완료!",
        html: `친구나 팀원에게 링크를 공유하세요!<br><br><b>${url}</b>`,
        confirmButtonText: "링크 복사",
        showCancelButton: true,
        cancelButtonText: "확인",
        preConfirm: () => {
          navigator.clipboard.writeText(url);
          Swal.showValidationMessage("링크가 복사되었습니다!");
        },
      }).then((result) => {
        if (!result.isConfirmed) {
          navigate(`/table/${newTableId}`);
        }
      });
    } else {
      Swal.fire("생성 실패", res.message || "테이블 생성 중 오류가 발생했습니다.", "error");
    }
  };

  const generateTimes = (start = 0, end = 24) => {
    const times = [];
    for (let h = start; h < end; h++) {
      times.push(`${String(h).padStart(2, "0")}:00`);
    }
    return times;
  };

  return (
    <>
      <Seo title="타임테이블 - 빠른 생성" description="빠르게 약속을 만들어보세요." />
      <PageWrapper>
        <Header>
          <ArrowLayout onClick={() => navigate("/create")}>
            <Arrow width={10} height={20} angle={180} />
          </ArrowLayout>
          <TitleContainer>
            <BsLightningChargeFill />
            <PageTitle>빠른 테이블 생성</PageTitle>
          </TitleContainer>
          <div style={{ width: "44px" }} />
        </Header>
        <Content>
          <StepCard>
            <StepTitle>1. 날짜 선택</StepTitle>
            <StepDescription>약속 후보 날짜를 모두 선택해주세요.</StepDescription>
            <Calendar selectedDates={selectedDates} setSelectedDates={setSelectedDates} />
          </StepCard>

          <StepCard $isOpen={isStartDropdownOpen || isEndDropdownOpen}>
            <StepTitle>2. 시간 범위 설정</StepTitle>
            <StepDescription>가능한 시간 범위를 설정해주세요.</StepDescription>
            <TimeSelection>
              <DropdownContainer ref={startDropdownRef}>
                <CustomSelectButton onClick={() => setStartDropdownOpen(!isStartDropdownOpen)}>
                  <span>{startHour}</span> <DropdownArrow $isOpen={isStartDropdownOpen} />
                </CustomSelectButton>
                {isStartDropdownOpen && (
                  <TimeDropdown>
                    {generateTimes(0, 24).map((time) => (
                      <TimeOption
                        key={`start-${time}`}
                        $isSelected={time === startHour}
                        onClick={() => {
                          setStartHour(time);
                          if (time >= endHour) {
                            const nextH = parseInt(time.split(":")[0]) + 1;
                            setEndHour(`${String(nextH).padStart(2, "0")}:00`);
                          }
                          setStartDropdownOpen(false);
                        }}
                      >
                        {time}
                      </TimeOption>
                    ))}
                  </TimeDropdown>
                )}
              </DropdownContainer>
              <TimeSeparator>부터</TimeSeparator>
              <DropdownContainer ref={endDropdownRef}>
                <CustomSelectButton onClick={() => setEndDropdownOpen(!isEndDropdownOpen)}>
                  <span>{endHour}</span> <DropdownArrow $isOpen={isEndDropdownOpen} />
                </CustomSelectButton>
                {isEndDropdownOpen && (
                  <TimeDropdown>
                    {generateTimes(1, 25).map((time) => (
                      <TimeOption
                        key={`end-${time}`}
                        $isSelected={time === endHour}
                        onClick={() => {
                          setEndHour(time);
                          if (time <= startHour) {
                            const prevH = parseInt(time.split(":")[0]) - 1;
                            setStartHour(`${String(prevH).padStart(2, "0")}:00`);
                          }
                          setEndDropdownOpen(false);
                        }}
                      >
                        {time}
                      </TimeOption>
                    ))}
                  </TimeDropdown>
                )}
              </DropdownContainer>
              <TimeSeparator>까지</TimeSeparator>
            </TimeSelection>
          </StepCard>

          <StepCard>
            <StepTitle>3. 모임 이름</StepTitle>
            <StepDescription>다른 멤버들이 알아보기 쉬운 이름으로 지어주세요.</StepDescription>
            <CustomInput
              type="text"
              placeholder="예: 캡스톤 디자인 3조 회의"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={25}
            />
          </StepCard>

          <StepCard>
            <AccordionHeader
              onClick={isPrerequisitesMet ? () => setIsAccordionOpen(!isAccordionOpen) : undefined}
              $disabled={!isPrerequisitesMet}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <StepTitle style={{ color: theme.text.gamma[500] }}>
                  (선택)시간 잠금 <FaLock size={15} style={{ marginLeft: "4px" }} />
                </StepTitle>
                <StepDescription>선택하신 시간대는 아무도 선택할 수 없습니다.</StepDescription>
              </div>
              <AccordionIcon
                style={{ transform: isAccordionOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <Arrow width={12} height={12} angle={90} />
              </AccordionIcon>
            </AccordionHeader>
            {!isPrerequisitesMet && (
              <LockMessage>
                <FaLock size={12} />
                <span>이전 단계를 먼저 완료해주세요.</span>
              </LockMessage>
            )}
            {isAccordionOpen && isPrerequisitesMet && (
              <TimeGridWrapper style={{ marginTop: "2rem" }}>
                <TimeGrid
                  dates={selectedDates}
                  startHour={startHour}
                  endHour={endHour}
                  selectedCells={banedCells}
                  setSelectedCells={setBanedCells}
                  selectedCellColor={theme.text.gamma[800]}
                />
              </TimeGridWrapper>
            )}
          </StepCard>

          <div style={{ marginTop: "25px" }}>
            <Button
              title={isLoading ? "생성 중..." : "생성하기"}
              onClick={handleCreateTable}
              disabled={isLoading || !isPrerequisitesMet}
              height="56px"
              fontSize="18px"
              background={`linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary})`}
              StyleButton={{
                transition: "filter 0.2s ease-in-out",
                filter: isLoading || !isPrerequisitesMet ? "brightness(0.7)" : "brightness(1)",
              }}
              StyleDiv={{ marginTop: "50px" }}
            />
          </div>
        </Content>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px 60px;
  box-sizing: border-box;
  background-color: ${theme.text.gamma[950]};
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 20px;
  background-color: ${theme.text.gamma[950]};
`;
const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${theme.color.primary};
`;
const PageTitle = styled.h1`
  font-family: "Pretendard-Bold";
  font-size: 26px;
  color: ${theme.color.primary};
`;
const ArrowLayout = styled.div`
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const Content = styled.div`
  display: flex;
  flex-direction: column;
`;
const StepCard = styled("div", {
  shouldForwardProp: (prop) => prop !== "$isOpen",
})`
  position: relative;
  z-index: ${(props) => (props.$isOpen ? 2 : 1)};
  background: white;
  border: 1px solid ${theme.text.gamma[900]};
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.07);
  & + & {
    margin-top: 25px;
  }
  @media (max-width: 480px) {
    padding: 1.5rem;
  }
`;
const AccordionHeader = styled("div", {
  shouldForwardProp: (prop) => prop !== "$disabled",
})`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  color: ${(props) => (props.$disabled ? theme.text.gamma[700] : "inherit")};
  & > div > * {
    color: ${(props) => (props.$disabled ? theme.text.gamma[700] : "inherit")} !important;
  }
  & > div > h2 {
    color: ${(props) => (props.$disabled ? theme.text.gamma[700] : theme.color.primary)} !important;
  }
`;
const CustomInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  font-family: "Pretendard-Regular";
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: 10px;
  background-color: ${theme.text.gamma[950]};
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: ${theme.color.primary};
  }
`;
const StepTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Pretendard-Bold";
  font-size: 22px;
  margin: 0 0 8px 0;
  color: ${theme.color.primary};
  @media (max-width: 480px) {
    font-size: 20px;
  }
`;
const StepDescription = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 15px;
  color: ${theme.text.gamma[500]};
  margin: 0;
  margin-bottom: 12px;
`;
const AccordionIcon = styled.div`
  transition: transform 0.3s ease;
`;
const TimeGridWrapper = styled.div`
  overflow: hidden;
`;
const LockMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${theme.text.gamma[600]};
  margin-top: 1rem;
  padding: 10px 12px;
  background-color: ${theme.text.gamma[900]};
  border-radius: 8px;
`;
const TimeSelection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
`;
const TimeSeparator = styled.span`
  font-family: "Pretendard-Regular";
  color: ${theme.text.gamma[400]};
  font-size: 16px;
  flex-shrink: 0;
`;
const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
`;
const CustomSelectButton = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  font-family: "Pretendard-SemiBold";
  color: ${theme.text.gamma[100]};
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: 10px;
  background-color: white;
  cursor: pointer;
`;
const DropdownArrow = styled("div", {
  shouldForwardProp: (prop) => prop !== "$isOpen",
})`
  width: 8px;
  height: 8px;
  border-left: 2px solid ${theme.text.gamma[500]};
  border-bottom: 2px solid ${theme.text.gamma[500]};
  transform: ${(props) => (props.$isOpen ? "rotate(135deg)" : "rotate(-45deg)")};
`;
const TimeDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: 10px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  z-index: 100;
  padding: 8px;
  box-sizing: border-box;
`;
const TimeOption = styled("div", {
  shouldForwardProp: (prop) => prop !== "$isSelected",
})`
  padding: 12px 16px;
  font-size: 16px;
  font-family: "Pretendard-Medium";
  border-radius: 8px;
  cursor: pointer;
  color: ${(props) => (props.$isSelected ? theme.color.primary : "inherit")};
  background-color: ${(props) => (props.$isSelected ? `${theme.color.primary}15` : "transparent")};
  &:hover {
    background-color: ${theme.color.primary}1A;
  }
`;
