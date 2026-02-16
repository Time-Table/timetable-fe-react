import theme from "../../../theme";
import styled from "@emotion/styled/macro";
import TimeGrid from "../../../component/TimeGrid";
import { getTableInfo } from "../../../api/table";
import Swal from "sweetalert2";
import { LuRefreshCw } from "react-icons/lu";
import { IoPeople, IoArrowBackCircle } from "react-icons/io5";
import { keyframes } from "@emotion/react";
import { useState } from "react";

export default function GroupTimeGrid({
  banedCells,
  title,
  dates,
  startHour,
  endHour,
  timeInfo,
  selectedName,
  setSelectedName,
  setTableInfo,
  tableId,
  usersSchedule,
}) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  const [isRotating, setIsRotating] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const handleClick = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 1000);
  };

  return (
    <Frame>
      <TitleFrame>
        <TitleDiv>{title}</TitleDiv>
        <TitleDiv color={theme.color.primary}>타임테이블</TitleDiv>
      </TitleFrame>

      <NoteHeader>
        <NoteText>{selectedName ? `${selectedName} 님의` : "전체"} 시간표</NoteText>
        <ButtonBox
          className={isRotating ? "rotating" : ""}
          onClick={async () => {
            handleClick();
            const res = await getTableInfo(tableId);
            if (res._id) {
              setSelectedName(null);
              setTableInfo(res);
            } else {
              await Toast.fire({
                icon: "error",
                iconColor: `${theme.color.primary}`,
                title: "데이터를 가져오는 중 오류 발생",
              });
            }
          }}
        >
          <LuRefreshCw size={22} color={theme.text.gamma[600]} />
        </ButtonBox>
      </NoteHeader>

      <DropdownContainer>
        <DropdownButton onClick={() => setDropdownOpen(!isDropdownOpen)}>
          <span>{selectedName || "전체 참여자"}</span>
          <IoPeople size={16} />
        </DropdownButton>
        {isDropdownOpen && (
          <DropdownContent>
            <DropdownItem
              $isSelected={selectedName === null}
              onClick={() => {
                setSelectedName(null);
                setDropdownOpen(false);
              }}
            >
              전체 참여자
            </DropdownItem>
            {usersSchedule.map((user, index) => (
              <DropdownItem
                key={index}
                $isSelected={selectedName === user.name}
                onClick={() => {
                  setSelectedName(user.name);
                  setDropdownOpen(false);
                }}
              >
                {user.name}
              </DropdownItem>
            ))}
          </DropdownContent>
        )}
      </DropdownContainer>

      <TimeGrid
        dates={dates}
        startHour={startHour}
        endHour={endHour}
        readOnly={true}
        timeInfo={timeInfo}
        banedCells={banedCells}
      />

      {selectedName && (
        <BackButton onClick={() => setSelectedName(null)}>
          <IoArrowBackCircle size={44} />
        </BackButton>
      )}
    </Frame>
  );
}

const Frame = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  position: relative;
`;

const TitleFrame = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
  gap: 4px;
`;

const TitleDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
  font-size: 28px;
  color: ${(props) => props.color || theme.text.gamma[200]};
  @media (max-width: 480px) {
    font-size: 22px;
  }
`;

const NoteHeader = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  position: relative;
`;

const NoteText = styled.span`
  font-family: Pretendard-Medium;
  text-align: center;
  font-size: 22px;
  color: ${theme.text.gamma[400]};
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
`;

const ButtonBox = styled.button`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  ${theme.styles.flexCenterRow}
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 50%;

  &:hover {
    background-color: ${theme.text.gamma[900]};
  }

  &.rotating {
    animation: ${rotate} 0.7s linear;
  }
`;

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: -10px;
`;

const DropdownButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background-color: ${theme.text.gamma[950]};
  border: 1px solid ${theme.text.gamma[900]};
  color: ${theme.text.gamma[500]};
  font-family: "Pretendard-Medium";
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    background-color: ${theme.color.primary}15;
    color: ${theme.color.primary};
    border-color: ${theme.color.primary}30;
  }
`;

const DropdownContent = styled.div`
  position: absolute;
  width: 100%;
  background-color: ${theme.text.gamma[900]};
  border: 1px solid #ddd;
  border-radius: 8px;
  z-index: 10;
  margin-top: 4px;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  box-sizing: border-box;
`;

const DropdownItem = styled("div", {
  shouldForwardProp: (prop) => prop !== "$isSelected",
})`
  padding: 8px 16px;
  cursor: pointer;
  font-family: "Pretendard-Medium";
  font-size: 14px;
  border-radius: 999px;
  background-color: ${({ $isSelected }) => ($isSelected ? theme.color.primary : "white")};
  border: 1px solid
    ${({ $isSelected }) => ($isSelected ? theme.color.primary : theme.text.gamma[800])};
  color: ${({ $isSelected }) => ($isSelected ? "white" : theme.text.gamma[400])};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ $isSelected }) =>
      $isSelected ? theme.color.primary : `${theme.color.primary}15`};
    color: ${({ $isSelected }) => ($isSelected ? "white" : theme.color.primary)};
    border-color: ${({ $isSelected }) =>
      $isSelected ? theme.color.primary : `${theme.color.primary}30`};
  }
`;

const BackButton = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: ${theme.color.primary};
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;
