import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Arrow from "../assets/svg/Arrow";
import Loader from "../page/use/component/Loading";
import { AnimatePresence, motion } from "framer-motion";

export default function TimeGridViewMode({
     dates = [],
     startHour = "00:00",
     endHour = "00:30",
     timeInfo,
     banedCells = [],
}) {
     const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
     const [weeks, setWeeks] = useState([]);
     const [resolvedTimeInfo, setResolvedTimeInfo] = useState([]);
     const [isLoading, setIsLoading] = useState(true);
     const [maxCount, setMaxCount] = useState(1);
     const [selectedCell, setSelectedCell] = useState(null);
     const todayDateString = new Date().toISOString().split("T")[0];

     useEffect(() => {
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
     }, [timeInfo]);

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
          if (Array.isArray(dates) && dates.length > 0) {
               setWeeks(groupDatesByWeek(dates));
               setCurrentWeekIndex(0);
          }
     }, [dates]);

     const generateTimeRange = (start, end) => {
          const times = [];
          let [startHourNum] = start.split(":").map(Number);
          let [endHourNum] = end.split(":").map(Number);
          if (startHourNum >= endHourNum) return [];
          while (startHourNum < endHourNum) {
               times.push(`${startHourNum.toString().padStart(2, "0")}:00`);
               times.push(`${startHourNum.toString().padStart(2, "0")}:30`);
               startHourNum++;
          }
          return times;
     };

     const timeRange = generateTimeRange(startHour, endHour);
     const currentWeek = weeks[currentWeekIndex] || [];

     const nextWeek = () => {
          if (currentWeekIndex < weeks.length - 1) setCurrentWeekIndex((prev) => prev + 1);
     };
     const prevWeek = () => {
          if (currentWeekIndex > 0) setCurrentWeekIndex((prev) => prev - 1);
     };

     const formatDate = (dateString) => {
          const date = new Date(dateString + "T00:00:00Z");
          const day = date.getUTCDate();
          const weekday = date.toLocaleDateString("ko-KR", { weekday: "short", timeZone: "UTC" });
          const monthYear = date.toLocaleDateString("ko-KR", { month: "long", year: "numeric", timeZone: "UTC" });
          return { day, weekday, monthYear };
     };

     const { monthYear } = formatDate(currentWeek[0] || new Date().toISOString());

     if (isLoading) return <Loader />;

     return (
          <div style={{ width: "100%" }}>
               <GridHeader>
                    <MonthDisplay>{monthYear}</MonthDisplay>
                    <WeekNavigation>
                         <ArrowLayout disabled={currentWeekIndex === 0} onClick={prevWeek}>
                              <Arrow
                                   width={10}
                                   height={20}
                                   color={currentWeekIndex === 0 ? theme.text.gamma[800] : "black"}
                                   angle={180}
                              />
                         </ArrowLayout>
                         <ArrowLayout disabled={currentWeekIndex >= weeks.length - 1} onClick={nextWeek}>
                              <Arrow
                                   width={10}
                                   height={20}
                                   color={currentWeekIndex >= weeks.length - 1 ? theme.text.gamma[800] : "black"}
                              />
                         </ArrowLayout>
                    </WeekNavigation>
               </GridHeader>
               <GridContainer>
                    <Grid>
                         <HeaderRow>
                              <EmptyCell />
                              {currentWeek.map((date) => {
                                   const { day, weekday } = formatDate(date);
                                   const isToday = date === todayDateString;
                                   return (
                                        <HeaderCell key={date} isDisabled={!dates.includes(date)} isToday={isToday}>
                                             <WeekdayBox>{weekday}</WeekdayBox>
                                             <DayBox isToday={isToday}>{day}</DayBox>
                                        </HeaderCell>
                                   );
                              })}
                         </HeaderRow>
                         {timeRange.map((time, timeIndex) => (
                              <Row key={timeIndex}>
                                   <TimeCell>{timeIndex % 2 === 0 ? time : ""}</TimeCell>
                                   {currentWeek.map((date) => {
                                        const cellKey = `${date}-${time}`;
                                        const info = resolvedTimeInfo.find(
                                             (item) => item.time === cellKey || item === cellKey
                                        );
                                        const count = info?.count || 0;
                                        const opacity = count > 0 ? 0.2 + (count / maxCount) * 0.8 : 0;
                                        const isSelected = selectedCell?._id === info?._id;

                                        return (
                                             <Cell
                                                  key={cellKey}
                                                  isDisabled={!dates.includes(date)}
                                                  isBaned={banedCells.includes(cellKey)}
                                                  onClick={() => {
                                                       if (!info) return;
                                                       if (isSelected) setSelectedCell(null);
                                                       else setSelectedCell(info);
                                                  }}
                                             >
                                                  <ColoringLayer style={{ opacity }} />
                                                  <AnimatePresence>
                                                       {isSelected && info && (
                                                            <Tooltip
                                                                 initial={{ opacity: 0, y: 10 }}
                                                                 animate={{ opacity: 1, y: 0 }}
                                                                 exit={{ opacity: 0, y: 10 }}
                                                            >
                                                                 <TooltipContent>
                                                                      <strong>{info.count}명</strong>
                                                                      <span>{info.members?.join(", ")}</span>
                                                                 </TooltipContent>
                                                            </Tooltip>
                                                       )}
                                                  </AnimatePresence>
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
     color: ${(props) => (props.isDisabled ? theme.text.gamma[800] : "inherit")};
     background-color: ${(props) => (props.isToday ? `${theme.color.primary}10` : "transparent")};
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
     background-color: ${(props) => (props.isToday ? theme.color.primary : "transparent")};
     color: ${(props) => (props.isToday ? "white" : "inherit")};
`;
const TimeCell = styled.div`
     position: relative;
     top: -8px;
     display: flex;
     justify-content: center;
     align-items: center;
     grid-column: 1 / 2;
     font-size: 12px;
     font-family: "Pretendard-Medium";
     color: ${theme.text.gamma[600]};
`;
const Cell = styled.div`
     position: relative;
     height: 30px;
     border-right: 1px solid ${theme.text.gamma[900]};
     border-bottom: 1px solid ${theme.text.gamma[900]};
     background-color: ${(props) => (props.isDisabled || props.isBaned) && theme.text.gamma[900]};
     cursor: ${(props) => (props.isDisabled || props.isBaned ? "not-allowed" : "pointer")};
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
     background-color: ${theme.color.primary};
     transition: opacity 0.3s ease;
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
     transition: background-color 0.2s, border-color 0.2s;
     pointer-events: ${(props) => (props.disabled ? "none" : "auto")};
     opacity: ${(props) => (props.disabled ? 0.4 : 1)};
     &:hover {
          background-color: ${theme.text.gamma[900]};
          border-color: ${theme.text.gamma[700]};
     }
     svg {
          width: 8px;
          height: 16px;
     }
`;
