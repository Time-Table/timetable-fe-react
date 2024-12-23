import { useEffect, useState } from "react";
import styled from "@emotion/styled/macro";
import theme from "../../theme";
import Button from "../../component/Button";
import Input from "../../component/Input";
import Arrow from "../../assets/svg/Arrow";
import Swal from "sweetalert2";

export default function CreatePage2({
  onNext,
  onBack,
  startHour,
  endHour,
  tableTitle,
  endTimeClicked,
  dates,
}) {
  const [startDropdown, setStartDropdown] = useState(false);
  const [endDropdown, setEndDropdown] = useState(false);
  const [sHour, setSHour] = useState("00:00");
  const [eHour, setEHour] = useState("-- : --");
  const [isEndTimeClicked, setIsEndTimeClicked] = useState(0);
  const [title, setTitle] = useState("");
  const Toast = Swal.mixin({
    toast: true,
    showConfirmButton: false,
    timer: 2000,
    padding: "1.5em",
  });

  useEffect(() => {
    const preTitle = localStorage.getItem("title");
    if (startHour && endHour && tableTitle && dates && endTimeClicked) {
      setSHour(startHour);
      setEHour(endHour);
      setTitle(tableTitle);
      setIsEndTimeClicked(endTimeClicked);
    }
    if (localStorage.getItem("title")) {
      setTitle(preTitle);
    }
  }, [sHour && eHour && title && dates && endTimeClicked]);

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
                  if (time.split(":")[0] < eHour.split(":")[0]) {
                    setSHour(time);
                  } else {
                    setSHour(time);
                    if (index + 1 < startTimeList.length) {
                      setEHour(startTimeList[index + 1]);
                    } else {
                      setEHour(endTimeList[index]);
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
                  if (time.split(":")[0] > sHour.split(":")[0]) {
                    setEHour(time);
                  } else {
                    setEHour(time);
                    if (index - 1 >= 0) {
                      setSHour(endTimeList[index - 1]);
                    } else {
                      setSHour(startTimeList[index]);
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

    return (
      <TimeLayout>
        <Button
          width="80px"
          height="40px"
          title={sHour}
          fontFamily="Pretendard-Medium"
          onClick={handleStartTime}
          StyleButton={{ letterSpacing: "0.07em" }}
        />
        {startDropdown ? startTimeSlot() : null}
        부터
        <Button
          width="80px"
          height="40px"
          title={eHour}
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
        <div style={{ width: "100%" }}>
          <ArrowLayout
            onClick={() => {
              onBack(dates);
            }}
          >
            <Arrow width={10} height={20} angle={180} />
          </ArrowLayout>
        </div>{" "}
        <Question2Div>
          <Q>Q2.</Q>
          <Title>시간은 언제가 좋을까요?</Title>
          {Time()}
        </Question2Div>
        <Question3Div fadeIn={isEndTimeClicked}>
          <Q>Q3.</Q>
          <Title>모임의 주제는 무엇인가요?</Title>
          <InputLayout>
            <Input
              maxLength={50}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.length >= 50) {
                  Toast.fire({
                    icon: "error",
                    iconColor: `${theme.color.primary}`,
                    title: "최대 50 자까지 입력 가능합니다.",
                  });
                }
              }}
              placeholder={"ex: 공학설계 2조 회의 시간"}
              value={title}
            />
          </InputLayout>
        </Question3Div>
        <ButtonLayout>
          <ButtonDiv>
            <Button
              disabled={!title ? true : false}
              onClick={() => {
                onNext(sHour, eHour, title, isEndTimeClicked);
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
  gap: 20px;
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
  gap: 20px;
  opacity: ${(props) => (props.fadeIn > 0 ? 1 : 0)};
  transform: ${(props) => (props.fadeIn > 0 ? "translateY(0)" : "translateY(-30px)")};
  transition: opacity 1s ease-in-out, transform 1.2s ease-in-out;
  z-index: 1;
`;

const ContentDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 40px;
  padding-top: 30px;
  padding-bottom: 65px;
  width: 360px;
  @media (max-width: 480px) {
    width: 90%;

    padding: 30px 0px;
  }
`;

const ButtonLayout = styled.div`
  width: 90%;
  margin-top: 40px;
  display: flex;
  justify-content: end;
  align-items: center;
  @media (max-width: 480px) {
    justify-content: center;
    width: 80%;
  }
`;

const ButtonDiv = styled.div`
  display: flex;
  width: 140px;
  height: 52px;
  button {
    font-size: 18px;
  }

  @media (max-width: 480px) {
    width: 100%;
    height: 50px;
    button {
      font-size: 18px;
    }
  }
`;

const Q = styled.span`
  font-family: "Pretendard-SemiBold";
  font-size: 24px;
  color: ${theme.color.primary};
`;

const Title = styled.span`
  font-family: "Pretendard-SemiBold";
  font-size: 26px;

  @media (max-width: 480px) {
    font-size: 22px;
  }
`;

const InputLayout = styled.div`
  width: 300px;
  @media (max-width: 480px) {
    width: 80%;
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
  letter-spacing: 0.05em;

  &:hover {
    background-color: ${theme.color.primary};
    color: white;
  }
`;

const TimeLayout = styled.div`
  position: relative;
  ${theme.styles.flexCenterRow}
  font-family: Pretendard-Light;
  font-size: 20px;
  width: 100%;
  gap: 15px;

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
