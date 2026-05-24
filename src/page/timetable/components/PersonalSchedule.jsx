import { useEffect, useState } from "react";
import styled from "@emotion/styled/macro";
import theme from "../../../theme";
import Button from "../../../component/Button";
import TimeGrid from "../../../component/TimeGrid";
import Swal from "sweetalert2";
import { addSchedule } from "../../../api/schedule";
import Loader from "./Loading";
import { AnimatePresence, motion } from "framer-motion";
import { FiGrid } from "react-icons/fi";

export default function PersonalSchedule({
     setSaveButtonState,
     saveButtonState,
     dates,
     startHour,
     endHour,
     setRightScreen,
     tableId,
     usersScheduleList,
     banedCells,
     bgTimeInfo,
     onSaveSuccess,
     onViewTimetable,
}) {
     const [isLoading, setIsLoading] = useState(true);
     const [isSaving, setIsSaving] = useState(false);
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
          if (isSaving) return;
          if (!tableId || !name) {
               Swal.fire({ icon: "error", title: "로그인 정보가 없습니다." });
               return;
          }
          if (areArraysEqual(userScheduleInfo?.availableTimes || [], selectedCells)) {
               Swal.fire({ icon: "info", title: "변경사항이 없습니다." });
               return;
          }
          setIsSaving(true);
          try {
               await addSchedule(tableId, name, selectedCells);
               Swal.fire({
                    icon: "success",
                    iconColor: `${theme.color.primary}`,
                    title: "저장되었습니다!",
                    showConfirmButton: false,
                    timer: 900,
               });
               if (onSaveSuccess) {
                    onSaveSuccess();
               } else {
                    setSaveButtonState(!saveButtonState);
               }
          } catch {
               Swal.fire({ icon: "error", title: "저장에 실패했습니다.", text: "잠시 후 다시 시도해 주세요." });
          } finally {
               setIsSaving(false);
          }
     };

     if (isLoading) {
          return <Loader />;
     }

     if (!name) {
          return (
               <EmptyState>
                    <p>일정을 등록하려면 먼저 참여 정보가 필요합니다.</p>
                    <Button
                         title="참여 정보 입력하기"
                         onClick={() => setRightScreen("JoinForm")}
                         width="200px"
                    />
               </EmptyState>
          );
     }

     const hasNoSchedule = !userScheduleInfo?.availableTimes?.length;

     return (
          <AnimatePresence>
               <Frame initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <HeaderWrapper>
                         <NoteText>
                              <span style={{ color: theme.color.primary, fontFamily: "Pretendard-Bold" }}>{name}</span>{" "}
                              님의 가능한 시간을 선택해주세요.
                         </NoteText>
                    </HeaderWrapper>
                    {onViewTimetable && (
                         <ViewTimetableBtn onClick={onViewTimetable}>
                              <FiGrid size={15} />
                              전체 시간표
                         </ViewTimetableBtn>
                    )}
                    {hasNoSchedule && (
                         <SelectPrompt
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.1 }}
                         >
                              <PromptDot />
                              드래그해서 가능한 시간을 선택해주세요
                         </SelectPrompt>
                    )}
                    <SaveButton
                         onClick={handleSave}
                         disabled={isSaving || areArraysEqual(userScheduleInfo?.availableTimes || [], selectedCells)}
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
                         bgTimeInfo={bgTimeInfo}
                    />
                    <SaveButton
                         onClick={handleSave}
                         disabled={isSaving || areArraysEqual(userScheduleInfo?.availableTimes || [], selectedCells)}
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

const SelectPrompt = styled(motion.div)`
     width: 100%;
     display: flex;
     align-items: center;
     gap: 10px;
     padding: 12px 16px;
     background: ${theme.color.primary}0a;
     border: 1.5px solid ${theme.color.primary}30;
     border-radius: 10px;
     font-family: "Pretendard-Medium";
     font-size: 14px;
     color: ${theme.color.primary};
     box-sizing: border-box;
     line-height: 1.5;
     animation: promptBorderPulse 2.2s ease-in-out infinite;

     @keyframes promptBorderPulse {
          0%, 100% {
               border-color: ${theme.color.primary}28;
               box-shadow: none;
          }
          50% {
               border-color: ${theme.color.primary}90;
               box-shadow: 0 0 0 4px ${theme.color.primary}12;
          }
     }
`;

const PromptDot = styled.span`
     flex-shrink: 0;
     width: 8px;
     height: 8px;
     border-radius: 50%;
     background: ${theme.color.primary};
     animation: promptPulse 1.8s ease-in-out infinite;

     @keyframes promptPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
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

const ViewTimetableBtn = styled.button`
     display: flex;
     align-items: center;
     justify-content: center;
     gap: 8px;
     width: 100%;
     height: 44px;
     background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
     color: white;
     border: none;
     border-radius: 10px;
     font-family: "Pretendard-Bold";
     font-size: 14px;
     cursor: pointer;
     transition: all 0.2s ease;
     box-shadow: 0 4px 12px ${theme.color.primary}30;

     &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px ${theme.color.primary}40;
     }
     &:active {
          transform: translateY(0);
     }
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