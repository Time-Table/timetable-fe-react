import styled from "@emotion/styled/macro";
import theme from "../../../theme";
import { useState, useMemo, useEffect } from "react";
import { FiUsers, FiInfo, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Button from "../../../component/Button";

const PER_PAGE = 10;
const SLOT_MIN = 30;
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-03-06-17:00" -> { dateKey: "2026-03-06", min: 1020 }
function parseSlot(time) {
  const [year, month, day, hour, minute] = time.split(/[-:]/);
  return {
    dateKey: `${year}-${month}-${day}`,
    min: parseInt(hour, 10) * 60 + parseInt(minute, 10),
  };
}

function fmtTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fmtDate(dateKey) {
  const dow = DAYS[new Date(`${dateKey}T00:00:00Z`).getUTCDay()];
  const [, month, day] = dateKey.split("-");
  return `${parseInt(month, 10)}/${parseInt(day, 10)} (${dow})`;
}

function fmtDuration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  return `${m}분`;
}

export default function RankingList({
  setRightScreen,
  timeInfo = [],
  selectedName,
  setSelectedName,
  usersCount = 0,
}) {
  const isValidArray = Array.isArray(timeInfo) && timeInfo.length > 0;
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  // 인접한 30분 슬롯 중 "참여자 명단이 완전히 같은" 것들을 하나의 구간으로 병합
  const blocks = useMemo(() => {
    if (!isValidArray) return [];

    const enriched = timeInfo
      .map((item) => ({ ...item, ...parseSlot(item.time), sig: [...(item.members || [])].sort().join("|") }))
      .sort((a, b) => (a.dateKey === b.dateKey ? a.min - b.min : a.dateKey < b.dateKey ? -1 : 1));

    const merged = [];
    let cur = null;
    enriched.forEach((slot) => {
      const contiguous =
        cur &&
        cur.dateKey === slot.dateKey &&
        cur.sig === slot.sig &&
        slot.min === cur.endMin;
      if (contiguous) {
        cur.endMin = slot.min + SLOT_MIN;
      } else {
        cur = {
          id: `${slot.dateKey}-${slot.min}`,
          dateKey: slot.dateKey,
          sig: slot.sig,
          startMin: slot.min,
          endMin: slot.min + SLOT_MIN,
          count: slot.count,
          members: slot.members || [],
        };
        merged.push(cur);
      }
    });

    merged.forEach((b) => {
      b.durationMin = b.endMin - b.startMin;
    });

    // 인원 많은 순 → 오래 이어지는 순 → 이른 시간 순
    merged.sort(
      (a, b) =>
        b.count - a.count ||
        b.durationMin - a.durationMin ||
        (a.dateKey === b.dateKey ? a.startMin - b.startMin : a.dateKey < b.dateKey ? -1 : 1),
    );

    let rank = 0;
    let prevCount = -1;
    return merged.map((b) => {
      if (b.count !== prevCount) rank++;
      prevCount = b.count;
      return { ...b, displayRank: rank };
    });
  }, [timeInfo, isValidArray]);

  // 게이지 분모 = 전체 참여자 수 (없으면 최다 인원으로 대체)
  const total = useMemo(() => {
    if (usersCount > 0) return usersCount;
    return blocks.reduce((mx, b) => Math.max(mx, b.count || 0), 1);
  }, [usersCount, blocks]);

  // 최소 PER_PAGE개를 채우되, 같은 순위(동점) 그룹이 페이지 경계에서 잘리지 않게 끊는다
  const pages = useMemo(() => {
    const result = [];
    let current = [];
    blocks.forEach((b, i) => {
      const prev = blocks[i - 1];
      const isNewRank = prev && b.count !== prev.count;
      if (current.length >= PER_PAGE && isNewRank) {
        result.push(current);
        current = [];
      }
      current.push(b);
    });
    if (current.length) result.push(current);
    return result.length ? result : [[]];
  }, [blocks]);

  const totalPages = pages.length;
  const currentPage = Math.min(page, totalPages);
  const pageList = pages[currentPage - 1] || [];

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [timeInfo]);

  const goPage = (next) => {
    setExpandedId(null);
    setPage(next);
  };

  const handleMemberClick = (e, memberName) => {
    e.stopPropagation();
    setSelectedName(selectedName === memberName ? null : memberName);
  };

  if (!isValidArray) {
    return (
      <EmptyState>
        <FiInfo size={22} color={theme.text.gamma[500]} />
        <div>
          {usersCount === 0 ? (
            <>
              <EmptyTitle>아직 등록된 일정이 없습니다.</EmptyTitle>
              <EmptySub>일정을 등록하면 순위가 나타납니다.</EmptySub>
            </>
          ) : (
            <>
              <EmptyTitle>순위 정보가 없습니다.</EmptyTitle>
              <EmptySub>참여자가 시간을 선택하면 순위가 계산됩니다.</EmptySub>
            </>
          )}
        </div>
        {usersCount === 0 && (
          <Button title="일정 등록하러 가기" width="180px" onClick={() => setRightScreen("JoinForm")} />
        )}
      </EmptyState>
    );
  }

  return (
    <Frame>
      <BlockList>
        {pageList.map((b) => {
          const isExpanded = expandedId === b.id;
          const isTop = b.displayRank === 1;
          const pct = Math.min(100, Math.round((b.count / total) * 100));
          const fillPct = Math.min(100, (b.count / total) * 100);
          return (
            <Block
              key={b.id}
              $top={isTop}
              onClick={() => setExpandedId((prev) => (prev === b.id ? null : b.id))}
            >
              <BlockHead>
                <RankBadge $top={isTop}>{b.displayRank}</RankBadge>
                <DateLabel>{fmtDate(b.dateKey)}</DateLabel>
                <DurationTag>{fmtDuration(b.durationMin)} 연속</DurationTag>
              </BlockHead>

              <TimeRange>
                {fmtTime(b.startMin)} ~ {fmtTime(b.endMin)}
              </TimeRange>

              <GaugeRow>
                <GaugeTrack>
                  <GaugeFill style={{ width: `${fillPct}%` }} $top={isTop} />
                </GaugeTrack>
                <GaugeValue>{pct}%</GaugeValue>
              </GaugeRow>
              <GaugeCaption>
                <FiUsers size={12} />
                전체 {total}명 중 <strong>{b.count}명</strong> 참여 가능
              </GaugeCaption>

              {isExpanded && (
                <Members>
                  {b.members.map((member, i) => (
                    <MemberChip
                      key={i}
                      type="button"
                      $isSelected={selectedName === member}
                      onClick={(e) => handleMemberClick(e, member)}
                    >
                      {member}
                    </MemberChip>
                  ))}
                </Members>
              )}
            </Block>
          );
        })}
      </BlockList>

      {totalPages > 1 && (
        <Pager>
          <PageBtn type="button" disabled={currentPage === 1} onClick={() => goPage(currentPage - 1)}>
            <FiChevronLeft size={16} />
            이전
          </PageBtn>
          <PageNum>
            <strong>{currentPage}</strong> / {totalPages}
          </PageNum>
          <PageBtn
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => goPage(currentPage + 1)}
          >
            다음
            <FiChevronRight size={16} />
          </PageBtn>
        </Pager>
      )}
    </Frame>
  );
}

const Frame = styled.div`
  width: 100%;
`;

const BlockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Block = styled("div", {
  shouldForwardProp: (prop) => prop !== "$top",
})`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  background: ${({ $top }) => ($top ? `${theme.color.primary}0A` : "white")};
  border: 1px solid ${({ $top }) => ($top ? theme.color.primary : theme.text.gamma[800])};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: ${theme.color.primary};
    box-shadow: 0 3px 10px rgba(254, 111, 111, 0.12);
  }
`;

const BlockHead = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
`;

const RankBadge = styled("span", {
  shouldForwardProp: (prop) => prop !== "$top",
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 6px;
  font-family: "Pretendard-Bold";
  font-size: 12px;
  background: ${({ $top }) => ($top ? theme.color.primary : theme.text.gamma[900])};
  color: ${({ $top }) => ($top ? "white" : theme.text.gamma[500])};
`;

const DateLabel = styled.span`
  flex: 1;
  font-family: "Pretendard-SemiBold";
  font-size: 14px;
  color: ${theme.text.primary};
`;

const DurationTag = styled.span`
  flex-shrink: 0;
  font-family: "Pretendard-Medium";
  font-size: 12px;
  color: ${theme.text.gamma[500]};
`;

const TimeRange = styled.div`
  font-family: "Pretendard-Bold";
  font-size: 17px;
  color: ${theme.text.primary};
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
`;

const GaugeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const GaugeTrack = styled.div`
  position: relative;
  flex: 1;
  height: 8px;
  border-radius: 6px;
  background: ${theme.text.gamma[900]};
  overflow: hidden;
`;

const GaugeFill = styled("div", {
  shouldForwardProp: (prop) => prop !== "$top",
})`
  height: 100%;
  border-radius: 6px;
  background: ${({ $top }) => ($top ? theme.color.primary : theme.color.primaryTint)};
  transition: width 0.4s ease;
`;

const GaugeValue = styled.span`
  flex-shrink: 0;
  min-width: 34px;
  text-align: right;
  font-family: "Pretendard-Bold";
  font-size: 13px;
  color: ${theme.color.primary};
  font-variant-numeric: tabular-nums;
`;

const GaugeCaption = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: "Pretendard-Medium";
  font-size: 12px;
  color: ${theme.text.gamma[500]};

  strong {
    font-family: "Pretendard-Bold";
    color: ${theme.text.primary};
  }

  svg {
    color: ${theme.text.gamma[500]};
  }
`;

const Members = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid ${theme.text.gamma[800]};
`;

const MemberChip = styled("button", {
  shouldForwardProp: (prop) => prop !== "$isSelected",
})`
  border: 1px solid ${({ $isSelected }) => ($isSelected ? theme.color.primary : theme.text.gamma[800])};
  background: ${({ $isSelected }) => ($isSelected ? theme.color.primary : "white")};
  color: ${({ $isSelected }) => ($isSelected ? "white" : theme.text.gamma[500])};
  font-family: "Pretendard-Medium";
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
`;

const Pager = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 16px;
`;

const PageBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: 9px;
  background: white;
  color: ${theme.text.primary};
  font-family: "Pretendard-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${theme.color.primary};
    color: ${theme.color.primary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const PageNum = styled.span`
  font-family: "Pretendard-SemiBold";
  font-size: 13px;
  color: ${theme.text.gamma[500]};

  strong {
    color: ${theme.text.primary};
    font-family: "Pretendard-Bold";
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 28px 16px;
  text-align: center;
  border: 1px dashed ${theme.text.gamma[800]};
  border-radius: 12px;
`;

const EmptyTitle = styled.p`
  font-family: "Pretendard-SemiBold";
  font-size: 15px;
  color: ${theme.text.primary};
  margin: 0 0 4px;
`;

const EmptySub = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 13px;
  color: ${theme.text.gamma[500]};
  margin: 0;
`;
