import { useState, useEffect } from "react";
import TimeGrid from "../../../../component/TimeGrid";
import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";
import Swal from "sweetalert2";

export default function MySchedule({ dates, startHour, endHour, setRightScreen }) {
  const [selectedCells, setSelectedCells] = useState([]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem("name");
    if (!name) {
      Swal.fire({
        title: "정보를 먼저 입력해주세요!",
        text: "정보를 등록하고 일정을 추가해보세요.",
        icon: "question",
        confirmButtonText: "확인",
        confirmButtonColor: `${theme.color.primary}`,
      });
      setRightScreen("AddUser");
    }
  }, []);

  useEffect(() => {
    if (selectedCells.length > 0) {
      setIsButtonDisabled(false);
    }
  }, [selectedCells]);

  const handleButtonClick = () => {
    if (selectedCells.length > 0) {
      // 내정보 저장 api 연결
      Swal.fire({
        icon: "success",
        iconColor: `${theme.color.primary}`,
        title: "저장되었습니다!",

        showConfirmButton: false,
        timer: 1000,
      });
      setIsButtonDisabled(true);
    }
  };

  return (
    <>
      <NoteText>나의 가능한 시간대</NoteText>
      <TimeGrid
        dates={dates}
        startHour={startHour}
        endHour={endHour}
        selectedCells={selectedCells}
        selectedCellColor={theme.color.primaryTint}
        setSelectedCells={setSelectedCells}
        isViewMode={false}
      />
      <ButtonLayout>
        <ButtonDiv>
          <Button onClick={handleButtonClick} disabled={isButtonDisabled} title="저장" />
        </ButtonDiv>
      </ButtonLayout>
    </>
  );
}

const ButtonLayout = styled.div`
  ${theme.styles.flexCenterRow}
  justify-content: flex-end;
  width: 490px;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const ButtonDiv = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 160px;
  height: 56px;
  button {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    width: 140px;
    height: 50px;
    button {
      font-size: 16px;
    }
  }
`;

const NoteText = styled.span`
  font-family: Pretendard-ExtraLight;
  font-size: 24px;
  color: ${theme.text.gamma[500]};
`;
