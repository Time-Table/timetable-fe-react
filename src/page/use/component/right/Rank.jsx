import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Arrow from "../../../../assets/svg/Arrow";
import { useState } from "react";

export default function Rank({ timeInfo, selectedName, setSelectedName }) {
  const sortedTimeInfo = [...timeInfo].sort((a, b) => b.count - a.count);
  const [rankDetails, setRankDetails] = useState(Array(sortedTimeInfo.length).fill(false));

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

  return (
    <Frame>
      {sortedTimeInfo.map((rank, index) => {
        const ranking = index + 1;
        const sum = rank.count;
        const time = rank.time;

        return (
          <ContentDiv key={rank._id}>
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
              {rank.members.map((member, memberIndex) => (
                <MemberDiv
                  key={memberIndex}
                  onClick={() => toggleMemberBold(member)}
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
  max-height: 620px;
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
  align-items: flex-end;
  justify-content: center;
  width: 380px;
  gap: 20px;

  @media (max-width: 480px) {
    width: 100%;
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
  width: 200px;
  text-align: end;
  color: ${(props) => props.color};
  font-family: Pretendard-Light;

  @media (max-width: 480px) {
    width: 170px;
  }
`;
