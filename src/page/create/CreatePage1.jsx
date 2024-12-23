import { useEffect, useState } from "react";
import styled from "@emotion/styled/macro";
import theme from "../../theme";
import Calendar from "../../component/Calendar";
import Button from "../../component/Button";
import Swal from "sweetalert2";

export default function CreatePage1({ onNext, dates }) {
  useEffect(() => {
    if (dates) {
      setSelectedDates(dates);
    }
  }, [dates]);

  const [selectedDates, setSelectedDates] = useState([]);
  return (
    <CreatePageDiv>
      <ContentDiv>
        <AboutDiv
          onClick={() => {
            Swal.fire({
              icon: "question",
              iconColor: `${theme.text.gamma[800]}`,
              title: "사이트 정보",
              text: "우리 사이트는 단체나 모임(스터디, 팀플, 회식 등) 행사의 수요 인원과 최적의 시간을 파악할 수 있도록 도와줍니다.",
              confirmButtonText: "자세히 보기",
              confirmButtonColor: `${theme.color.primary}`,
              showCancelButton: true,
              cancelButtonText: "취소",
              cancelButtonColor: `${theme.text.gamma[800]}`,
              preConfirm: () => (window.location.href = "/about"),
            });
          }}
        >
          *어떤 사이트인지 궁금하신가요 ?
        </AboutDiv>

        <QuestionDiv>
          <Q>Q1.</Q>
          <Title>언제 만나시나요?</Title>
        </QuestionDiv>
        <CalendarLayout>
          <Calendar selectedDates={selectedDates} setSelectedDates={setSelectedDates} />
        </CalendarLayout>
        <ButtonLayout>
          <ButtonDiv>
            <Button
              disabled={selectedDates.length === 0 ? true : false}
              onClick={() => {
                onNext(selectedDates);
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

const QuestionDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 12px;
`;
const ContentDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 40px;
  margin: 50px 0;
  width: 510px;
  opacity: 0;
  transform: translateY(-30px);
  animation: fadeIn 1.2s ease-in-out forwards;

  @media (max-width: 480px) {
    width: 380px;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const CalendarLayout = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
`;

const ButtonLayout = styled.div`
  /* height: 3rem; */
  width: 100%;
  display: flex;
  justify-content: end;
  align-items: center;
  @media (max-width: 480px) {
    width: 320px;
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

const AboutDiv = styled.div`
  color: ${theme.color.primary};
  font-size: 15px;
  text-decoration: underline;
  cursor: pointer;
`;
