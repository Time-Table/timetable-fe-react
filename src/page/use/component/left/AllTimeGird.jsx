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
        <div style={{ fontSize: "32px" }}>{title}</div>
        <div style={{ fontSize: "32px", color: theme.color.primary }}>타임테이블</div>
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
