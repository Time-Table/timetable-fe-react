import { useState } from "react";
import styled from "@emotion/styled/macro";
import theme from "../../theme";
import Button from "../../component/Button";
import TimeGrid from "../../component/TimeGrid";
import Arrow from "../../assets/svg/Arrow";
import Swal from "sweetalert2";
import { createTable } from "../../api/Create/createTable";
export default function CreatePage3({
  startHour,
  endHour,
  dates,
  tableTitle,
  onBack,
  endTimeClicked,
}) {
  const [selectedCells, setSelectedCells] = useState([]);

  const formattedDates = () => {
    const dateList = [];
    dates.map((date) => {
      let formatteddate = new Date(date);
      formatteddate.setHours(formatteddate.getHours() + 9);
      formatteddate = formatteddate.toISOString().split("T")[0];
      dateList.push(formatteddate);
    });
    console.log(dateList);
    console.log(startHour, endHour);
    return dateList;
  };

  const onClickEvent = async () => {
    createTable(tableTitle, dates, startHour, endHour, selectedCells);

    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1200,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
    await Toast.fire({
      icon: "success",
      iconColor: `${theme.color.primary}`,
      title: "타임테이블을 생성하고 있습니다..",
    });

    localStorage.clear();
    // window.location.href = "/use";
  };

  return (
    <CreatePageDiv>
      <ContentDiv>
        <QuestionDiv>
          <div style={{ width: "100%" }}>
            <ArrowLayout
              onClick={() => {
                onBack(startHour, endHour, tableTitle, endTimeClicked);
              }}
            >
              <Arrow width={10} height={20} angle={180} />
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
          startHour={startHour}
          endHour={endHour}
          selectedCells={selectedCells}
          setSelectedCells={setSelectedCells}
          selectedCellColor={theme.color.primary}
        />
        <ButtonLayout>
          <ButtonDiv>
            <Button
              title="완료"
              background={theme.color.button.blue}
              onClick={() => {
                console.log(selectedCells);
                onClickEvent();
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
