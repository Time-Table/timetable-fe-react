import { useState, useEffect } from "react";
import TimeGrid from "../../../../component/TimeGrid";
import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";
import Swal from "sweetalert2";
import { addSchedule } from "../../../../api/Use/addSchedule";
import Loader from "../Loading";

export default function MySchedule({
  setSaveButtonState,
  saveButtonState,
  dates,
  startHour,
  endHour,
  setRightScreen,
  tableId,
  usersScheduleList,
  banedCells,
  setSelectedToggle,
  setCurrentSlide,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const name = localStorage.getItem("name");
  const userScheduleInfo = usersScheduleList.find((user) => user.name === name);
  const [selectedCells, setSelectedCells] = useState([]);
  const areArraysEqual = (arr1, arr2) =>
    arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);

  useEffect(() => {
    if (!name) {
      Swal.fire({
        title: "로그인",
        text: "오른쪽으로 이동해 정보를 입력해 주세요.",
        icon: "question",
        confirmButtonText: "확인",
        confirmButtonColor: `${theme.color.primary}`,
      });
      setRightScreen("AddUser");
      setSelectedToggle("참여하기");
      setCurrentSlide(1);
      setIsLoading(false);
      return;
    }

    if (userScheduleInfo?.availableTimes && selectedCells.length === 0) {
      setSelectedCells([...userScheduleInfo.availableTimes]);
    }

    setIsLoading(false);
  }, [name, usersScheduleList, setRightScreen, setSelectedToggle, setSaveButtonState]);

  const handleButtonClick = async () => {
    if (!tableId || !name) {
      Swal.fire({
        icon: "error",
        iconColor: `${theme.color.primary}`,
        title: "로그인 정보가 누락되었습니다.",
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }

    if (areArraysEqual(userScheduleInfo?.availableTimes || [], selectedCells)) {
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

    setSaveButtonState(!saveButtonState);
  };

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <>
      <NoteText>{name} 님의 테이블</NoteText>
      <TimeGrid
        dates={dates}
        startHour={startHour}
        endHour={endHour}
        selectedCells={selectedCells}
        selectedCellColor={theme.color.primaryTint}
        setSelectedCells={setSelectedCells}
        isViewMode={false}
        banedCells={banedCells}
      />
      <ButtonLayout>
        <ButtonDiv>
          <Button
            onClick={handleButtonClick}
            title="저장"
            disabled={areArraysEqual(userScheduleInfo?.availableTimes || [], selectedCells)}
          />
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
