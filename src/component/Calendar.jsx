import React, { useState } from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Arrow from "../assets/svg/Arrow";

export default function Calendar({ selectedDates, setSelectedDates }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 11);

  const month = () => {
    const month = currentDate.toLocaleDateString("ko-KR", {
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
        <Month>{month}</Month>
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
        {days.map((day, index) => {
          return <Day key={index}>{day}</Day>;
        })}
      </DaysRow>
    );
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

    const onDateClick = (day) => {
      if (selectedDates.includes(day)) {
        const newDates = selectedDates.filter((date) => date !== day);
        setSelectedDates(newDates);
      } else {
        const newDates = [...selectedDates, day];
        setSelectedDates(newDates);
      }
    };

    while (startDate <= monthEnd) {
      for (let i = 0; i < 7; i++) {
        const dateString = startDate.toDateString();
        const isPastDate = startDate < today && startDate.toDateString() !== today.toDateString();
        const isSelected = selectedDates.includes(dateString);

        days.push(
          <Cell
            className={`${startDate.getMonth() !== currentDate.getMonth() ? "disabled" : ""} ${
              isPastDate ? "disabled" : ""
            }`}
            key={startDate}
            onClick={!isPastDate ? () => onDateClick(dateString) : null}
            isSelected={isSelected}
          >
            <span>{startDate.getDate()}</span>
          </Cell>
        );
        startDate.setDate(startDate.getDate() + 1);
      }
      rows.push(<Row key={startDate}>{days}</Row>);
      days = [];
    }

    return <Body>{rows}</Body>;
  };

  return (
    <CalendarWrapper>
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
  gap: 27px;
`;

const Month = styled.div`
  font-size: 22px;
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
  gap: 20px;
  @media (max-width: 480px) {
    gap: 11px;
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  @media (max-width: 480px) {
    gap: 11px;
  }
`;

const Day = styled.div`
  ${theme.styles.flexCenterRow}
  width: 49px;
  height: 52px;
  font-family: Pretendard-Medium;
  font-size: 22px;

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
`;

const Cell = styled.div`
  ${theme.styles.flexCenterRow}
  width: 48px;
  height: 53px;
  font-size: 20px;
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
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 480px) {
    gap: 11px;
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
