import { useState } from "react";
import TimeGrid from "../../../../component/TimeGrid";
import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";

export default function MySchedule({ dates, startHour, endHour }) {
  const [selectedCells, setSelectedCells] = useState([]);

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
          <Button title="저장" />
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
