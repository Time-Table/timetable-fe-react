import theme from "../../../../theme";
import styled from "@emotion/styled/macro";
import TimeGridViewMode from "../../../../component/TimeGridViewMode ";
import Refresh from "../../../../assets/svg/Refresh.jpg";
import { getTableInfo } from "../../../../api/Use/getTableInfo";
import Swal from "sweetalert2";

export default function AllTimeGrid({
  banedCells,
  title,
  dates,
  startHour,
  endHour,
  timeInfo,
  selectedName,
  setTableInfo,
  tableId,
}) {
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
  return (
    <>
      <TitleFrame>
        <TitleDiv>{title}</TitleDiv>
        <TitleDiv color={theme.color.primary}>타임테이블</TitleDiv>
      </TitleFrame>

      <ContentFrame>
        <div style={{ display: "flex", width: "100%" }}>
          <div style={{ flex: 1 }} />
          <NoteText>{selectedName ? selectedName + " 님의" : "전체"} 테이블</NoteText>
          <ButtonBox
            onClick={async () => {
              const res = await getTableInfo(tableId);
              console.log(res);
              if (res._id) {
                setTableInfo(res);
              } else {
                await Toast.fire({
                  icon: "error",
                  iconColor: `${theme.color.primary}`,
                  title: "데이터를 가져오는 중 오류 발생",
                });
              }
            }}
          >
            <img src={Refresh} />
          </ButtonBox>
        </div>

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
  text-align: center;
  font-size: 25px;
  color: ${theme.text.gamma[500]};
  flex: 3;
`;

const ButtonBox = styled.button`
  ${theme.styles.flexCenterRow}
  background: none;
  border: none;
  flex: 1;
`;
