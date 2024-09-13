import styled from "@emotion/styled/macro";
import Share from "../../../../assets/svg/Share";
import Button from "../../../../component/Button";
import theme from "../../../../theme";

export default function AllSchedule() {
  const url = "https://www.naver.com";
  const title = "공학 설계 입문 12차 회의";
  return (
    <>
      <ButtonLayout>
        <ButtonDiv>
          <Button background={theme.color.button.blue} title="초대하기" />
        </ButtonDiv>
        <ButtonDiv>
          <Button background={theme.color.primary} title="일정추가" />
        </ButtonDiv>
      </ButtonLayout>
      <TitleFrame>
        <div style={{ fontSize: "32px" }}>{title}</div>
        <div style={{ fontSize: "32px", color: theme.color.primary }}>타임테이블</div>
      </TitleFrame>

      <DefaultFrame>
        <div style={{ fontSize: "32px" }}>링크를 복사하여 초대하세요.</div>
        <UrlDiv>
          <Share />
          {url}
        </UrlDiv>
      </DefaultFrame>
    </>
  );
}

const TitleFrame = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
`;

const DefaultFrame = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
  gap: 30px;
`;

const UrlDiv = styled.div`
  ${theme.styles.flexCenterRow}
  background-color:${theme.text.gamma[900]};
  font-family: Pretendard-Regular;
  font-size: 24px;
  width: 100%;
  height: 50px;
  border-radius: 10px;
`;
const ButtonLayout = styled.div`
  ${theme.styles.flexCenterRow}
  width: 100%;
  @media (max-width: 480px) {
    width: 320px;
  }
`;

const ButtonDiv = styled.div`
  display: flex;
  width: 160px;
  height: 56px;
  button {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    width: 100%;
    height: 50px;
    button {
      font-size: 16px;
    }
  }
`;
