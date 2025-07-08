import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Arrow from "../../../../assets/svg/Arrow";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { AnimatePresence, motion } from "framer-motion";

export default function Rank({ setRightScreen, timeInfo = [], selectedName, setSelectedName }) {
     const isValidArray = Array.isArray(timeInfo) && timeInfo.length > 0;
     const sortedTimeInfo = isValidArray ? [...timeInfo].sort((a, b) => b.count - a.count).slice(0, 50) : [];

     const [rankDetails, setRankDetails] = useState([]);

     useEffect(() => {
          if (!isValidArray) {
               Swal.fire({
                    title: "순위 정보가 없습니다",
                    text: "참여자가 일정을 등록하면 순위가 집계됩니다.",
                    icon: "info",
                    confirmButtonText: "확인",
                    confirmButtonColor: `${theme.color.primary}`,
               }).then(() => {
                    setRightScreen("MySchedule");
               });
          } else {
               setRankDetails(Array(sortedTimeInfo.length).fill(false));
          }
     }, [isValidArray, sortedTimeInfo.length, setRightScreen]);

     const toggleRankDetail = (index) => {
          setRankDetails((prev) => prev.map((detail, i) => (i === index ? !detail : detail)));
     };

     function formatDate(input) {
          const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
          const [year, month, day, hour, minute] = input.split(/[-:]/);
          const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
          const dayOfWeek = daysOfWeek[date.getUTCDay()];
          return `${parseInt(month)}/${parseInt(day)}(${dayOfWeek}) ${hour}:${minute}`;
     }

     if (!isValidArray) {
          return <EmptyMessage>참여자가 일정을 등록하면 순위가 표시됩니다.</EmptyMessage>;
     }

     return (
          <AnimatePresence>
               <Frame initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <RankList>
                         {sortedTimeInfo.map((rank, index) => (
                              <ContentDiv key={rank._id || index}>
                                   <RankButton onClick={() => toggleRankDetail(index)}>
                                        <RankNumber ranking={index + 1}>{index + 1}</RankNumber>
                                        <RankInfo>
                                             <TimeText>{formatDate(rank.time)}</TimeText>
                                             <CountText>{rank.count}명</CountText>
                                        </RankInfo>
                                        <Arrow angle={rankDetails[index] ? 270 : 90} width={12} height={12} />
                                   </RankButton>
                                   <AnimatePresence>
                                        {rankDetails[index] && (
                                             <RankDetailBox
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: "auto", opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                             >
                                                  {(rank.members || []).map((member, memberIndex) => (
                                                       <MemberChip
                                                            key={memberIndex}
                                                            onClick={() =>
                                                                 setSelectedName(
                                                                      selectedName === member ? null : member
                                                                 )
                                                            }
                                                            isSelected={selectedName === member}
                                                       >
                                                            {member}
                                                       </MemberChip>
                                                  ))}
                                             </RankDetailBox>
                                        )}
                                   </AnimatePresence>
                              </ContentDiv>
                         ))}
                    </RankList>
               </Frame>
          </AnimatePresence>
     );
}

const Frame = styled(motion.div)`
     width: 100%;
`;

const RankList = styled.div`
     width: 100%;
     display: flex;
     flex-direction: column;
     gap: 12px;
     max-height: 620px;
     overflow-y: auto;
     padding-right: 8px;
`;

const ContentDiv = styled.div`
     display: flex;
     flex-direction: column;
     width: 100%;
     background: white;
     border-radius: 12px;
     box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const RankButton = styled.button`
     display: flex;
     align-items: center;
     width: 100%;
     gap: 16px;
     background: transparent;
     border: none;
     cursor: pointer;
     padding: 16px;
     text-align: left;
`;

const getRankColor = (ranking) => {
     if (ranking === 1) return "#FFD700";
     if (ranking === 2) return "#C0C0C0";
     if (ranking === 3) return "#CD7F32";
     return theme.text.gamma[900];
};

const RankNumber = styled.span`
     font-family: "Pretendard-Bold";
     font-size: 18px;
     color: white;
     background-color: ${({ ranking }) => getRankColor(ranking)};
     min-width: 32px;
     height: 32px;
     border-radius: 50%;
     display: flex;
     align-items: center;
     justify-content: center;
`;

const RankInfo = styled.div`
     flex-grow: 1;
     display: flex;
     flex-direction: column;
     gap: 4px;
`;

const TimeText = styled.span`
     font-family: "Pretendard-SemiBold";
     font-size: 16px;
     color: ${theme.text.gamma[300]};
`;

const CountText = styled.span`
     font-family: "Pretendard-Regular";
     font-size: 14px;
     color: ${theme.color.primary};
`;

const RankDetailBox = styled(motion.div)`
     width: 100%;
     overflow: hidden;
     .details-content {
          padding: 0 16px 16px 64px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
     }
`;

const MemberChip = styled.button`
     background-color: ${({ isSelected }) => (isSelected ? theme.color.primary : theme.text.gamma[900])};
     border: none;
     color: ${({ isSelected }) => (isSelected ? "white" : theme.text.gamma[500])};
     font-family: "Pretendard-Medium";
     font-size: 14px;
     padding: 6px 12px;
     border-radius: 999px;
     cursor: pointer;
     transition: all 0.2s ease;

     &:hover {
          transform: translateY(-1px);
     }
`;

const EmptyMessage = styled.p`
     font-family: "Pretendard-Regular";
     color: ${theme.text.gamma[600]};
     width: 100%;
     text-align: center;
     padding: 40px 0;
`;
