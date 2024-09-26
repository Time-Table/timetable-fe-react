import { useState, useEffect } from "react";
import TimeGrid from "../../../../component/TimeGrid";
import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";

export default function MySchedule({ dates, startHour, endHour }) {
  const [selectedCells, setSelectedCells] = useState([]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  useEffect(() => {
    if (selectedCells.length > 0) {
      setIsButtonDisabled(false);
    }
  }, [selectedCells]);

  const handleButtonClick = () => {
    if (selectedCells.length > 0) {
      // 내정보 저장 api 연결
    }
    setIsButtonDisabled(true);
  };

  return (
    <>
      <TimeGrid
        dates={dates}
        startHour={startHour}
        endHour={endHour}
        selectedCells={selectedCells}
        setSelectedCells={setSelectedCells}
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
