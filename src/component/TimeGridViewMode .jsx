import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Arrow from "../assets/svg/Arrow";

export default function TimeGridViewMode({
  dates = [],
  startHour,
  endHour,
  timeInfo,
  selectedName,
  isViewMode,
}) {
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [weeks, setWeeks] = useState([]);
  const [cellColorMap, setCellColorMap] = useState({});
  const [resolvedTimeInfo, setResolvedTimeInfo] = useState([]); // timeInfo 데이터를 상태로 관리

  useEffect(() => {
    const resolveTimeInfo = async () => {
      if (timeInfo instanceof Promise) {
        const resolved = await timeInfo;
        setResolvedTimeInfo(Array.isArray(resolved) ? resolved : []);
      } else {
        setResolvedTimeInfo(Array.isArray(timeInfo) ? timeInfo : []);
      }
    };

    resolveTimeInfo();
  }, [timeInfo]);

  useEffect(() => {
    if (Array.isArray(dates) && dates.length > 0) {
      setWeeks(groupDatesByWeek(dates));
    }
  }, [dates]);

  useEffect(() => {
    if (Array.isArray(resolvedTimeInfo)) {
      if (selectedName) {
        updateSelectedNameDateInfo(resolvedTimeInfo);
      } else {
        updateDateInfo(resolvedTimeInfo);
      }
    } else {
      console.error("timeInfo is not an array:", resolvedTimeInfo);
    }
  }, [resolvedTimeInfo, selectedName]);

  const updateSelectedNameDateInfo = (data) => {
    if (!Array.isArray(data)) {
      console.error("Expected an array, but received:", data);
      return;
    }

    const newCellColorMap = {};

    data.forEach((dateInfo) => {
      if (dateInfo) {
        newCellColorMap[dateInfo] = "select";
      }
    });

    setCellColorMap((prev) =>
      JSON.stringify(prev) === JSON.stringify(newCellColorMap) ? prev : newCellColorMap
    );
  };

  const updateDateInfo = (data) => {
    const newCellColorMap = {};
    data.forEach((dateInfo) => {
      if (dateInfo?.time) {
        newCellColorMap[dateInfo.time] = dateInfo.colorNumber || 20;
      }
    });
    setCellColorMap((prev) =>
      JSON.stringify(prev) === JSON.stringify(newCellColorMap) ? prev : newCellColorMap
    );
  };

  function groupDatesByWeek(datesArray) {
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

    return Object.keys(weeks).map((weekKey) => {
      const weekStart = new Date(weekKey);
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        return day.toISOString().split("T")[0];
      });
    });
  }

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
      setCurrentWeekIndex((prev) => prev + 1);
    }
  };

  const prevWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex((prev) => prev - 1);
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
    <GridWrapper>
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
        {timeRange.map((time, timeIndex) => (
          <Row key={timeIndex}>
            <TimeCell>{timeIndex % 2 === 1 ? "" : time}</TimeCell>
            {currentWeek.map((date, dateIndex) => {
              const cellKey = `${date}-${time}`;
              const isDisabled = !dates.includes(date);
              const colorNumber = cellColorMap[cellKey];
              const isSelected = !!colorNumber;

              return (
                <Cell
                  key={cellKey}
                  timeIndex={timeIndex}
                  cellIndex={dateIndex}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  isViewMode={isViewMode}
                  color={colorNumber}
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
    padding-right: 40px;
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
    width: 41px;
    font-size: 18px;
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
  width: 60px;
  height: 30px;
  grid-column: span 1;
  border-right: ${(props) => {
    return props.cellIndex === 5 ? `none` : `1px solid ${theme.text.gamma[800]}`;
  }};
  border-top: ${(props) => {
    if (props.timeIndex === 0) return "none";
    else if (props.timeIndex % 2 === 0 && !props.isDisabled)
      return `2px solid ${theme.text.gamma[800]}`;
    else if (!props.isDisabled) return `1px solid ${theme.text.gamma[800]}`;
    return `2px solid ${theme.text.gamma[800]}`;
  }};

  background-color: ${(props) =>
    props.isSelected
      ? props.color
        ? `${theme.color.timeGrid[props.color]}`
        : `${theme.color.primary}`
      : props.isDisabled
      ? `${theme.text.gamma[800]}`
      : "white"};
  cursor: ${(props) => (props.isDisabled || props.isViewMode ? "not-allowed" : "pointer")};
  pointer-events: ${(props) => (props.isDisabled || props.isViewMode ? "none" : "auto")};

  @media (max-width: 480px) {
    width: 46px;
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
