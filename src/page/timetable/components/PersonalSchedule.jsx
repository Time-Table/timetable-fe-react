import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styled from "@emotion/styled/macro";
import theme from "../../../theme";
import Button from "../../../component/Button";
import TimeGrid from "../../../component/TimeGrid";
import Swal from "sweetalert2";
import { addSchedule } from "../../../api/schedule";
import { trackEvent, EVENTS, trackClarityEvent, CLARITY_EVENTS } from "../../../utils/analytics";
import { saveFailReason } from "../../../utils/failReason";
import { readTableState, writeTableState, clearTableDraft, validCellsOf, draftFor } from "../../../utils/tableSession";
import Loader from "./Loading";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowDown, FiGrid } from "react-icons/fi";
import { readStorage } from "../../../utils/storage";

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
     stickyHeaderTop,
     weekKey,
     onWeekChange,
}) {
     const [isLoading, setIsLoading] = useState(true);
     const [isSaving, setIsSaving] = useState(false);
     const name = readStorage("name");
     const userScheduleInfo = usersScheduleList.find((user) => user.name === name);
     const [selectedCells, setSelectedCells] = useState([]);

     // 사용자가 시간을 처음 더한 순간을 화면을 열 때마다 1회만 남긴다. 이미 고른 시간을 해제만 한 것은 세지 않는다.
     // 드래그 선택은 터치 시작에서 기본 동작을 막아 클릭이 생기지 않아 Clarity 히트맵에 잡히지 않는다.
     // TimeGrid가 이 함수를 이벤트 핸들러의 의존값으로 쓰므로 참조가 바뀌지 않게 두고, 현재 선택은 ref로 읽는다.
     const selectTrackedRef = useRef(false);
     const selectedCellsRef = useRef(selectedCells);
     useLayoutEffect(() => {
          selectedCellsRef.current = selectedCells;
     }, [selectedCells]);
     const handleSelectCells = useCallback((next) => {
          if (!selectTrackedRef.current) {
               try {
                    // TimeGrid는 순수한 갱신 함수만 넘기므로 미리 한 번 계산해 봐도 상태가 바뀌지 않는다.
                    const prev = selectedCellsRef.current;
                    const resolved = typeof next === "function" ? next(prev) : next;
                    if (resolved.some((cell) => !prev.includes(cell))) {
                         selectTrackedRef.current = true;
                         trackClarityEvent(CLARITY_EVENTS.SCHEDULE_SELECT);
                    }
               } catch {
                    // 계측 계산이 실패해도 선택은 그대로 반영한다.
               }
          }
          setSelectedCells(next);
     }, []);

     const areArraysEqual = (arr1, arr2) =>
          arr1.length === arr2.length &&
          arr1.every((value) => arr2.includes(value)) &&
          arr2.every((value) => arr1.includes(value));

     // 표 화면 A/B 공유 상태(utils/tableSession.js). baseRef는 마지막으로 맞춘 저장 시간이다.
     // 처음 한 번은 같은 이름의 저장 안 한 선택(draft)으로 시작하고, 이후 목록을 다시 불러와도
     // 저장 안 한 선택이 있으면 덮지 않는다(바뀐 것이 없을 때만 서버 값을 따라간다).
     const baseRef = useRef(null);
     // 이 이름으로 처음 맞췄는가, 저장 안 한 선택이 있는가. 개발 모드 StrictMode는 효과를 두 번 돌리며 그때
     // 선택을 비추는 ref가 첫 렌더 값([])으로 돌아간다. 전에는 그 ref로 판단해 저장 시간이 없는 사람의
     // 되살린 칸을 지웠다(2026-09-30 새 표 시험에서 발견). 바뀜 여부는 dirtyRef로 따로 기억한다.
     const initNameRef = useRef(null);
     const dirtyRef = useRef(false);
     useEffect(() => {
          if (!name) {
               setIsLoading(false);
               return;
          }
          const saved = [...(userScheduleInfo?.availableTimes || [])];
          if (initNameRef.current !== name) {
               initNameRef.current = name;
               const valid = validCellsOf({ dates, startHour, endHour, banedCells });
               const draft = draftFor(readTableState(tableId), name, valid, saved);
               dirtyRef.current = !!draft;
               setSelectedCells(draft || saved);
          } else if (!dirtyRef.current) {
               setSelectedCells(saved);
          }
          baseRef.current = saved;
          setIsLoading(false);
          // dates 등은 표가 바뀌면 이 화면이 새로 그려지므로 이름·저장 시간이 바뀔 때만 맞춘다.
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [name, userScheduleInfo]);

     // 칸이 바뀔 때마다 바로 남긴다(화면을 바꾸기 직전 칸까지 이어지게). 저장한 시간과 같으면 null.
     useLayoutEffect(() => {
          if (isLoading || !name || baseRef.current === null) return;
          const dirty = !areArraysEqual(selectedCells, baseRef.current);
          dirtyRef.current = dirty;
          writeTableState(tableId, { name, draft: dirty ? [...selectedCells].sort() : null });
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [selectedCells, isLoading, name, tableId]);

     const handleSave = async () => {
          if (isSaving) return;
          // 켜진 저장 버튼을 누른 순간이다(버튼은 바뀐 시간이 있고 저장 중이 아닐 때만 켜진다).
          // 서버 결과와 무관하게 남기고, 저장 성공은 trackEvent가 보내는 tt_schedule_save로 따로 센다.
          trackClarityEvent(CLARITY_EVENTS.SCHEDULE_SAVE_CLICK);
          if (!tableId || !name) {
               Swal.fire({ icon: "error", title: "로그인 정보가 없습니다." });
               return;
          }
          if (areArraysEqual(userScheduleInfo?.availableTimes || [], selectedCells)) {
               Swal.fire({ icon: "info", title: "변경사항이 없습니다." });
               return;
          }
          setIsSaving(true);
          let result = null;
          try {
               try {
                    result = await addSchedule(tableId, name, selectedCells);
               } catch (error) {
                    trackEvent(EVENTS.SAVE_FAIL, tableId, undefined, { reason: saveFailReason(error) });
                    throw error;
               }
               if (!result?.success) {
                    trackEvent(EVENTS.SAVE_FAIL, tableId, undefined, { reason: saveFailReason(null, result) });
                    throw new Error("일정 저장이 확인되지 않았습니다.");
               }
               // 서버가 저장을 확인한 뒤에만 저장 안 한 선택을 비운다(실패하면 그대로 남아 이어서 고칠 수 있다).
               baseRef.current = [...selectedCells];
               dirtyRef.current = false;
               clearTableDraft(tableId);
               trackEvent(EVENTS.SCHEDULE_SAVE, tableId);
               Swal.fire({
                    icon: "success",
                    iconColor: `${theme.color.primary}`,
                    title: "저장되었습니다!",
                    showConfirmButton: false,
                    timer: 900,
               });
               if (onSaveSuccess) {
                    // 서버가 확인한 내 시간(없으면 보낸 시간)을 넘겨 표 화면이 다시 불러오기 전에 먼저 반영하게 한다.
                    const confirmed = result.data?.userAvailableTimes;
                    onSaveSuccess({ name, availableTimes: Array.isArray(confirmed) ? confirmed : [...selectedCells] });
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
                              <span data-clarity-mask="true" style={{ color: theme.color.primary, fontFamily: "Pretendard-Bold" }}>{name}</span>{" "}
                              님의 가능한 시간을 선택해주세요.
                         </NoteText>
                    </HeaderWrapper>
                    {onViewTimetable && (
                         <ViewTimetableBtn onClick={onViewTimetable}>
                              <FiGrid size={15} />
                              전체 시간표
                         </ViewTimetableBtn>
                    )}
                    <SaveButton
                         onClick={handleSave}
                         disabled={isSaving || areArraysEqual(userScheduleInfo?.availableTimes || [], selectedCells)}
                    >
                         저장하기
                    </SaveButton>
                    {hasNoSchedule && (
                         <SelectPrompt
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.1 }}
                         >
                              <span>드래그해서 가능한 시간을 선택해주세요</span>
                              <FiArrowDown size={20} aria-hidden="true" />
                         </SelectPrompt>
                    )}
                    <TimeGrid
                         dates={dates}
                         startHour={startHour}
                         endHour={endHour}
                         selectedCells={selectedCells}
                         selectedCellColor={theme.color.primaryTint}
                         setSelectedCells={handleSelectCells}
                         banedCells={banedCells}
                         bgTimeInfo={bgTimeInfo}
                         stickyHeaderTop={stickyHeaderTop}
                         weekKey={weekKey}
                         onWeekChange={onWeekChange}
                         weekendColors
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
     flex-direction: column;
     align-items: center;
     gap: 4px;
     padding: 12px 16px;
     background: ${theme.color.primary}0a;
     border: 1.5px solid ${theme.color.primary}30;
     border-radius: 10px;
     font-family: "Pretendard-Medium";
     font-size: 14px;
     color: ${theme.color.primary};
     box-sizing: border-box;
     line-height: 1.5;
     text-align: center;
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
