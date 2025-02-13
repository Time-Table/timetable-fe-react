import React, { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Arrow from "../assets/svg/Arrow";

// 각 셀에 대해 네이티브 이벤트 리스너를 등록한 컴포넌트
function DraggableCell({
  date,
  time,
  isDisabled,
  cellKey,
  banedCells,
  timeIndex,
  cellIndex,
  isSelected,
  selectedCellColor,
  isViewMode,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleMouseDown,
  handleMouseOver,
}) {
  const cellRef = useRef(null);

  useEffect(() => {
    const el = cellRef.current;
    if (!el) return;

    const touchStartHandler = (e) => {
      if (!isDisabled) {
        handleTouchStart(date, time, e);
      }
    };
    const touchMoveHandler = (e) => {
      if (!isDisabled) {
        handleTouchMove(date, time, e);
      }
    };
    const touchEndHandler = (e) => {
      if (!isDisabled) {
        handleTouchEnd(e);
      }
    };

    el.addEventListener("touchstart", touchStartHandler, { passive: false });
    el.addEventListener("touchmove", touchMoveHandler, { passive: false });
    el.addEventListener("touchend", touchEndHandler, { passive: false });

    return () => {
      el.removeEventListener("touchstart", touchStartHandler);
      el.removeEventListener("touchmove", touchMoveHandler);
      el.removeEventListener("touchend", touchEndHandler);
    };
  }, [date, time, isDisabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <Cell
      ref={cellRef}
      cellKey={cellKey}
      banedCells={banedCells}
      timeIndex={timeIndex}
      cellIndex={cellIndex}
      isSelected={isSelected}
      selectedCellColor={selectedCellColor}
      isDisabled={isDisabled}
      isViewMode={isViewMode}
      onMouseDown={() => !isDisabled && handleMouseDown(date, time)}
      onMouseOver={() => !isDisabled && handleMouseOver(date, time)}
    />
  );
}

export default function TimeGrid({
  dates = [],
  startHour = "00:00",
  endHour = "01:00",
  selectedCells = [],
  setSelectedCells,
  selectedCellColor,
  isViewMode,
  banedCells = [],
}) {
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [weeks, setWeeks] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  // 드래그 시작 시 선택할지 해제할지를 저장 ("select" 또는 "deselect")
  const [dragAction, setDragAction] = useState(null);

  // 현재 dragAction에 따라 셀의 선택 상태를 업데이트
  const updateSelection = (cellKey, action) => {
    if (action === "select") {
      if (!selectedCells.includes(cellKey)) {
        setSelectedCells((prev) => [...prev, cellKey]);
      }
    } else if (action === "deselect") {
      if (selectedCells.includes(cellKey)) {
        setSelectedCells((prev) => prev.filter((cell) => cell !== cellKey));
      }
    }
  };

  // 터치 이벤트 핸들러 (네이티브 이벤트 리스너를 통해 호출됨)
  const handleTouchStart = (date, time, event) => {
    event.preventDefault();
    setIsDragging(true);
    const cellKey = `${date}-${time}`;
    // 시작 시 셀이 이미 선택되어 있으면 해제, 아니면 선택 액션 결정
    const action = selectedCells.includes(cellKey) ? "deselect" : "select";
    setDragAction(action);
    updateSelection(cellKey, action);
  };

  const handleTouchMove = (date, time, event) => {
    event.preventDefault();
    if (isDragging) {
      const cellKey = `${date}-${time}`;
      updateSelection(cellKey, dragAction);
    }
  };

  const handleTouchEnd = (event) => {
    event.preventDefault();
    setIsDragging(false);
    setDragAction(null);
  };

  // 마우스 이벤트 핸들러 (데스크탑)
  const handleMouseDown = (date, time) => {
    setIsDragging(true);
    const cellKey = `${date}-${time}`;
    const action = selectedCells.includes(cellKey) ? "deselect" : "select";
    setDragAction(action);
    updateSelection(cellKey, action);
  };

  const handleMouseOver = (date, time) => {
    if (isDragging) {
      const cellKey = `${date}-${time}`;
      updateSelection(cellKey, dragAction);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragAction(null);
  };

  useEffect(() => {
    const groupedWeeks = groupDatesByWeek(dates);
    setWeeks(groupedWeeks);
  }, [dates]);

  const groupDatesByWeek = (datesArray) => {
    const weeks = {};
    datesArray.forEach((date) => {
      const current = new Date(date);
      const firstDayOfWeek = new Date(current.setDate(current.getDate() - current.getDay()));
      const weekKey = firstDayOfWeek.toISOString().split("T")[0];
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(date);
    });

    const fullWeeks = Object.keys(weeks).map((weekKey) => {
      const weekStart = new Date(weekKey);
      const fullWeek = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        fullWeek.push(day.toISOString().split("T")[0]);
      }
      return fullWeek;
    });
    return fullWeeks;
  };

  const generateTimeRange = (start, end) => {
    const times = [];
    let [startHourNum] = start.split(":").map(Number);
    let [endHourNum] = end.split(":").map(Number);
    if (startHourNum > endHourNum) {
      [startHourNum, endHourNum] = [endHourNum, startHourNum];
    }
    while (startHourNum < endHourNum || (startHourNum === endHourNum && times.length === 0)) {
      times.push(`${startHourNum.toString().padStart(2, "0")}:00`);
      times.push(`${startHourNum.toString().padStart(2, "0")}:30`);
      startHourNum++;
    }
    return times;
  };

  const timeRange = generateTimeRange(startHour, endHour);
  const currentWeek = weeks[currentWeekIndex] || [];

  const nextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    }
  };

  const prevWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const weekday = date.toLocaleDateString("ko-KR", { weekday: "short" });
    const monthYear = date.toLocaleDateString("ko-KR", { month: "long", year: "numeric" });
    return { day, weekday, monthYear };
  };

  const { monthYear } = formatDate(currentWeek[0] || new Date().toISOString());

  return (
    <GridWrapper onMouseUp={handleMouseUp}>
      <MonthDisplay>
        <span>{monthYear}</span>
      </MonthDisplay>
      <Grid columns={currentWeek.length + 1}>
        <HeaderRow>
          <EmptyCell />
          {currentWeek.map((date, index) => {
            const { day, weekday } = formatDate(date);
            return (
              <HeaderCell key={index} isDisabled={!dates.includes(date)}>
                <WeekBox>{day}</WeekBox>
                <WeekBox>{weekday}</WeekBox>
              </HeaderCell>
            );
          })}
        </HeaderRow>
        {timeRange.map((time, timeIndex) => (
          <Row key={timeIndex}>
            <TimeCell>{timeIndex % 2 === 1 ? "" : time}</TimeCell>
            {currentWeek.map((date, dateIndex) => {
              const cellKey = `${date}-${time}`;
              const isSelected = selectedCells.includes(cellKey);
              const isDisabled = !dates.includes(date);
              return (
                <DraggableCell
                  key={cellKey}
                  date={date}
                  time={time}
                  cellKey={cellKey}
                  banedCells={banedCells}
                  timeIndex={timeIndex}
                  cellIndex={dateIndex}
                  isSelected={isSelected}
                  selectedCellColor={selectedCellColor}
                  isDisabled={isDisabled}
                  isViewMode={isViewMode}
                  handleTouchStart={handleTouchStart}
                  handleTouchMove={handleTouchMove}
                  handleTouchEnd={handleTouchEnd}
                  handleMouseDown={handleMouseDown}
                  handleMouseOver={handleMouseOver}
                />
              );
            })}
          </Row>
        ))}
      </Grid>
      <WeekNavigation>
        <ArrowLayout disabled={currentWeekIndex === 0} onClick={prevWeek}>
          <Arrow
            width={10}
            height={20}
            color={currentWeekIndex === 0 ? theme.text.gamma[800] : "black"}
            angle={180}
          />
        </ArrowLayout>
        <ArrowLayout disabled={currentWeekIndex === weeks.length - 1} onClick={nextWeek}>
          <Arrow
            width={10}
            height={20}
            color={currentWeekIndex === weeks.length - 1 ? theme.text.gamma[800] : "black"}
          />
        </ArrowLayout>
      </WeekNavigation>
    </GridWrapper>
  );
}

const GridWrapper = styled.div`
  ${theme.styles.flexCenterColumn};
  user-select: none;
  gap: 30px;
`;

const MonthDisplay = styled.div`
  width: 70%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-family: "Pretendard-Medium";
  font-size: 23px;
  margin-bottom: 10px;
  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const WeekNavigation = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-right: 80px;
  gap: 20px;
  width: 100%;
  @media (max-width: 480px) {
    padding-right: 0px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr repeat(${(props) => props.columns - 1}, 1fr);
`;

const HeaderRow = styled.div`
  display: contents;
`;

const Row = styled.div`
  font-size: 16px;
  display: contents;
`;

const EmptyCell = styled.div`
  grid-column: span 1;
`;

const HeaderCell = styled.div`
  grid-column: span 1;
  width: 60px;
  font-family: "Pretendard-Regular";
  font-size: 20px;
  pointer-events: ${(props) => (props.isDisabled ? "none" : "auto")};
  @media (max-width: 480px) {
    width: 40px;
    font-size: 17px;
  }
`;

const TimeCell = styled.div`
  grid-column: span 1;
  text-align: right;
  padding-right: 10px;
  @media (max-width: 480px) {
    padding-right: 5px;
  }
`;

const Cell = styled.div`
  touch-action: none;
  width: 60px;
  height: 30px;
  grid-column: span 1;
  border-right: ${(props) =>
    props.cellIndex === 6 ? `none` : `1px solid ${theme.text.gamma[800]}`};
  border-top: ${(props) => {
    if (props.timeIndex === 0) return `2px solid ${theme.text.gamma[800]}`;
    else if (props.timeIndex % 2 === 0 && !props.isDisabled)
      return `2px solid ${theme.text.gamma[800]}`;
    else if (!props.isDisabled) return `1px solid ${theme.text.gamma[800]}`;
    return `2px solid ${theme.text.gamma[800]}`;
  }};
  background-color: ${(props) =>
    props.isSelected
      ? `${props.selectedCellColor}`
      : props.isDisabled || props.banedCells.includes(props.cellKey)
      ? `${theme.text.gamma[800]}`
      : "white"};
  cursor: ${(props) =>
    props.isDisabled || props.isViewMode || props.banedCells.includes(props.cellKey)
      ? "not-allowed"
      : "pointer"};
  pointer-events: ${(props) =>
    props.isDisabled || props.isViewMode || props.banedCells.includes(props.cellKey)
      ? "none"
      : "auto"};
  @media (max-width: 480px) {
    width: 43px;
    height: 20px;
  }
`;

const WeekBox = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 60px;
  height: 40px;
  @media (max-width: 480px) {
    width: 40px;
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
