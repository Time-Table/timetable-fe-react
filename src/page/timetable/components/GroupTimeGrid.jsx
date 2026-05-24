import theme from "../../../theme";
import styled from "@emotion/styled/macro";
import TimeGrid from "../../../component/TimeGrid";
import { getTableInfo } from "../../../api/table";
import Swal from "sweetalert2";
import { LuRefreshCw } from "react-icons/lu";
import { IoPeople, IoArrowBackCircle } from "react-icons/io5";
import { FiX } from "react-icons/fi";
import { keyframes } from "@emotion/react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const parseTimeKey = (timeKey) => {
  const idx = timeKey.lastIndexOf("-");
  const dateStr = timeKey.slice(0, idx);
  const timeStart = timeKey.slice(idx + 1);
  const [h, m] = timeStart.split(":").map(Number);
  const endMin = h * 60 + m + 30;
  const endH = Math.floor(endMin / 60) % 24;
  const endM = endMin % 60;
  const timeEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  const dateFormatted = new Date(dateStr + "T00:00:00Z").toLocaleDateString("ko-KR", {
    month: "long", day: "numeric", weekday: "short", timeZone: "UTC",
  });
  return { dateStr, timeStart, timeEnd, dateFormatted };
};

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
  const [selectedCell, setSelectedCell] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const popupRef = useRef(null);
  const POPUP_WIDTH = 260;
  const POPUP_H_ESTIMATE = 250;

  const handleCellClick = (viewInfo, event) => {
    if (!viewInfo) { setSelectedCell(null); return; }
    if (selectedCell?._id === viewInfo._id) { setSelectedCell(null); return; }

    if (event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      let left = rect.right + 8;
      if (left + POPUP_WIDTH > winW - 8) {
        left = rect.left - POPUP_WIDTH - 8;
      }
      left = Math.max(8, Math.min(left, winW - POPUP_WIDTH - 8));

      let top = rect.top;
      top = Math.max(8, Math.min(top, winH - POPUP_H_ESTIMATE - 8));

      setPopupPos({ top, left });
    }
    setSelectedCell(viewInfo);
  };

  useEffect(() => {
    if (!selectedCell || !popupRef.current) return;
    const el = popupRef.current;
    const { height, width } = el.getBoundingClientRect();
    const winH = window.innerHeight;
    const winW = window.innerWidth;

    setPopupPos(prev => {
      let { top, left } = prev;
      if (top + height > winH - 8) top = Math.max(8, winH - height - 8);
      if (top < 8) top = 8;
      if (left + width > winW - 8) left = Math.max(8, winW - width - 8);
      if (left < 8) left = 8;
      if (top === prev.top && left === prev.left) return prev;
      return { top, left };
    });
  }, [selectedCell]);

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
            const tableData = res?.data || res;
            if (tableData?._id) {
              setSelectedName(null);
              setTableInfo(tableData);
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
        onCellClick={handleCellClick}
        selectedCellKey={selectedCell?.time}
      />

      {selectedCell && createPortal(
        <AnimatePresence>
          {(() => {
            const { timeStart, timeEnd, dateFormatted } = parseTimeKey(selectedCell.time);
            const canAttend = selectedCell.members || [];
            const cannotAttend = usersSchedule
              .map((u) => u.name)
              .filter((name) => !canAttend.includes(name));
            const maxCount = Array.isArray(timeInfo)
              ? Math.max(...timeInfo.map((t) => t.count || 0), 0)
              : 0;
            const isGolden = selectedCell.count === maxCount && maxCount > 0;
            return (
              <CellInfoPopup
                key={selectedCell._id}
                ref={popupRef}
                style={{ top: popupPos.top, left: popupPos.left }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {isGolden && <GoldenBadge>최다 인원</GoldenBadge>}
                <CellInfoHeader>
                  <CellTime>{dateFormatted} · {timeStart} ~ {timeEnd}</CellTime>
                  <CloseBtn onClick={() => setSelectedCell(null)}><FiX size={15} /></CloseBtn>
                </CellInfoHeader>
                <CellInfoSection>
                  <CellInfoLabel $type="can">참여 가능 {canAttend.length}명</CellInfoLabel>
                  <NameChips>
                    {canAttend.length > 0
                      ? canAttend.map((name) => <NameChip key={name} $type="can">{name}</NameChip>)
                      : <NoName>없음</NoName>}
                  </NameChips>
                </CellInfoSection>
                <CellInfoSection>
                  <CellInfoLabel $type="cannot">참여 불가 {cannotAttend.length}명</CellInfoLabel>
                  <NameChips>
                    {cannotAttend.length > 0
                      ? cannotAttend.map((name) => <NameChip key={name} $type="cannot">{name}</NameChip>)
                      : <NoName>없음</NoName>}
                  </NameChips>
                </CellInfoSection>
              </CellInfoPopup>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}

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

const CellInfoPopup = styled(motion.div)`
  position: fixed;
  width: 260px;
  z-index: 9999;
  background: white;
  border: 1px solid ${theme.text.gamma[900]};
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
  transform-origin: left center;
`;

const GoldenBadge = styled.div`
  background: linear-gradient(90deg, ${theme.color.primaryTint}, ${theme.color.primary});
  color: white;
  font-family: "Pretendard-Bold";
  font-size: 12px;
  text-align: center;
  padding: 5px 0;
  letter-spacing: 0.5px;
`;

const CellInfoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${theme.color.primary}08;
  border-bottom: 1px solid ${theme.text.gamma[900]};
`;

const CellTime = styled.span`
  font-family: "Pretendard-Bold";
  font-size: 14px;
  color: ${theme.color.primary};
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${theme.text.gamma[500]};
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 50%;
  &:hover { background: ${theme.text.gamma[900]}; }
`;

const CellInfoSection = styled.div`
  padding: 12px 16px;
  & + & { border-top: 1px solid ${theme.text.gamma[900]}; }
`;

const CellInfoLabel = styled.div`
  font-family: "Pretendard-Bold";
  font-size: 12px;
  margin-bottom: 8px;
  color: ${(props) => props.$type === "can" ? "#16a34a" : theme.text.gamma[500]};
`;

const NameChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const NameChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 99px;
  font-family: "Pretendard-Medium";
  font-size: 13px;
  ${(props) => props.$type === "can"
    ? `background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0;`
    : `background: ${theme.text.gamma[950]}; color: ${theme.text.gamma[500]}; border: 1px solid ${theme.text.gamma[900]};`
  }
`;

const NoName = styled.span`
  font-family: "Pretendard-Regular";
  font-size: 13px;
  color: ${theme.text.gamma[800]};
`;
