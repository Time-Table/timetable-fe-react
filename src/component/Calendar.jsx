import React, { useState, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Arrow from "../assets/svg/Arrow";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlusCircle } from "react-icons/fa";

const toYYYYMMDD = (date) => {
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, "0");
     const day = String(date.getDate()).padStart(2, "0");
     return `${year}-${month}-${day}`;
};

export default function Calendar({ selectedDates, setSelectedDates }) {
     const [currentDate, setCurrentDate] = useState(new Date());
     const [isDragging, setIsDragging] = useState(false);
     const [dragAction, setDragAction] = useState(null);

     const updateSelection = useCallback(
          (day, action) => {
               if (!day || !action) return;
               setSelectedDates((prev) => {
                    const isSelected = prev.includes(day);
                    if (action === "add" && !isSelected) return [...prev, day].sort();
                    if (action === "remove" && isSelected) return prev.filter((d) => d !== day);
                    return prev;
               });
          },
          [setSelectedDates]
     );
     const handlePointerDown = useCallback(
          (e, day) => {
               if (e.pointerType === "mouse" && e.button !== 0) return;
               e.preventDefault();
               e.currentTarget.releasePointerCapture(e.pointerId);
               setIsDragging(true);
               const isAlreadySelected = selectedDates.includes(day);
               const action = isAlreadySelected ? "remove" : "add";
               setDragAction(action);
               updateSelection(day, action);
          },
          [selectedDates, updateSelection]
     );

     useEffect(() => {
          const handlePointerMove = (e) => {
               if (!isDragging) return;
               const element = document.elementFromPoint(e.clientX, e.clientY);
               const cell = element?.closest("[data-date]");
               const isDisabled = cell?.hasAttribute("data-disabled");
               if (cell && !isDisabled) {
                    updateSelection(cell.dataset.date, dragAction);
               }
          };
          const handlePointerUp = () => {
               setIsDragging(false);
               setDragAction(null);
          };
          if (isDragging) {
               window.addEventListener("pointermove", handlePointerMove);
               window.addEventListener("pointerup", handlePointerUp);
               window.addEventListener("pointercancel", handlePointerUp);
          }
          return () => {
               window.removeEventListener("pointermove", handlePointerMove);
               window.removeEventListener("pointerup", handlePointerUp);
               window.removeEventListener("pointercancel", handlePointerUp);
          };
     }, [isDragging, dragAction, updateSelection]);

     const handleSelectMonth = () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const selectableDaysInMonth = [];
          for (let i = 1; i <= daysInMonth; i++) {
               const day = new Date(year, month, i);
               if (day >= today) {
                    selectableDaysInMonth.push(toYYYYMMDD(day));
               }
          }
          const areAllSelected = selectableDaysInMonth.every((day) => selectedDates.includes(day));
          if (areAllSelected) {
               setSelectedDates((prev) => prev.filter((d) => !selectableDaysInMonth.includes(d)));
          } else {
               setSelectedDates((prev) => [...new Set([...prev, ...selectableDaysInMonth])].sort());
          }
     };

     const month = () => {
          const monthLabel = currentDate.toLocaleDateString("ko-KR", { month: "long", year: "numeric" });
          const prevMonth = () => {
               setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
          };
          const nextMonth = () => {
               setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
          };
          const prevMonthDisabled =
               currentDate.getMonth() <= new Date().getMonth() &&
               currentDate.getFullYear() === new Date().getFullYear();
          const maxDate = new Date();
          maxDate.setMonth(maxDate.getMonth() + 11);
          const nextMonthDisabled = currentDate >= maxDate;

          return (
               <MonthControl>
                    <ArrowLayout $disabled={prevMonthDisabled} onClick={prevMonthDisabled ? null : prevMonth}>
                         {" "}
                         <Arrow
                              width={10}
                              height={20}
                              color={prevMonthDisabled ? theme.text.gamma[800] : "black"}
                              angle={180}
                         />{" "}
                    </ArrowLayout>
                    <Month>{monthLabel}</Month>
                    <ArrowLayout $disabled={nextMonthDisabled} onClick={nextMonthDisabled ? null : nextMonth}>
                         {" "}
                         <Arrow
                              width={10}
                              height={20}
                              color={nextMonthDisabled ? theme.text.gamma[800] : "black"}
                         />{" "}
                    </ArrowLayout>
               </MonthControl>
          );
     };

     const week = () => {
          const days = ["일", "월", "화", "수", "목", "금", "토"];
          return (
               <DaysRow>
                    {" "}
                    {days.map((day, index) => (
                         <Day key={index}>{day}</Day>
                    ))}{" "}
               </DaysRow>
          );
     };

     const cells = () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const startDate = new Date(monthStart);
          startDate.setDate(startDate.getDate() - startDate.getDay());
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          const rows = [];
          let days = [];
          while (startDate <= monthEnd || days.length % 7 !== 0) {
               for (let i = 0; i < 7; i++) {
                    const dateString = toYYYYMMDD(startDate);
                    const isPastDate = startDate < today;
                    const isSelected = selectedDates.includes(dateString);
                    const isDifferentMonth = startDate.getMonth() !== currentDate.getMonth();
                    days.push(
                         <Cell
                              key={dateString}
                              data-date={dateString}
                              data-disabled={isPastDate ? true : undefined}
                              onPointerDown={(e) => !isPastDate && handlePointerDown(e, dateString)}
                              whileHover={!isPastDate ? { scale: 1.05 } : {}}
                              whileTap={!isPastDate ? { scale: 0.95 } : {}}
                         >
                              <AnimatePresence>
                                   {isSelected && (
                                        <SelectedCircle
                                             layoutId={dateString}
                                             initial={{ scale: 0 }}
                                             animate={{ scale: 1 }}
                                             exit={{ scale: 0 }}
                                             transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                   )}
                              </AnimatePresence>
                              <DateNumber
                                   $isSelected={isSelected}
                                   $disabled={isPastDate}
                                   $isDifferentMonth={isDifferentMonth}
                              >
                                   {startDate.getDate()}
                              </DateNumber>
                         </Cell>
                    );
                    startDate.setDate(startDate.getDate() + 1);
               }
               rows.push(<Row key={startDate.getTime()}>{days}</Row>);
               days = [];
          }
          return <Body>{rows}</Body>;
     };

     const today = new Date();
     today.setHours(0, 0, 0, 0);
     const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
     const isSelectableMonth = lastDayOfMonth >= today;

     return (
          <CalendarWrapper>
               <Header>
                    {month()}
                    <SelectMonthButton onClick={handleSelectMonth} disabled={!isSelectableMonth}>
                         <FaPlusCircle />
                         이번 달 전체 선택
                    </SelectMonthButton>
               </Header>
               {week()}
               {cells()}
          </CalendarWrapper>
     );
}

const CalendarWrapper = styled.div`
     ${theme.styles.flexCenterColumn} width: 100%;
`;

const Header = styled.div`
     position: relative;
     width: 100%;
     margin-bottom: 20px;
     display: flex;
     align-items: center;

     @media (max-width: 480px) {
          flex-direction: column;
          gap: 12px;
     }
`;

const MonthControl = styled.div`
     display: flex;
     justify-content: center;
     align-items: center;
     gap: 20px;
     width: 100%;

     @media (max-width: 480px) {
          order: 1;
     }
`;

const Month = styled.div`
     font-size: 19px;
     font-family: Pretendard-Medium;
     @media (max-width: 480px) {
          font-size: 16px;
     }
`;

const SelectMonthButton = styled.button`
     display: flex;
     align-items: center;
     gap: 6px;
     background-color: ${theme.text.gamma[950]};
     border: 1px solid ${theme.text.gamma[900]};
     font-family: Pretendard-Medium;
     font-size: 13px;
     color: ${theme.text.gamma[500]};
     cursor: pointer;
     padding: 6px 10px;
     border-radius: 8px;
     transition: all 0.2s ease;

     svg {
          color: ${theme.text.gamma[600]};
          transition: color 0.2s ease;
     }

     &:hover:not(:disabled) {
          background-color: ${theme.color.primary}15;
          color: ${theme.color.primary};
          border-color: ${theme.color.primary}30;
          svg {
               color: ${theme.color.primary};
          }
     }

     &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
     }

     @media (min-width: 481px) {
          position: absolute;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
     }

     @media (max-width: 480px) {
          order: 2;
          width: 100%;
          justify-content: center;
          padding: 8px 10px;
     }
`;

const DaysRow = styled.div`
     display: grid;
     grid-template-columns: repeat(7, 1fr);
     gap: 10px;
     width: 100%;
     margin-bottom: 10px;
`;
const Day = styled.div`
     ${theme.styles.flexCenterRow} font-family: Pretendard-Medium;
     font-size: 14px;
     color: ${theme.text.gamma[600]};
`;
const Body = styled(motion.div)`
     display: flex;
     flex-direction: column;
     gap: 10px;
     width: 100%;
`;
const Row = styled.div`
     display: grid;
     grid-template-columns: repeat(7, 1fr);
     gap: 10px;
`;
const Cell = styled(motion.div)`
     ${theme.styles.flexCenterRow} position: relative;
     aspect-ratio: 1 / 1;
     border-radius: 50%;
     cursor: ${(props) => (props["data-disabled"] ? "not-allowed" : "pointer")};
     -webkit-tap-highlight-color: transparent;
     touch-action: none;
`;
const DateNumber = styled.span`
     position: relative;
     z-index: 2;
     font-family: Pretendard-Medium;
     font-size: 16px;
     color: ${(props) =>
          props.$isSelected
               ? "white"
               : props.$disabled
               ? theme.text.gamma[900]
               : props.$isDifferentMonth
               ? theme.text.gamma[700]
               : "black"};
     transition: color 0.2s ease-in-out;
     pointer-events: none;
`;
const SelectedCircle = styled(motion.div)`
     position: absolute;
     width: 100%;
     height: 100%;
     background-color: ${theme.color.primary};
     border-radius: 50%;
     z-index: 1;
     pointer-events: none;
`;
const ArrowLayout = styled.button`
     display: flex;
     align-items: center;
     justify-content: center;
     background: none;
     border: none;
     cursor: pointer;
     pointer-events: ${(props) => (props.$disabled ? "none" : "auto")};
     opacity: ${(props) => (props.$disabled ? 0.4 : 1)};
     svg {
          width: 8px;
          height: 16px;
     }
`;
