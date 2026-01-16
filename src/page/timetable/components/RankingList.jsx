import styled from "@emotion/styled/macro";
import theme from "../../../theme";
import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { AnimatePresence, motion } from "framer-motion";
import { FaCrown } from "react-icons/fa";

const getRankGradient = (ranking) => {
  if (ranking === 1) {
    return "linear-gradient(135deg, #fffeeb, #ffb300)";
  }
  return `linear-gradient(135deg, ${theme.color.primary}, #FF8A8A)`;
};

export default function RankingList({
  setRightScreen,
  timeInfo = [],
  selectedName,
  setSelectedName,
}) {
  const isValidArray = Array.isArray(timeInfo) && timeInfo.length > 0;

  const sortedTimeInfo = useMemo(() => {
    if (!isValidArray) return [];
    const sorted = [...timeInfo].sort((a, b) => b.count - a.count).slice(0, 50);

    let rank = 0;
    let prevCount = -1;
    return sorted.map((item) => {
      if (item.count !== prevCount) {
        rank++;
      }
      prevCount = item.count;
      return { ...item, displayRank: rank };
    });
  }, [timeInfo, isValidArray]);

  const maxCount = isValidArray ? Math.max(...sortedTimeInfo.map((item) => item.count), 0) : 1;
  const minCount = isValidArray ? Math.min(...sortedTimeInfo.map((item) => item.count), 1) : 1;

  const [expandedRankIndex, setExpandedRankIndex] = useState(null);

  useEffect(() => {
    if (!isValidArray) {
      Swal.fire({
        title: "순위 정보가 없습니다",
        text: "참여자가 일정을 등록하면 순위가 집계됩니다.",
        icon: "info",
        confirmButtonText: "확인",
        confirmButtonColor: `${theme.color.primary}`,
      }).then(() => {
        setRightScreen("PersonalSchedule");
      });
    }
  }, [isValidArray, setRightScreen]);

  function formatDate(input) {
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const [year, month, day, hour, minute] = input.split(/[-:]/);
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    const dayOfWeek = daysOfWeek[date.getUTCDay()];
    return `${parseInt(month)}/${parseInt(day)}(${dayOfWeek}) ${hour}:${minute}`;
  }

  const handleRankClick = (index) => {
    setExpandedRankIndex(expandedRankIndex === index ? null : index);
  };

  const handleMemberClick = (memberName) => {
    setSelectedName(selectedName === memberName ? null : memberName);
  };

  if (!isValidArray) {
    return <EmptyMessage>참여자가 일정을 등록하면 순위가 표시됩니다.</EmptyMessage>;
  }

  return (
    <AnimatePresence>
      <Frame initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <RankList>
          {sortedTimeInfo.map((rank, index) => (
            <RankCard
              key={rank._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <RankButton onClick={() => handleRankClick(index)}>
                <RankNumber
                  ranking={rank.displayRank}
                  count={rank.count}
                  minCount={minCount}
                  maxCount={maxCount}
                >
                  {rank.displayRank === 1 ? <FaCrown /> : rank.displayRank}
                </RankNumber>
                <BarContainer>
                  <Bar
                    ranking={rank.displayRank}
                    count={rank.count}
                    minCount={minCount}
                    maxCount={maxCount}
                    style={{ width: `${(rank.count / maxCount) * 100}%` }}
                  />
                  <RankInfo>
                    <TimeText>{formatDate(rank.time)}</TimeText>
                    <CountText>{rank.count}명</CountText>
                  </RankInfo>
                </BarContainer>
              </RankButton>
              <AnimatePresence>
                {expandedRankIndex === index && (
                  <MembersContainer
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {(rank.members || []).map((member, memberIndex) => (
                      <MemberChip
                        key={memberIndex}
                        onClick={() => handleMemberClick(member)}
                        isSelected={selectedName === member}
                      >
                        {member}
                      </MemberChip>
                    ))}
                  </MembersContainer>
                )}
              </AnimatePresence>
            </RankCard>
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
  max-height: 800px;
  overflow-y: auto;
  padding-right: 8px;
`;

const RankCard = styled(motion.div)`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
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

const RankNumber = styled.div`
  font-family: "Pretendard-Bold";
  font-size: 16px;
  background: ${({ ranking }) => getRankGradient(ranking)};
  color: ${({ ranking }) => (ranking === 1 ? "#D97706" : "white")}; // 1등 왕관 색, 나머지는 흰색
  min-width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: opacity 0.5s ease-out;

  // 배경색의 불투명도를 조절
  opacity: ${({ ranking, count, minCount, maxCount }) => {
    if (ranking === 1) return 1;
    if (maxCount === minCount) return 0.8;

    const minOpacity = 0.5; // 최소 불투명도
    const maxOpacity = 1.0;
    const percentage = (count - minCount) / (maxCount - minCount || 1);
    return minOpacity + percentage * (maxOpacity - minOpacity);
  }};
`;

const BarContainer = styled.div`
  flex-grow: 1;
  position: relative;
  height: 50px;
  background-color: ${theme.text.gamma[900]};
  border-radius: 8px;
  overflow: hidden;
`;

const Bar = styled.div`
  position: absolute;
  height: 100%;
  background: ${({ ranking }) => getRankGradient(ranking)};
  border-radius: 8px;
  transition: width 0.5s ease-out, opacity 0.5s ease-out;

  // Bar의 불투명도 조절
  opacity: ${({ ranking, count, minCount, maxCount }) => {
    if (ranking === 1) return 1;
    if (maxCount === minCount) return 0.7;

    const minOpacity = 0.4;
    const maxOpacity = 1.0;
    const percentage = (count - minCount) / (maxCount - minCount || 1);
    return minOpacity + percentage * (maxOpacity - minOpacity);
  }};
`;

const RankInfo = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: 100%;
`;

const TimeText = styled.span`
  font-family: "Pretendard-SemiBold";
  font-size: 15px;
  color: ${theme.text.gamma[100]};
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
`;

const CountText = styled.span`
  font-family: "Pretendard-Bold";
  font-size: 15px;
  color: white;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: 6px;
`;

const MembersContainer = styled(motion.div)`
  padding: 16px 16px 16px 72px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MemberChip = styled.button`
  background-color: ${({ isSelected }) =>
    isSelected ? theme.color.primary : theme.text.gamma[900]};
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
