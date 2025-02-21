import React, { useState, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Arrow from "../assets/svg/Arrow";

export default function Calendar({ selectedDates, setSelectedDates }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState(null); // "add" 또는 "remove"
  const [pointerStartPos, setPointerStartPos] = useState(null);
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 11);

  // 드래그 종료 및 상태 초기화 함수 (window 이벤트에서도 사용)
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragAction(null);
    setPointerStartPos(null);
  }, []);

  useEffect(() => {
    // window 레벨에서 pointerup, pointercancel 이벤트를 등록하여 드래그 상태를 리셋
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerUp]);

  const month = () => {
    const monthLabel = currentDate.toLocaleDateString("ko-KR", {
      month: "long",
      year: "numeric",
    });

    const prevMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonthDisabled =
      currentDate.getMonth() <= new Date().getMonth() &&
      currentDate.getFullYear() === new Date().getFullYear();
    const nextMonthDisabled = currentDate >= maxDate;

    return (
      <MonthLayout>
        <ArrowLayout disabled={prevMonthDisabled} onClick={prevMonthDisabled ? null : prevMonth}>
          <Arrow
            width={10}
            height={20}
            color={prevMonthDisabled ? theme.text.gamma[800] : "black"}
            angle={180}
          />
        </ArrowLayout>
        <Month>{monthLabel}</Month>
        <ArrowLayout disabled={nextMonthDisabled} onClick={nextMonthDisabled ? null : nextMonth}>
          <Arrow
            width={10}
            height={20}
            color={nextMonthDisabled ? theme.text.gamma[800] : "black"}
          />
        </ArrowLayout>
      </MonthLayout>
    );
  };

  const week = () => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return (
      <DaysRow>
        {days.map((day, index) => (
          <Day key={index}>{day}</Day>
        ))}
      </DaysRow>
    );
  };

  // 개별 셀에서 pointer down 시 드래그 시작 및 해당 날짜 토글
  const handlePointerDown = (e, day) => {
    e.preventDefault();
    setIsDragging(true);
    setPointerStartPos({ x: e.clientX, y: e.clientY });
    const isAlreadySelected = selectedDates.includes(day);
    setDragAction(isAlreadySelected ? "remove" : "add");
    if (isAlreadySelected) {
      setSelectedDates((prev) => prev.filter((date) => date !== day));
    } else {
      setSelectedDates((prev) => [...prev, day]);
    }
  };

  // wrapper에서 pointer move 이벤트를 통해 현재 포인터 아래의 셀을 찾아 업데이트
  const handlePointerMove = (e, day) => {
    if (!isDragging || !pointerStartPos) return;
    const dx = Math.abs(e.clientX - pointerStartPos.x);
    const dy = Math.abs(e.clientY - pointerStartPos.y);
    if (dx > 5 || dy > 5) {
      if (dragAction === "add") {
        setSelectedDates((prev) => (prev.includes(day) ? prev : [...prev, day]));
      } else if (dragAction === "remove") {
        setSelectedDates((prev) => prev.filter((date) => date !== day));
      }
    }
  };

  // 캘린더 wrapper에 pointer move 이벤트를 부착하여, 현재 포인터 아래의 셀을 감지
  const handleWrapperPointerMove = (e) => {
    if (!isDragging) return;
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element) {
      const cell = element.closest("[data-date]");
      if (cell) {
        const day = cell.getAttribute("data-date");
        if (day) {
          handlePointerMove(e, day);
        }
      }
    }
  };

  const cells = () => {
    const today = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = new Date(monthStart);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const rows = [];
    let days = [];

    while (startDate <= monthEnd || days.length % 7 !== 0) {
      for (let i = 0; i < 7; i++) {
        const dateString = startDate.toDateString();
        const isPastDate = startDate < today && startDate.toDateString() !== today.toDateString();
        const isSelected = selectedDates.includes(dateString);
        const disabledClass =
          startDate.getMonth() !== currentDate.getMonth() || isPastDate ? "disabled" : "";

        days.push(
          <Cell
            data-date={dateString}
            className={disabledClass}
            key={dateString}
            isSelected={isSelected}
            onPointerDown={(e) => (!isPastDate ? handlePointerDown(e, dateString) : null)}
          >
            <span>{startDate.getDate()}</span>
          </Cell>
        );
        startDate.setDate(startDate.getDate() + 1);
      }
      rows.push(<Row key={startDate.toDateString()}>{days}</Row>);
      days = [];
    }
    return <Body>{rows}</Body>;
  };

  return (
    <CalendarWrapper
      onPointerMove={handleWrapperPointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      {month()}
      {week()}
      {cells()}
    </CalendarWrapper>
  );
}

const CalendarWrapper = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
`;

const MonthLayout = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 20px;
`;

const Month = styled.div`
  font-size: 19px;
  font-family: Pretendard-Medium;
  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const DaysRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  gap: 13px;
  @media (max-width: 480px) {
    gap: 6px;
    margin-bottom: 10px;
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 13px;
  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const Day = styled.div`
  ${theme.styles.flexCenterRow}
  width: 45px;
  height: 45px;
  font-family: Pretendard-Medium;
  font-size: 18px;
  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
`;

const Cell = styled.div`
  -webkit-tap-highlight-color: transparent;
  ${theme.styles.flexCenterRow}
  width: 45px;
  height: 45px;
  font-size: 18px;
  font-family: Pretendard-Medium;
  border-radius: 3px;
  cursor: pointer;
  background-color: ${(props) => (props.isSelected ? theme.color.primary : "white")};
  color: ${(props) => (props.isSelected ? "white" : "black")};

  &.disabled {
    color: ${theme.text.gamma[800]};
    pointer-events: none;
  }

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    font-size: 15px;
    border-radius: 20px;
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const ArrowLayout = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};
  svg {
    width: ${(props) => (props.width ? `${props.width}px` : "10px")};
    height: ${(props) => (props.height ? `${props.height}px` : "20px")};
  }
  @media (max-width: 480px) {
    svg {
      width: 7px;
      height: 14px;
    }
  }
`;
