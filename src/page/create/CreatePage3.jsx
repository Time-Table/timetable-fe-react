import { useState } from "react";
import styled from "@emotion/styled/macro";
import theme from "../../theme";
import Button from "../../component/Button";
import TimeGrid from "../../component/TimeGrid";
import Arrow from "../../assets/svg/Arrow";

const MOCKDATA = {
  dates: [
    "Mon Sep 23 2024",
    "Tue Sep 24 2024",
    "Wed Sep 25 2024",
    "Thu Oct 10 2024",
    "Fri Nov 15 2024",
    "Sat Dec 20 2024",
    "Sun Jan 05 2025",
    "Mon Feb 10 2025",
    "Tue Mar 11 2025",
    "Wed Apr 23 2025",
    "Thu May 30 2025",
    "Fri Jun 13 2025",
    "Sat Jul 19 2025",
  ],
  startHour: "00:00",
  endHour: "10:00",
  tableTitle: "공학설계입문 2조 회의 시간",
};

export default function CreatePage3() {
  const [selectedCells, setSelectedCells] = useState([]);

  const formattedDates = () => {
    const dates = [];
    MOCKDATA.dates.map((date) => {
      let formatteddate = new Date(date);
      formatteddate = formatteddate.toISOString().split("T")[0];
      dates.push(formatteddate);
    });
    return dates;
  };

  return (
    <CreatePageDiv>
      <ContentDiv>
        <QuestionDiv>
          <div style={{ width: "100%" }}>
            <ArrowLayout onClick={() => (window.location.href = "/createPage2")}>
              <Arrow width={10} height={20} isLeft={true} />
            </ArrowLayout>
          </div>
          <Q>Q4.</Q>
          <TitleLayout>
            <Title>선택 금지 시간을 만들까요? (선택 사항)</Title>
            <SubTitle>*제한할 시간구역을 드래그하거나 클릭해주세요.</SubTitle>
          </TitleLayout>
        </QuestionDiv>
        <TimeGrid
          dates={formattedDates()}
          startHour={MOCKDATA.startHour}
          endHour={MOCKDATA.endHour}
          selectedCells={selectedCells}
          setSelectedCells={setSelectedCells}
        />
        <ButtonLayout>
          <ButtonDiv>
            <Button
              title="완료"
              background={theme.color.button.blue}
              onClick={() => {
                console.log(selectedCells);
                window.location.href = "/use";
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
  margin: 5px;
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

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    width: 380px;
  }
`;

const ButtonLayout = styled.div`
  width: 100%;
  display: flex;
  justify-content: end;
  align-items: center;
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
    font-size: 22px;
  }
`;

const SubTitle = styled.span`
  font-family: "Pretendard-Medium";
  font-size: 25px;
  color: ${theme.text.gamma[500]};
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const TitleLayout = styled.span`
  ${theme.styles.flexCenterColumn}
`;

const ArrowLayout = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
`;