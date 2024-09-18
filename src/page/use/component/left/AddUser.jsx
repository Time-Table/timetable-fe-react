import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";
import Input from "../../../../component/Input";

export default function AddUser() {
  return (
    <>
      <TitleFrame>
        <div style={{ fontSize: "32px" }}>{"추가 및 수정"}</div>
      </TitleFrame>

      <ContentFrame>
        <div style={{ fontSize: "28px" }}>이름</div>
        <div style={{ width: "423px" }}>
          <Input placeholder={"일정에 표시될 성함이나 닉네임을 작성해주세요."} />
        </div>
        <div style={{ fontSize: "28px" }}>비밀번호(선택)</div>
        <div style={{ width: "423px" }}>
          <Input placeholder={"일정 수정 및 삭제에 이용될 비밀번호 4자리를 입력하세요"} />
        </div>
        <ButtonLayout>
          <ButtonDiv>
            <Button title="완료" />
          </ButtonDiv>
        </ButtonLayout>
      </ContentFrame>
    </>
  );
}

const TitleFrame = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
`;

const ContentFrame = styled.div`
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
