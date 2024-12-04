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
        <NoteText>모든 참여자가 선택한 시간대</NoteText>
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
  font-size: 32px;
  color: ${(props) => props.color};

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const NoteText = styled.span`
  font-family: Pretendard-ExtraLight;
  font-size: 24px;
  color: ${theme.text.gamma[500]};
`;
