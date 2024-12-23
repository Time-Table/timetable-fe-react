import { useState } from "react";
import styled from "@emotion/styled/macro";
import theme from "../../theme";
import Button from "../../component/Button";
import TimeGrid from "../../component/TimeGrid";
import Arrow from "../../assets/svg/Arrow";
import Swal from "sweetalert2";
import { createTable } from "../../api/Create/createTable";
import Help from "../../assets/svg/Help";
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
    return dateList;
  };

  const onClickEvent = async () => {
    const res = await createTable(tableTitle, formattedDates(), startHour, endHour, selectedCells);
    const tableId = res.data.tableId;
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
    if (res.code === 200) {
      await Toast.fire({
        icon: "success",
        iconColor: `${theme.color.primary}`,
        title: "타임테이블을 생성하고 있습니다..",
      });
      localStorage.clear();
      window.location.href = `/table/${tableId}`;
    } else {
      Swal.fire({
        icon: "error",
        title: "알 수 없는 오류입니다.",
        text: "잠시 후 다시 시도해 주세요.",
      });
    }
  };

  return (
    <CreatePageDiv>
      <ContentDiv>
        <ArrowLayout
          onClick={() => {
            onBack(startHour, endHour, tableTitle, endTimeClicked);
          }}
        >
          <Arrow width={10} height={20} angle={180} />
        </ArrowLayout>
        <QuestionDiv>
          <div style={{ width: "100%" }}></div>
          <Q>Q4.(선택 사항)</Q>
          <TitleLayout>
            <Title>
              제한할 시간을 선택하세요.{" "}
              <button
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                }}
                onClick={() => {
                  Swal.fire({
                    icon: "info",
                    iconColor: `${theme.color.primary}`,
                    title: "제한할 시간대란?",
                    html: "회원님이 선택하신 날짜에서 유저들이 선택할 수 없는 시간을 만듭니다. <br/>사용 예시: 공통적으로 참여 못하는 시간, 개인 용무 시간 등",
                    confirmButtonText: "메일 복사",
                    confirmButtonColor: `${theme.color.button.blue}`,
                    showCancelButton: true,
                    cancelButtonText: "취소",
                    cancelButtonColor: `${theme.text.gamma[800]}`,
                  });
                }}
              >
                <Help width={25} height={25} />
              </button>{" "}
            </Title>
            <SubTitle>* 각 셀의 한 칸은 30 분입니다.</SubTitle>
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
`;

const QuestionDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 6px;
`;

const ContentDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 30px;
  padding-top: 20px;
  padding-bottom: 10px;
  width: 486px;
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
    justify-content: center;
    width: 85%;
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
  font-size: 24px;
  color: ${theme.color.primary};
  @media (max-width: 480px) {
    font-size: 22px;
  }
`;

const Title = styled.span`
  font-family: "Pretendard-SemiBold";
  font-size: 25px;
  color: ${theme.text.gamma[500]};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-left: 20px;
  @media (max-width: 480px) {
    font-size: 22px;
  }
`;

const SubTitle = styled.span`
  font-family: "Pretendard-Medium";
  font-size: 18px;
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
  width: 90%;
  align-items: center;
  justify-content: flex-start;
  background: none;
  border: none;
  cursor: pointer;
`;
