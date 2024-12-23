import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Arrow from "../../../../assets/svg/Arrow";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function Rank({
  setSelectedToggle,
  setRightScreen,
  timeInfo = [],
  selectedName,
  setSelectedName,
  setCurrentSlide,
}) {
  const isValidArray = Array.isArray(timeInfo);
  const sortedTimeInfo = isValidArray ? [...timeInfo].sort((a, b) => b.count - a.count) : [];

  useEffect(() => {
    if (!isValidArray || sortedTimeInfo.length === 0) {
      Swal.fire({
        title: "일정을 먼저 등록 해주세요!",
        text: "첫 유저의 일정이 등록되면 순위를 사용하실 수 있습니다!",
        icon: "error",
        confirmButtonText: "확인",
        confirmButtonColor: `${theme.color.primary}`,
      });
      setRightScreen("MySchedule");
      setSelectedToggle("내 일정");
      return;
    }
    setRankDetails(Array(sortedTimeInfo.length).fill(false));
  }, []);

  const [rankDetails, setRankDetails] = useState([]);

  const toggleRankDetail = (index) => {
    setRankDetails((prevDetails) =>
      prevDetails.map((detail, i) => (i === index ? !detail : detail))
    );
  };

  const toggleMemberBold = (member) => {
    setSelectedName((prevSelectedName) => (prevSelectedName === member ? null : member));
  };

  function formatDate(input) {
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const [year, month, day, hour, minute] = input.split(/[-:]/);
    const date = new Date(`${year}-${month}-${day}`);
    const dayOfWeek = daysOfWeek[date.getDay()];

    return `${parseInt(month)} / ${parseInt(day)} (${dayOfWeek}) ${hour} : ${minute}`;
  }

  if (!isValidArray) {
    return <div>{"내 일정을 먼저 추가해주세요." || timeInfo?.message}</div>;
  }

  return (
    <Frame>
      {sortedTimeInfo.map((rank, index) => {
        const ranking = index + 1;
        const sum = rank.count;
        const time = rank.time;

        return (
          <ContentDiv key={rank._id || index}>
            <RankButton key={index} onClick={() => toggleRankDetail(index)}>
              <RankInfo width={"50px"} color={theme.color.primary} font={"Pretendard-semiBold"}>
                {ranking + ""}
              </RankInfo>
              <RankInfo width={"70px"} font={"Pretendard-Regular"}>
                {sum + " 명"}
              </RankInfo>
              <RankMonthInfo>{formatDate(time)}</RankMonthInfo>
              <Arrow angle={rankDetails[index] ? 270 : 90} width={13} height={13} />
            </RankButton>
            <RankDetailBox rankDetail={rankDetails[index]}>
              {(rank.members || []).map((member, memberIndex) => (
                <MemberDiv
                  key={memberIndex}
                  onClick={() => {
                    toggleMemberBold(member);
                    setCurrentSlide(0);
                  }}
                  isSelected={selectedName === member}
                >
                  {member}
                </MemberDiv>
              ))}
            </RankDetailBox>
          </ContentDiv>
        );
      })}
    </Frame>
  );
}

const Frame = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 620px;
  overflow-y: auto;
  scroll-behavior: smooth;

  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; //IE and Edge
  scrollbar-width: none; //Firefox
`;

const ContentDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 380px;
  gap: 20px;

  @media (max-width: 480px) {
    width: 100%;
    align-items: flex-start;
    gap: 10px;
  }
`;

const RankButton = styled.button`
  ${theme.styles.flexCenterRow};
  width: 100%;
  font-size: 24px;
  gap: 20px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  justify-content: center;
  @media (max-width: 480px) {
    width: 90%;
    font-size: 19px;
    gap: 10px;
  }
`;

const RankDetailBox = styled.div`
  width: 80%;
  gap: 10px;
  background: ${theme.text.gamma[900]};
  flex-wrap: wrap;
  border-radius: 10px;
  display: ${(props) => (props.rankDetail ? "flex" : "none")};
  padding: 10px;

  @media (max-width: 480px) {
    width: 75%;
    gap: 5px;
    padding: 6px;
    margin-left: 40px;
  }
`;

const MemberDiv = styled.div`
  ${theme.styles.flexCenterRow}
  padding:  10px 16px;
  font-family: Pretendard-Light;
  font-size: 20px;
  font-weight: ${(props) => (props.isSelected ? "bold" : "normal")};
  cursor: pointer;

  @media (max-width: 480px) {
    padding: 6px 10px;
    font-size: 17px;
  }
`;

const RankInfo = styled.span`
  text-align: end;
  color: ${(props) => props.color};
  width: ${(props) => props.width};
  font-family: ${(props) => props.font};

  @media (max-width: 480px) {
    width: 3.5em;
  }
`;

const RankMonthInfo = styled.span`
  width: 220px;
  text-align: end;
  color: ${(props) => props.color};
  font-family: Pretendard-Light;

  @media (max-width: 480px) {
    width: 170px;
  }
`;
