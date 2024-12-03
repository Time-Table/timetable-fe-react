import { useState, useEffect } from "react";
import TimeGrid from "../../../../component/TimeGrid";
import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";
import Swal from "sweetalert2";
import { addSchedule } from "../../../../api/Use/addSchedule";

export default function MySchedule({
  saveButtonState,
  setSaveButtonState,
  dates,
  startHour,
  endHour,
  setRightScreen,
  tableId,
  selectedCells,
  setSelectedCells,
  usersSchedule,
}) {
  const name = localStorage.getItem("name");
  useEffect(() => {
    if (!name) {
      Swal.fire({
        title: "정보를 먼저 입력해주세요!",
        text: "정보를 입력하고 일정을 추가해보세요.",
        icon: "question",
        confirmButtonText: "확인",
        confirmButtonColor: `${theme.color.primary}`,
      });
      setRightScreen("AddUser");
      return;
    }

    const userSchedule = () => {
      const userSchedule = usersSchedule.find((user) => user.name === name);

      if (!userSchedule) {
        console.warn("해당 이름의 유저를 찾을 수 없습니다:", name);
        return;
      }

      if (userSchedule.availableTimes) {
        setSelectedCells(userSchedule.availableTimes);
      }
    };

    userSchedule();
  }, [name, usersSchedule]);

  useEffect(() => {
    if (selectedCells.length > 0) {
      setSaveButtonState(false);
    }
  }, [selectedCells]);

  const handleButtonClick = async () => {
    if (selectedCells.length > 0) {
      const name = localStorage.getItem("name");

      if (!tableId || !name) {
        Swal.fire({
          icon: "success",
          iconColor: `${theme.color.primary}`,
          title: "로그인 정보가 누락되었습니다.",
          showConfirmButton: false,
          timer: 1500,
        });
        return;
      }

      await addSchedule(tableId, name, selectedCells);

      Swal.fire({
        icon: "success",
        iconColor: `${theme.color.primary}`,
        title: "저장되었습니다!",

        showConfirmButton: false,
        timer: 1500,
      });
      setSaveButtonState(true);
    }
  };

  return (
    <>
      <NoteText>내가 선택한 시간대</NoteText>
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
          <Button onClick={handleButtonClick} disabled={saveButtonState} title="저장" />
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
