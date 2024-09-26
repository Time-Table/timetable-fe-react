import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import { MOCKDATA } from "../../MOCKDATA";
import Arrow from "../../../../assets/svg/Arrow";
import { useState } from "react";

export default function Rank() {
  const rankData = MOCKDATA.rank;

  // rankDetail 상태를 배열로 관리 (기본적으로 모두 false)
  const [rankDetails, setRankDetails] = useState(Array(rankData.length).fill(false));

  // rankDetail을 토글하는 함수
  const toggleRankDetail = (index) => {
    setRankDetails((prevDetails) =>
      prevDetails.map((detail, i) => (i === index ? !detail : detail))
    );
  };

  function formatDate(input) {
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const [year, month, day, hour, minute] = input.split(/[-:]/);
    const date = new Date(`${year}-${month}-${day}`);
    const dayOfWeek = daysOfWeek[date.getDay()];

    return `${parseInt(month)} / ${parseInt(day)} (${dayOfWeek}) ${hour} : ${minute}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {rankData.map((rank, index) => {
        const ranking = index + 1;
        const sum = rank.sum;
        const date = rank.date;

        return (
          <ContentDiv key={rank.id}>
            <RankButton key={index} onClick={() => toggleRankDetail(index)}>
              <span style={{ width: "50px", textAlign: "end", color: theme.color.primary }}>
                {ranking + " 위"}
              </span>
              <span style={{ width: "70px", textAlign: "end" }}>{sum + " 명"}</span>
              <span style={{ width: "200px", textAlign: "end" }}>{formatDate(date)}</span>
              <Arrow angle={rankDetails[index] ? 270 : 90} width={13} height={13} />
            </RankButton>
            <RankDetailBox rankDetail={rankDetails[index]}>
              {rank.members.map((member, index) => {
                return <MemberDiv key={index}>{member}</MemberDiv>;
              })}
            </RankDetailBox>
          </ContentDiv>
        );
      })}
    </div>
  );
}

const ContentDiv = styled.div`
  ${theme.styles.flexCenterColumn};
  width: 380px;
  gap: 20px;
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
`;

const RankDetailBox = styled.div`
  justify-content: flex-start;
  width: 100%;
  gap: 10px;
  background: ${theme.text.gamma[900]};
  flex-wrap: wrap;
  border-radius: 10px;
  display: ${(props) => (props.rankDetail ? "flex" : "none")};
  padding: 10px;
`;

const MemberDiv = styled.div`
  ${theme.styles.flexCenterRow}
  padding:  10px 16px;
  font-family: Pretendard-Light;
  font-size: 20px;
`;
