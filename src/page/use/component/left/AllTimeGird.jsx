import theme from "../../../../theme";
import styled from "@emotion/styled/macro";
import TimeGridViewMode from "../../../../component/TimeGridViewMode ";
import { getTableInfo } from "../../../../api/Use/getTableInfo";
import Swal from "sweetalert2";
import { LuRefreshCw } from "react-icons/lu";
import { keyframes } from "@emotion/react";
import { useState } from "react";

export default function AllTimeGrid({
     banedCells,
     title,
     dates,
     startHour,
     endHour,
     timeInfo,
     selectedName,
     setSelectedName,
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

     const [isRotating, setIsRotating] = useState(false);
     const handleClick = () => {
          setIsRotating(true);
          setTimeout(() => setIsRotating(false), 1000);
     };

     return (
          <Frame>
               <TitleFrame>
                    <TitleDiv>{title}</TitleDiv>
                    <TitleDiv color={theme.color.primary}>타임테이블</TitleDiv>
               </TitleFrame>

               <NoteHeader>
                    <div style={{ flex: 1 }} />
                    <NoteText>{selectedName ? `${selectedName} 님의` : "전체"} 테이블</NoteText>
                    <ButtonBox
                         className={isRotating ? "rotating" : ""}
                         onClick={async () => {
                              handleClick();
                              const res = await getTableInfo(tableId);
                              if (res._id) {
                                   setSelectedName(false);
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
                         <LuRefreshCw size={25} color={theme.text.gamma[800]} />
                    </ButtonBox>
               </NoteHeader>

               <TimeGridViewMode
                    dates={dates}
                    startHour={startHour}
                    endHour={endHour}
                    isViewMode={true}
                    timeInfo={timeInfo}
                    selectedName={selectedName}
                    banedCells={banedCells}
               />
          </Frame>
     );
}

const Frame = styled.div`
     width: 100%;
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: 30px;
`;

const TitleFrame = styled.div`
     ${theme.styles.flexCenterColumn}
     font-family: Pretendard-SemiBold;
     width: 100%;
`;

const TitleDiv = styled.div`
     ${theme.styles.flexCenterColumn}
     width: 100%;
     font-size: 32px;
     color: ${(props) => props.color};
     @media (max-width: 480px) {
          font-size: 24px;
     }
`;

const NoteHeader = styled.div`
     display: flex;
     width: 100%;
     align-items: center;
     justify-content: center;
     margin-top: 39px;
`;

const NoteText = styled.span`
     font-family: Pretendard-ExtraLight;
     text-align: center;
     font-size: 25px;
     color: ${theme.text.gamma[500]};
     flex: 3;
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(180deg);
  }
`;

const ButtonBox = styled.button`
     ${theme.styles.flexCenterRow}
     background: none;
     border: none;
     flex: 1;
     cursor: pointer;
     transition: all 0.3s ease;

     &.rotating {
          animation: ${rotate} 0.5s linear infinite;
     }
`;
