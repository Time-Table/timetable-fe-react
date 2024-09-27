import { useState } from "react";
import TimeGrid from "../../../../component/TimeGrid";
import theme from "../../../../theme";
import styled from "@emotion/styled/macro";
import { MOCKDATA } from "../../MOCKDATA";
import TimeGridViewMode from "../../../../component/TimeGridViewMode ";

export default function AllTimeGrid({ dates, startHour, endHour }) {
  const [selectedCells, setSelectedCells] = useState([]);
  const title = MOCKDATA.title;

  return (
    <>
      <TitleFrame>
        <TitleDiv>{title}</TitleDiv>
        <TitleDiv color={theme.color.primary}>타임테이블</TitleDiv>
      </TitleFrame>
      <ContentFrame>
        <TimeGridViewMode
          dates={dates}
          startHour={startHour}
          endHour={endHour}
          selectedCells={selectedCells}
          isViewMode={true}
        />
      </ContentFrame>
    </>
  );
}

const TitleFrame = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
`;

const ContentFrame = styled.div`
  margin-top: 46px;
  ${theme.styles.flexCenterColumn}
`;

const TitleDiv = styled.div`
  font-size: 32px;
  color: ${(props) => props.color};

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;
