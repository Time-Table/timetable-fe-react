import theme from "../../../../theme";
import styled from "@emotion/styled/macro";
import TimeGridViewMode from "../../../../component/TimeGridViewMode ";

export default function AllTimeGrid({
  banedCells,
  title,
  dates,
  startHour,
  endHour,
  timeInfo,
  selectedName,
}) {
  return (
    <>
      <TitleFrame>
        <TitleDiv>{title}</TitleDiv>
        <TitleDiv color={theme.color.primary}>타임테이블</TitleDiv>
      </TitleFrame>

      <ContentFrame>
        <NoteText>{selectedName ? selectedName + " 님의" : "전체"} 테이블</NoteText>
        <TimeGridViewMode
          dates={dates}
          startHour={startHour}
          endHour={endHour}
          isViewMode={true}
          timeInfo={timeInfo}
          selectedName={selectedName}
          banedCells={banedCells}
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
  gap: 30px;
  margin-top: 46px;
  ${theme.styles.flexCenterColumn}
`;

const TitleDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 90%;
  font-size: 32px;
  color: ${(props) => props.color};
  @media (max-width: 480px) {
    font-size: 24px;
    width: 80%;
  }
`;

const NoteText = styled.span`
  font-family: Pretendard-ExtraLight;
  font-size: 25px;
  color: ${theme.text.gamma[500]};
`;
