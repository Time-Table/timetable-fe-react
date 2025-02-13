import React, { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Arrow from "../assets/svg/Arrow";

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
  console.log("z");
  const gridRef = useRef(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [weeks, setWeeks] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState(null);

  const updateSelection = (cellKey, action) => {
    setSelectedCells((prev) => {
      if (action === "select") {
        if (!prev.includes(cellKey)) return [...prev, cellKey];
      } else if (action === "deselect") {
        if (prev.includes(cellKey)) return prev.filter((cell) => cell !== cellKey);
      }
      return prev;
    });
  };

  // 터치 이벤트 핸들러 (모바일)
  const handleTouchStart = (e) => {
    // 화살표 버튼 등 별도의 요소를 클릭한 경우 드래그 로직을 무시
    if (e.target.closest(".arrow-layout")) return;
    if (e.cancelable) e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elem && elem.dataset && elem.dataset.cellkey) {
      const cellKey = elem.dataset.cellkey;
      const action = selectedCells.includes(cellKey) ? "deselect" : "select";
      setDragAction(action);
      updateSelection(cellKey, action);
    }
  };

  const handleTouchMove = (e) => {
    if (e.cancelable) e.preventDefault();
    if (isDragging && dragAction) {
      const touch = e.touches[0];
      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elem && elem.dataset && elem.dataset.cellkey) {
        const cellKey = elem.dataset.cellkey;
        updateSelection(cellKey, dragAction);
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (e.cancelable) e.preventDefault();
    setIsDragging(false);
    setDragAction(null);
  };

  // 마우스 이벤트 핸들러 (PC)
  const handleMouseDownGlobal = (e) => {
    // 화살표 버튼이면 드래그 로직 실행하지 않음
    if (e.target.closest(".arrow-layout")) return;
    e.preventDefault();
    setIsDragging(true);
    const elem = document.elementFromPoint(e.clientX, e.clientY);
    if (elem && elem.dataset && elem.dataset.cellkey) {
      const cellKey = elem.dataset.cellkey;
      const action = selectedCells.includes(cellKey) ? "deselect" : "select";
      setDragAction(action);
      updateSelection(cellKey, action);
    }
  };

  const handleMouseMoveGlobal = (e) => {
    if (isDragging && dragAction) {
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      if (elem && elem.dataset && elem.dataset.cellkey) {
        const cellKey = elem.dataset.cellkey;
        updateSelection(cellKey, dragAction);
      }
    }
  };

  const handleMouseUpGlobal = (e) => {
    setIsDragging(false);
    setDragAction(null);
  };

  // 터치 이벤트 리스너 등록 (모바일)
  useEffect(() => {
    const gridEl = gridRef.current;
    if (gridEl) {
      gridEl.addEventListener("touchstart", handleTouchStart, { passive: false });
      gridEl.addEventListener("touchmove", handleTouchMove, { passive: false });
      gridEl.addEventListener("touchend", handleTouchEnd, { passive: false });
      return () => {
        gridEl.removeEventListener("touchstart", handleTouchStart);
        gridEl.removeEventListener("touchmove", handleTouchMove);
        gridEl.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, dragAction, selectedCells]);

  // 마우스 이벤트 리스너 등록 (PC)
  useEffect(() => {
    const gridEl = gridRef.current;
    if (gridEl) {
      gridEl.addEventListener("mousedown", handleMouseDownGlobal, { passive: false });
      document.addEventListener("mousemove", handleMouseMoveGlobal, { passive: false });
      document.addEventListener("mouseup", handleMouseUpGlobal, { passive: false });
      return () => {
        gridEl.removeEventListener("mousedown", handleMouseDownGlobal);
        document.removeEventListener("mousemove", handleMouseMoveGlobal);
        document.removeEventListener("mouseup", handleMouseUpGlobal);
      };
    }
  }, [isDragging, dragAction, selectedCells]);

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
    <>
      <GridWrapper ref={gridRef}>
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
                  <Cell
                    key={cellKey}
                    data-cellkey={cellKey}
                    cellIndex={dateIndex}
                    timeIndex={timeIndex}
                    isSelected={isSelected}
                    selectedCellColor={selectedCellColor}
                    isDisabled={isDisabled}
                    banedCells={banedCells}
                    isViewMode={isViewMode}
                  />
                );
              })}
            </Row>
          ))}
        </Grid>
      </GridWrapper>
      <WeekNavigation>
        <ArrowLayout className="arrow-layout" disabled={currentWeekIndex === 0} onClick={prevWeek}>
          <Arrow
            width={10}
            height={20}
            color={currentWeekIndex === 0 ? theme.text.gamma[800] : "black"}
            angle={180}
          />
        </ArrowLayout>
        <ArrowLayout
          className="arrow-layout"
          disabled={currentWeekIndex === weeks.length - 1}
          onClick={nextWeek}
        >
          <Arrow
            width={10}
            height={20}
            color={currentWeekIndex === weeks.length - 1 ? theme.text.gamma[800] : "black"}
          />
        </ArrowLayout>
      </WeekNavigation>
    </>
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
