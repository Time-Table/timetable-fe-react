import { useState } from "react";
import styled from "@emotion/styled/macro";
import theme from "../../theme";
import Button from "../../component/Button";
import Input from "../../component/Input";
import Arrow from "../../assets/svg/Arrow";

export default function CreatePage2() {
  const [startDropdown, setStartDropdown] = useState(false);
  const [endDropdown, setEndDropdown] = useState(false);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("-- : --");
  const [isEndTimeClicked, setIsEndTimeClicked] = useState(0);
  const [tableTitle, setTableTitle] = useState("");

  const genStartTime = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:00`;
      times.push(time);
    }
    return times;
  };

  const genEndTime = () => {
    const times = [];
    for (let hour = 1; hour <= 24; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:00`;
      times.push(time);
    }
    return times;
  };
  const startTimeList = genStartTime();
  const endTimeList = genEndTime();

  const Time = () => {
    const startTimeSlot = () => {
      return (
        <TimeSlots isStart={true}>
          {startTimeList.map((time, index) => {
            return (
              <TimeSlotDiv
                key={index}
                onClick={() => {
                  if (time.split(":")[0] < endTime.split(":")[0]) {
                    setStartTime(time);
                  } else {
                    setStartTime(time);
                    if (index + 1 < startTimeList.length) {
                      setEndTime(startTimeList[index + 1]);
                    } else {
                      setEndTime(endTimeList[index]);
                    }
                  }
                  setIsEndTimeClicked(isEndTimeClicked + 1);
                  setStartDropdown(false);
                }}
              >
                {time}
              </TimeSlotDiv>
            );
          })}
        </TimeSlots>
      );
    };

    const endTimeSlot = () => {
      return (
        <TimeSlots isStart={false}>
          {endTimeList.map((time, index) => {
            return (
              <TimeSlotDiv
                key={index}
                onClick={() => {
                  if (time.split(":")[0] > startTime.split(":")[0]) {
                    setEndTime(time);
                  } else {
                    setEndTime(time);
                    if (index - 1 >= 0) {
                      setStartTime(endTimeList[index - 1]);
                    } else {
                      setStartTime(startTimeList[index]);
                    }
                  }
                  setIsEndTimeClicked(isEndTimeClicked + 1);
                  setEndDropdown(false);
                }}
              >
                {time}
              </TimeSlotDiv>
            );
          })}
        </TimeSlots>
      );
    };

    const handleStartTime = () => {
      setStartDropdown(!startDropdown);
    };

    const handleEndTime = () => {
      setEndDropdown(!endDropdown);
    };
    console.log(isEndTimeClicked);

    return (
      <TimeLayout>
        <Button
          width="80px"
          height="40px"
          title={startTime}
          fontFamily="Pretendard-Medium"
          onClick={handleStartTime}
          StyleButton={{ letterSpacing: "0.07em" }}
        />
        {startDropdown ? startTimeSlot() : null}
        부터
        <Button
          width="80px"
          height="40px"
          title={endTime}
          fontFamily="Pretendard-Medium"
          onClick={handleEndTime}
          StyleButton={{ letterSpacing: "0.07em" }}
        />
        {endDropdown ? endTimeSlot() : null}
        까지
      </TimeLayout>
    );
  };
  return (
    <CreatePageDiv>
      <ContentDiv>
        <Question2Div>
          <div style={{ width: "100%" }}>
            <ArrowLayout onClick={() => (window.location.href = "/")}>
              <Arrow width={10} height={20} isLeft={true} />
            </ArrowLayout>
          </div>
          <Q>Q2.</Q>
          <Title>시간은 언제가 좋을까요?</Title>
          {Time()}
        </Question2Div>
        <Question3Div fadeIn={isEndTimeClicked}>
          <Q>Q3.</Q>
          <Title>모임의 주제는 무엇인가요?</Title>
          <InputLayout>
            <Input
              maxLength={25}
              onChange={(e) => {
                setTableTitle(e.target.value);
              }}
              placeholder={"ex: 공학설계입문 2조 회의 시간"}
              value={tableTitle}
            />
          </InputLayout>
        </Question3Div>
        <ButtonLayout>
          <ButtonDiv>
            <Button
              disabled={!tableTitle ? true : false}
              onClick={() => {
                console.log(
                  "text: ",
                  tableTitle,
                  "\nstartTime: ",
                  startTime,
                  "\nendTime: ",
                  endTime
                );
                window.location.href = "/CreatePage3";
              }}
            />
          </ButtonDiv>
        </ButtonLayout>
      </ContentDiv>
    </CreatePageDiv>
  );
}

const CreatePageDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
`;

const Question2Div = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 30px;
  opacity: 0;
  transform: translateY(-30px);
  animation: fadeIn 1.2s ease-in-out forwards;
  z-index: 2;

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
const Question3Div = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 30px;
  opacity: ${(props) => (props.fadeIn > 0 ? 1 : 0)};
  transform: ${(props) => (props.fadeIn > 0 ? "translateY(0)" : "translateY(-30px)")};
  transition: opacity 1s ease-in-out, transform 1.2s ease-in-out;
  z-index: 1;
`;

const ContentDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 90px;
  margin: 50px 0;
  width: 510px;

  @media (max-width: 480px) {
    width: 380px;
  }
`;

const ButtonLayout = styled.div`
  width: 100%;
  display: flex;
  justify-content: end;
  align-items: center;
  margin-top: 105px;

  @media (max-width: 480px) {
    width: 346px;
  }
`;

const ButtonDiv = styled.div`
  display: flex;
  width: 160px;
  height: 56px;
  button {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    width: 100%;
    height: 50px;
    button {
      font-size: 16px;
    }
  }
`;

const Q = styled.span`
  font-family: "Pretendard-SemiBold";
  font-size: 28px;
  color: ${theme.color.primary};

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const Title = styled.span`
  font-family: "Pretendard-SemiBold";
  font-size: 32px;

  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const InputLayout = styled.div`
  width: 352px;
  @media (max-width: 480px) {
    width: 300px;
  }
`;

const TimeSlots = styled.div`
  flex-direction: column;
  display: flex;
  align-items: center;
  position: absolute;
  top: 110%;
  left: ${(props) => (props.isStart ? "1.5%" : "53%")};
  font-family: Pretendard-Light;
  width: 80px;
  background-color: white;
  border: 2px solid ${theme.text.gamma[500]};
  border-radius: 10px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  gap: 5px;
  max-height: 230px;
  overflow-y: auto;

  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; //IE and Edge
  scrollbar-width: none; //Firefox

  @media (max-width: 480px) {
    width: 75px;
    gap: 3px;
    max-height: 210px;
    left: ${(props) => (props.isStart ? "3%" : "52%")};
  }
`;

const TimeSlotDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
  padding: 0.2rem;
  font-family: Pretendard-Regular;
  font-size: 20px;
  letter-spacing: 0.05em;

  &:hover {
    background-color: ${theme.color.primary};
    color: white;
  }

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const TimeLayout = styled.div`
  position: relative;
  ${theme.styles.flexCenterRow}
  font-family: Pretendard-Light;
  font-size: 22px;
  width: 100%;
  gap: 20px;

  button {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
    gap: 10px;

    button {
      font-size: 18px;
    }
  }
`;

const ArrowLayout = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
`;
