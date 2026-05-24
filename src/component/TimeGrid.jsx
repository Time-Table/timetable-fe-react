import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "@emotion/styled";
import { keyframes, css } from "@emotion/react";
import theme from "../theme";
import Arrow from "../assets/svg/Arrow";
import Loader from "../page/timetable/components/Loading";
import { AnimatePresence, motion } from "framer-motion";

export default function TimeGrid({
  dates = [],
  startHour = "00:00",
  endHour = "01:00",
  // Input Mode Props
  selectedCells = [],
  setSelectedCells,
  selectedCellColor,
  bgTimeInfo,
  // View Mode Props
  timeInfo,
  readOnly = false,
  // Common Props
  banedCells = [],
  onCellClick,
  selectedCellKey,
}) {
  const gridRef = useRef(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [weeks, setWeeks] = useState([]);

  // Input Mode State
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState(null);
  const [lastSelectedCell, setLastSelectedCell] = useState(null);

  // View Mode State
  const [resolvedTimeInfo, setResolvedTimeInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Default to false for input mode
  const [maxCount, setMaxCount] = useState(1);
  const [selectedViewCell, setSelectedViewCell] = useState(null);

  // Background timeInfo State (input mode only)
  const [resolvedBgTimeInfo, setResolvedBgTimeInfo] = useState([]);
  const [bgMaxCount, setBgMaxCount] = useState(1);

  const todayDateString = new Date().toISOString().split("T")[0];

  // --- View Mode Logic ---
  useEffect(() => {
    if (!readOnly || !timeInfo) return;

    const resolveTimeInfo = async () => {
      setIsLoading(true);
      try {
        const resolved = timeInfo instanceof Promise ? await timeInfo : timeInfo;
        let validData = [];
        if (Array.isArray(resolved)) {
          if (typeof resolved[0] === "string") {
            validData = resolved.map((time) => ({
              time,
              count: 1,
              colorNumber: 20,
              members: [],
              _id: `virtual-${time}`,
            }));
          } else {
            validData = resolved;
          }
        }
        setResolvedTimeInfo(validData);
        const max = validData.reduce((acc, cur) => Math.max(acc, cur.count), 1);
        setMaxCount(max);
      } catch (error) {
        console.error("Error resolving timeInfo:", error);
        setResolvedTimeInfo([]);
      } finally {
        setIsLoading(false);
      }
    };
    resolveTimeInfo();
  }, [timeInfo, readOnly]);

  // Background timeInfo resolution (input mode)
  useEffect(() => {
    if (!bgTimeInfo) return;
    const resolve = async () => {
      try {
        const resolved = bgTimeInfo instanceof Promise ? await bgTimeInfo : bgTimeInfo;
        let validData = [];
        if (Array.isArray(resolved)) {
          if (typeof resolved[0] === "string") {
            validData = resolved.map((time) => ({ time, count: 1, members: [], _id: `bg-${time}` }));
          } else {
            validData = resolved;
          }
        }
        setResolvedBgTimeInfo(validData);
        const max = validData.reduce((acc, cur) => Math.max(acc, cur.count), 1);
        setBgMaxCount(max);
      } catch {
        setResolvedBgTimeInfo([]);
      }
    };
    resolve();
  }, [bgTimeInfo]);

  // --- Input Mode Logic ---
  const updateSelection = useCallback(
    (cellKey, action) => {
      if (readOnly || !cellKey || cellKey === lastSelectedCell) return;
      setSelectedCells((prev) => {
        if (action === "select") {
          if (!prev.includes(cellKey)) return [...prev, cellKey];
        } else if (action === "deselect") {
          if (prev.includes(cellKey)) return prev.filter((cell) => cell !== cellKey);
        }
        return prev;
      });
      setLastSelectedCell(cellKey);
    },
    [lastSelectedCell, setSelectedCells, readOnly],
  );

  const handleTouchStart = useCallback(
    (e) => {
      if (readOnly) return;
      if (!e.target.dataset.cellkey) return;
      if (e.cancelable) e.preventDefault();
      setIsDragging(true);
      const cellKey = e.target.dataset.cellkey;
      const action = selectedCells.includes(cellKey) ? "deselect" : "select";
      setDragAction(action);
      updateSelection(cellKey, action);
    },
    [selectedCells, updateSelection, readOnly],
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (readOnly || !isDragging || !dragAction) return;
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elem && elem.dataset && elem.dataset.cellkey) {
        updateSelection(elem.dataset.cellkey, dragAction);
      }
    },
    [isDragging, dragAction, updateSelection, readOnly],
  );

  const handleTouchEnd = useCallback(
    (e) => {
      if (readOnly) return;
      if (isDragging && e.cancelable) e.preventDefault();
      setIsDragging(false);
      setDragAction(null);
      setLastSelectedCell(null);
    },
    [readOnly, isDragging],
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (readOnly) return;
      if (!e.target.dataset.cellkey) return;
      e.preventDefault();
      setIsDragging(true);
      const cellKey = e.target.dataset.cellkey;
      const action = selectedCells.includes(cellKey) ? "deselect" : "select";
      setDragAction(action);
      updateSelection(cellKey, action);
    },
    [selectedCells, updateSelection, readOnly],
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (readOnly || !isDragging || !dragAction) return;
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      if (elem && elem.dataset && elem.dataset.cellkey) {
        updateSelection(elem.dataset.cellkey, dragAction);
      }
    },
    [isDragging, dragAction, updateSelection, readOnly],
  );

  const handleMouseUp = useCallback(() => {
    if (readOnly) return;
    setIsDragging(false);
    setDragAction(null);
    setLastSelectedCell(null);
  }, [readOnly]);

  useEffect(() => {
    if (readOnly) return;
    const gridEl = gridRef.current;
    if (gridEl) {
      gridEl.addEventListener("touchstart", handleTouchStart, { passive: false });
      gridEl.addEventListener("touchmove", handleTouchMove, { passive: false });
      gridEl.addEventListener("touchend", handleTouchEnd, { passive: false });
      gridEl.addEventListener("mousedown", handleMouseDown);
      gridEl.addEventListener("mousemove", handleMouseMove);
      gridEl.addEventListener("mouseup", handleMouseUp);
      gridEl.addEventListener("mouseleave", handleMouseUp);
      return () => {
        gridEl.removeEventListener("touchstart", handleTouchStart);
        gridEl.removeEventListener("touchmove", handleTouchMove);
        gridEl.removeEventListener("touchend", handleTouchEnd);
        gridEl.removeEventListener("mousedown", handleMouseDown);
        gridEl.removeEventListener("mousemove", handleMouseMove);
        gridEl.removeEventListener("mouseup", handleMouseUp);
        gridEl.removeEventListener("mouseleave", handleMouseUp);
      };
    }
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    readOnly,
  ]);

  // --- Common Logic ---
  const groupDatesByWeek = (datesArray) => {
    if (!datesArray || datesArray.length === 0) return [];
    const weeks = {};
    datesArray.forEach((date) => {
      const current = new Date(date + "T00:00:00Z");
      const dayOfWeek = current.getUTCDay();
      current.setUTCDate(current.getUTCDate() - dayOfWeek);
      const weekKey = current.toISOString().split("T")[0];
      if (!weeks[weekKey]) weeks[weekKey] = new Set();
      weeks[weekKey].add(date);
    });
    return Object.keys(weeks)
      .sort()
      .map((weekKey) => {
        const weekStart = new Date(weekKey + "T00:00:00Z");
        return Array.from({ length: 7 }, (_, i) => {
          const day = new Date(weekStart);
          day.setUTCDate(weekStart.getUTCDate() + i);
          return day.toISOString().split("T")[0];
        });
      });
  };

  useEffect(() => {
    const groupedWeeks = groupDatesByWeek(dates);
    setWeeks(groupedWeeks);
    setCurrentWeekIndex(0);
  }, [dates]);

  const currentWeek = weeks[currentWeekIndex] || [];
  const generateTimeRange = (start, end) => {
    const times = [];
    let startHourNum = parseInt(start.split(":")[0]);
    let endHourNum = parseInt(end.split(":")[0]);
    if (startHourNum >= endHourNum) return [];

    const safeEnd = Math.min(endHourNum, 24);

    while (startHourNum < safeEnd) {
      times.push(`${startHourNum.toString().padStart(2, "0")}:00`);
      times.push(`${startHourNum.toString().padStart(2, "0")}:30`);
      startHourNum++;
    }
    return times;
  };
  const timeRange = generateTimeRange(startHour, endHour);

  const selectedDate = readOnly && selectedCellKey
    ? selectedCellKey.slice(0, selectedCellKey.lastIndexOf("-"))
    : null;
  const selectedTime = readOnly && selectedCellKey
    ? selectedCellKey.slice(selectedCellKey.lastIndexOf("-") + 1)
    : null;

  const nextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) setCurrentWeekIndex(currentWeekIndex + 1);
  };
  const prevWeek = () => {
    if (currentWeekIndex > 0) setCurrentWeekIndex(currentWeekIndex - 1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + "T00:00:00Z");
    const day = date.getUTCDate();
    const weekday = date.toLocaleDateString("ko-KR", { weekday: "short", timeZone: "UTC" });
    const monthYear = date.toLocaleDateString("ko-KR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return { day, weekday, monthYear };
  };
  const { monthYear } = formatDate(currentWeek[0] || new Date().toISOString());

  const handleSelectRow = (time) => {
    if (readOnly) return;
    const cellsInRow = currentWeek
      .filter((date) => dates.includes(date))
      .map((date) => `${date}-${time}`);
    const areAllSelected = cellsInRow.every((cell) => selectedCells.includes(cell));
    setSelectedCells((prev) => {
      const otherCells = prev.filter((cell) => !cellsInRow.includes(cell));
      return areAllSelected ? otherCells : [...new Set([...otherCells, ...cellsInRow])];
    });
  };
  const handleSelectColumn = (date) => {
    if (readOnly) return;
    if (!dates.includes(date)) return;
    const cellsInColumn = timeRange.map((time) => `${date}-${time}`);
    const areAllSelected = cellsInColumn.every((cell) => selectedCells.includes(cell));
    setSelectedCells((prev) => {
      const otherCells = prev.filter((cell) => !cellsInColumn.includes(cell));
      return areAllSelected ? otherCells : [...new Set([...otherCells, ...cellsInColumn])];
    });
  };

  if (readOnly && isLoading) return <Loader />;

  return (
    <div style={{ width: "100%" }}>
      <GridHeader>
        <MonthDisplay>{monthYear}</MonthDisplay>
        <WeekNavigation>
          <ArrowLayout $disabled={currentWeekIndex === 0} onClick={prevWeek}>
            <Arrow
              width={10}
              height={20}
              color={currentWeekIndex === 0 ? theme.text.gamma[800] : "black"}
              angle={180}
            />
          </ArrowLayout>
          <ArrowLayout $disabled={currentWeekIndex >= weeks.length - 1} onClick={nextWeek}>
            <Arrow
              width={10}
              height={20}
              color={currentWeekIndex >= weeks.length - 1 ? theme.text.gamma[800] : "black"}
            />
          </ArrowLayout>
        </WeekNavigation>
      </GridHeader>
      <GridContainer>
        <Grid ref={gridRef}>
          <HeaderRow>
            <EmptyCell />
            {currentWeek.map((date) => {
              const { day, weekday } = formatDate(date);
              const isToday = date === todayDateString;
              return (
                <HeaderCell
                  key={date}
                  $isDisabled={!dates.includes(date)}
                  $isToday={isToday}
                  onClick={() => handleSelectColumn(date)}
                  $readOnly={readOnly}
                  $isHighlighted={!!(readOnly && selectedDate && date === selectedDate)}
                >
                  <WeekdayBox>{weekday}</WeekdayBox>
                  <DayBox $isToday={isToday}>{day}</DayBox>
                </HeaderCell>
              );
            })}
          </HeaderRow>
          {timeRange.map((time, timeIndex) => (
            <Row key={timeIndex}>
              <TimeCell
                onClick={() => handleSelectRow(time)}
                $readOnly={readOnly}
                $isHighlighted={!!(readOnly && selectedTime && time === selectedTime)}
              >
                {timeIndex % 2 === 0 ? time : ""}
              </TimeCell>
              {currentWeek.map((date) => {
                const cellKey = `${date}-${time}`;

                let viewInfo = null;
                let viewOpacity = 0;
                let isViewSelected = false;

                if (readOnly) {
                  viewInfo = resolvedTimeInfo.find(
                    (item) => item.time === cellKey || item === cellKey,
                  );
                  const count = viewInfo?.count || 0;
                  viewOpacity = count > 0 ? 0.2 + (count / maxCount) * 0.8 : 0;
                  isViewSelected = selectedViewCell?._id === viewInfo?._id;
                }

                let bgViewOpacity = 0;
                if (!readOnly && resolvedBgTimeInfo.length > 0) {
                  const bgViewInfo = resolvedBgTimeInfo.find((item) => item.time === cellKey);
                  const bgCount = bgViewInfo?.count || 0;
                  bgViewOpacity = bgCount > 0 ? 0.05 + (bgCount / bgMaxCount) * 0.25 : 0;
                }

                const isSelected = !readOnly && selectedCells.includes(cellKey);

                const isGolden = !!(readOnly && viewInfo && viewInfo.count === maxCount && maxCount > 0);

                const isInRow = !!(readOnly && selectedTime && time === selectedTime &&
                  currentWeek.indexOf(date) <= currentWeek.indexOf(selectedDate));
                const isInCol = !!(readOnly && selectedDate && date === selectedDate &&
                  timeRange.indexOf(time) <= timeRange.indexOf(selectedTime));

                return (
                  <Cell
                    key={cellKey}
                    data-cellkey={!readOnly ? cellKey : undefined}
                    $isSelected={isSelected}
                    $selectedCellColor={selectedCellColor}
                    $isDisabled={!dates.includes(date)}
                    $isBaned={banedCells.includes(cellKey)}
                    $readOnly={readOnly}
                    onClick={(e) => {
                      if (readOnly) {
                        if (onCellClick) {
                          onCellClick(viewInfo || null, e);
                          return;
                        }
                        if (!viewInfo) {
                          setSelectedViewCell(null);
                          return;
                        }
                        if (isViewSelected) setSelectedViewCell(null);
                        else setSelectedViewCell(viewInfo);
                      }
                    }}
                  >
                    {!readOnly && bgViewOpacity > 0 && (
                      <BgColoringLayer style={{ opacity: bgViewOpacity }} />
                    )}
                    {readOnly && (
                      <>
                        <ColoringLayer style={{ opacity: viewOpacity }} />
                        {isGolden && <GoldenEffect />}
                        {(isInRow || isInCol) && (
                          <HighlightLayer $strong={isInRow && isInCol} />
                        )}
                        {!onCellClick && (
                          <AnimatePresence>
                            {isViewSelected && viewInfo && (
                              <Tooltip
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                              >
                                <TooltipContent>
                                  <strong>{viewInfo.count}명</strong>
                                  <span>{viewInfo.members?.join(", ")}</span>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </AnimatePresence>
                        )}
                      </>
                    )}
                  </Cell>
                );
              })}
            </Row>
          ))}
        </Grid>
      </GridContainer>
    </div>
  );
}

const waveAnimation = keyframes`0% { transform: scale(0); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; }`;
const GridHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
`;
const MonthDisplay = styled.div`
  font-family: "Pretendard-Bold";
  font-size: 22px;
  color: ${theme.text.gamma[300]};
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;
const WeekNavigation = styled.div`
  display: flex;
  gap: 16px;
`;
const GridContainer = styled.div`
  position: relative;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: 55px repeat(7, 1fr);
  background-color: white;
  @media (max-width: 480px) {
    grid-template-columns: 45px repeat(7, 1fr);
  }
`;
const HeaderRow = styled.div`
  display: contents;
`;
const Row = styled.div`
  font-size: 16px;
  display: contents;
`;
const EmptyCell = styled.div`
  grid-column: 1 / 2;
  border-bottom: 1px solid ${theme.text.gamma[900]};
`;
const HeaderCell = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 8px 0 12px;
  color: ${(props) => (props.$isDisabled ? theme.text.gamma[800] : "inherit")};
  background-color: ${(props) => (props.$isToday ? `${theme.color.primary}10` : "transparent")};
  transition: background-color 0.2s ease;
  cursor: ${(props) =>
    props.$isDisabled || props.$readOnly
      ? props.$isDisabled
        ? "not-allowed"
        : "default"
      : "pointer"};
  -webkit-tap-highlight-color: transparent;

  ${(props) => props.$isHighlighted && !props.$isDisabled && `
    color: ${theme.color.primary};
    font-weight: bold;
  `}

  ${(props) =>
    !props.$readOnly &&
    `
        &:active {
             background-color: ${!props.$isDisabled && `${theme.color.primary}25`};
        }
        @media (hover: hover) {
             &:hover {
                  background-color: ${!props.$isDisabled && `${theme.color.primary}15`};
             }
        }
     `}
`;
const WeekdayBox = styled.div`
  font-family: "Pretendard-Regular";
  font-size: 13px;
  color: ${theme.text.gamma[500]};
`;
const DayBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Pretendard-SemiBold";
  font-size: 18px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${(props) => (props.$isToday ? theme.color.primary : "transparent")};
  color: ${(props) => (props.$isToday ? "white" : "inherit")};
`;
const TimeCell = styled.div`
  position: relative;
  top: -8px;
  display: flex;
  justify-content: center;
  align-items: center;
  grid-column: 1 / 2;
  font-size: 12px;
  font-family: ${(props) => props.$isHighlighted ? '"Pretendard-Bold"' : '"Pretendard-Medium"'};
  color: ${(props) => props.$isHighlighted ? theme.color.primary : theme.text.gamma[600]};
  cursor: ${(props) => (props.$readOnly ? "default" : "pointer")};
  border-radius: 4px;
  transition: background-color 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  ${(props) =>
    !props.$readOnly &&
    `
        &:active {
             background-color: ${theme.text.gamma[800]};
        }
        @media (hover: hover) {
             &:hover {
                  background-color: ${theme.text.gamma[900]};
             }
        }
     `}
`;
const Cell = styled.div`
  position: relative;
  height: 30px;
  border-right: 1px solid ${theme.text.gamma[900]};
  border-bottom: 1px solid ${theme.text.gamma[900]};
  background-color: ${(props) =>
    (props.$isDisabled || props.$isBaned) && `${theme.text.gamma[900]}`};
  cursor: ${(props) =>
    props.$isDisabled || props.$isBaned ? "not-allowed" : props.$readOnly ? "pointer" : "pointer"};
  pointer-events: ${(props) => (props.$isDisabled || props.$isBaned ? "none" : "auto")};

  /* Input Mode Animation */
  ${(props) =>
    !props.$readOnly &&
    css`
      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${props.$selectedCellColor || theme.color.primary};
        opacity: ${props.$isSelected ? 1 : 0};
        transform: ${props.$isSelected ? "scale(1)" : "scale(0)"};
        transform-origin: center;
        transition:
          transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
          opacity 0.3s ease;
        animation: ${props.$isSelected
          ? css`
              ${waveAnimation} 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)
            `
          : "none"};
      }
      @media (hover: hover) {
        &:hover::after {
          background-color: ${!props.$isSelected && `${theme.color.primary}20`};
          opacity: ${!props.$isSelected && 1};
          transform: scale(1);
          animation: none;
        }
      }
    `}

  @media (max-width: 480px) {
    height: 26px;
  }
`;
const ColoringLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
  transition: opacity 0.3s ease;
`;
const BgColoringLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
  pointer-events: none;
  z-index: 0;
`;

const goldenShimmer = keyframes`
  0%   { opacity: 0; transform: translateX(-100%) skewX(-20deg); }
  50%  { opacity: 0.45; }
  100% { opacity: 0; transform: translateX(300%) skewX(-20deg); }
`;

const GoldenEffect = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 100%;
    background: rgba(255, 255, 255, 0.6);
    animation: ${goldenShimmer} 2.4s ease-in-out infinite;
  }
`;
const HighlightLayer = styled.div`
  position: absolute;
  inset: 0;
  background: ${(props) =>
    props.$strong ? `${theme.color.primary}30` : `${theme.color.primary}12`};
  pointer-events: none;
`;
const Tooltip = styled(motion.div)`
  position: absolute;
  bottom: calc(100%);
  left: 60%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.85);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 20;
  width: max-content;
  max-width: 200px;
  pointer-events: none;
  white-space: normal;
  word-break: break-word;
  @media (max-width: 480px) {
    max-width: 100px;
    font-size: 12px;
    padding: 6px 8px;
    transform: translateX(-50%) translateY(-4px);
  }
`;
const TooltipContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: black;
  strong {
    font-family: "Pretendard-Bold";
    font-size: 14px;
    @media (max-width: 480px) {
      font-size: 13px;
    }
  }
  span {
    font-family: "Pretendard-Regular";
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-word;
    @media (max-width: 480px) {
      font-size: 11px;
    }
  }
`;
const ArrowLayout = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
  pointer-events: ${(props) => (props.$disabled ? "none" : "auto")};
  opacity: ${(props) => (props.$disabled ? 0.4 : 1)};
  &:hover {
    background-color: ${theme.text.gamma[900]};
    border-color: ${theme.text.gamma[700]};
  }
  svg {
    width: 8px;
    height: 16px;
  }
`;
