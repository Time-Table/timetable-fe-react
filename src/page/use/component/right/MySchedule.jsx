import { useEffect, useState } from "react";
import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";
import TimeGrid from "../../../../component/TimeGrid";
import Swal from "sweetalert2";
import { addSchedule } from "../../../../api/schedule";
import Loader from "../Loading";
import { AnimatePresence, motion } from "framer-motion";

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
}) {
     const [isLoading, setIsLoading] = useState(true);
     const name = localStorage.getItem("name");
     const userScheduleInfo = usersScheduleList.find((user) => user.name === name);
     const [selectedCells, setSelectedCells] = useState([]);

     const areArraysEqual = (arr1, arr2) =>
          arr1.length === arr2.length &&
          arr1.every((value) => arr2.includes(value)) &&
          arr2.every((value) => arr1.includes(value));

     useEffect(() => {
          if (!name) {
               setIsLoading(false);
               return;
          }

          if (userScheduleInfo?.availableTimes) {
               setSelectedCells([...userScheduleInfo.availableTimes]);
          }
          setIsLoading(false);
     }, [name, userScheduleInfo]);

     const handleSave = async () => {
          if (!tableId || !name) {
               Swal.fire({ icon: "error", title: "로그인 정보가 없습니다." });
               return;
          }
          if (areArraysEqual(userScheduleInfo?.availableTimes || [], selectedCells)) {
               Swal.fire({ icon: "info", title: "변경사항이 없습니다." });
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
          return <Loader />;
     }

     if (!name) {
          return (
               <EmptyState>
                    <p>일정을 수정하려면 먼저 참여해주세요.</p>
                    <Button title="참여하러 가기" onClick={() => setRightScreen("AddUser")} width="200px" />
               </EmptyState>
          );
     }

     return (
          <AnimatePresence>
               <Frame initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <HeaderWrapper>
                         <NoteText>
                              <span style={{ color: theme.color.primary, fontFamily: "Pretendard-Bold" }}>{name}</span>{" "}
                              님의 가능한 시간을 선택해주세요.
                         </NoteText>
                    </HeaderWrapper>
                    <SaveButton
                         onClick={handleSave}
                         disabled={areArraysEqual(userScheduleInfo?.availableTimes || [], selectedCells)}
                    >
                         저장하기
                    </SaveButton>
                    <TimeGrid
                         dates={dates}
                         startHour={startHour}
                         endHour={endHour}
                         selectedCells={selectedCells}
                         selectedCellColor={theme.color.primaryTint}
                         setSelectedCells={setSelectedCells}
                         banedCells={banedCells}
                    />
                    <SaveButton
                         onClick={handleSave}
                         disabled={areArraysEqual(userScheduleInfo?.availableTimes || [], selectedCells)}
                    >
                         저장하기
                    </SaveButton>
               </Frame>
          </AnimatePresence>
     );
}

const Frame = styled(motion.div)`
     width: 100%;
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: 20px;
`;

const HeaderWrapper = styled.div`
     width: 100%;
     display: flex;
     justify-content: space-between;
     align-items: center;
     flex-wrap: wrap;
     gap: 16px;
`;

const NoteText = styled.p`
     font-family: Pretendard-Regular;
     font-size: 20px;
     color: ${theme.text.gamma[400]};
     margin: 0;
     text-align: left;
     flex-grow: 1;

     @media (max-width: 480px) {
          font-size: 18px;
          width: 100%;
     }
`;

const EmptyState = styled.div`
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     gap: 20px;
     padding: 40px;
     text-align: center;
     font-size: 18px;
     color: ${theme.text.gamma[500]};
`;

const SaveButton = styled.button`
     width: 100%;
     max-width: 300px; /* Adjust as needed */
     height: 52px;
     background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
     color: white;
     font-family: "Pretendard-Bold";
     font-size: 18px;
     border: none;
     border-radius: 12px;
     cursor: pointer;
     transition: all 0.3s ease;
     box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

     &:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
     }

     &:disabled {
          background: ${theme.color.button.neutral[100]};
          color: ${theme.color.button.neutral[300]};
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
     }
`;