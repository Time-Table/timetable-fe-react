import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Arrow from "../assets/svg/Arrow";

const TimeGrid = ({ dates, startHour, endHour }) => {
  const [selectedCells, setSelectedCells] = useState([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [weeks, setWeeks] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

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
    for (let hour = start; hour < end; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`);
      times.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return times;
  };

  const timeRange = generateTimeRange(startHour, endHour);

  const handleMouseDown = (date, time) => {
    setIsDragging(true);
    const cellKey = `${date}-${time}`;
    toggleSelection(cellKey);
  };

  const handleMouseOver = (date, time) => {
    if (isDragging) {
      const cellKey = `${date}-${time}`;
      toggleSelection(cellKey);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleSelection = (cellKey) => {
    if (selectedCells.includes(cellKey)) {
      setSelectedCells((prev) => prev.filter((cell) => cell !== cellKey));
      console.log(selectedCells);
    } else {
      setSelectedCells((prev) => [...prev, cellKey]);
      console.log(selectedCells);
    }
  };

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

  const currentWeek = weeks[currentWeekIndex] || [];

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
      <MonthDisplay>{monthYear}</MonthDisplay>
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
        {timeRange.map((time, timeIndex) => {
          return (
            <Row key={timeIndex}>
              <TimeCell>{timeIndex % 2 == 1 ? "" : time}</TimeCell>
              {currentWeek.map((date, dateIndex) => {
                const cellKey = `${date}-${time}`;
                const isSelected = selectedCells.includes(cellKey);
                const isDisabled = !dates.includes(date);
                return (
                  <Cell
                    timeIndex={timeIndex}
                    key={dateIndex}
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    onMouseDown={() => !isDisabled && handleMouseDown(date, time)}
                    onMouseOver={() => !isDisabled && handleMouseOver(date, time)}
                  />
                );
              })}
            </Row>
          );
        })}
      </Grid>
      <WeekNavigation>
        <ArrowLayout disabled={currentWeekIndex === 0} onClick={prevWeek} isLeft={true}>
          <Arrow
            width={10}
            height={20}
            color={currentWeekIndex === 0 ? theme.text.gamma[800] : "black"}
          />
        </ArrowLayout>
        <ArrowLayout onClick={nextWeek} disabled={currentWeekIndex === weeks.length - 1}>
          <Arrow
            width={10}
            height={20}
            color={currentWeekIndex === weeks.length - 1 ? theme.text.gamma[800] : "black"}
          />
        </ArrowLayout>
      </WeekNavigation>
    </GridWrapper>
  );
};

export default TimeGrid;

const GridWrapper = styled.div`
  ${theme.styles.flexCenterColumn};
  user-select: none;
  width: 500px;
  gap: 30px;
`;

const MonthDisplay = styled.div`
  text-align: center;
  font-family: "Pretendard-Medium";
  font-size: 25px;
  margin-bottom: 10px;
`;

const WeekNavigation = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-right: 80px;
  gap: 20px;
  width: 100%;
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
`;

const TimeCell = styled.div`
  grid-column: span 1;
  text-align: right;
  padding-right: 10px;
`;

const Cell = styled.div`
  width: 60px;
  height: 30px;
  grid-column: span 1;
  border-right: ${(props) => {
    return props.key === 5 ? `none` : `1px solid ${theme.text.gamma[800]}`;
  }};
  border-top: ${(props) => {
    if (props.timeIndex === 0) return "none";
    else if (props.timeIndex % 2 === 0 && !props.isDisabled)
      return `2px solid ${theme.text.gamma[500]}`;
    else if (!props.isDisabled) return `1px solid ${theme.text.gamma[800]}`;
    return `2px solid ${theme.text.gamma[800]}`;
  }};
  /* TODO: 시간 선 투명도 조정 
  opacity: ${(props) => {
    if (props.timeIndex % 2 === 0 && !props.isDisabled) return `60%`;
  }}; */
  background-color: ${(props) =>
    props.isSelected
      ? `${theme.color.primary}`
      : props.isDisabled
      ? `${theme.text.gamma[800]}`
      : "white"};
  cursor: ${(props) => (props.isDisabled ? "not-allowed" : "pointer")};
`;

const WeekBox = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 60px;
  height: 40px;
`;

const ArrowLayout = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};
  transform: ${(props) => (props.isLeft ? "rotate(180deg)" : "none")};

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
