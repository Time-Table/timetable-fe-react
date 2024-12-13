import styled from "@emotion/styled/macro";
import Share from "../../../../assets/svg/Share";
import Button from "../../../../component/Button";
import theme from "../../../../theme";
import Swal from "sweetalert2";

export default function Invite({ setLeftScreen, tableId, title }) {
  const tableUrl = "http://localhost:3000/table/" + tableId;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tableUrl).then(() => {
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
      });

      Toast.fire({
        icon: "success",
        iconColor: `${theme.color.button.blue}`,
        title: "링크를 복사했습니다.",
      });
    });
  };
  return (
    <Frame>
      <TitleFrame>
        <TitleDiv>{title}</TitleDiv>
        <TitleDiv color={theme.color.primary}>타임테이블</TitleDiv>
      </TitleFrame>

      <ContentFrame>
        <TitleDiv>링크를 복사하여 초대하세요.</TitleDiv>
        <UrlDiv>
          <Share />
          {tableUrl}
        </UrlDiv>
        <ButtonLayout>
          <ButtonDiv>
            <Button
              title="링크 복사"
              background={theme.color.button.blue}
              onClick={() => {
                copyToClipboard();
                setLeftScreen("AllTimeGrid");
              }}
            />
          </ButtonDiv>
        </ButtonLayout>
      </ContentFrame>
    </Frame>
  );
}
const Frame = styled.div`
  ${theme.styles.flexCenterColumn}
  margin-top: 140px;
  gap: 50px;
  width: 70%;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

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
  font-size: 20px;
  width: 100%;
  height: 50px;
  border-radius: 10px;

  @media (max-width: 480px) {
    font-size: 13px;
    width: 90%;
    height: 35px;
  }
`;
const ButtonLayout = styled.div`
  ${theme.styles.flexCenterRow}
  width: 100%;

  @media (max-width: 480px) {
    width: 140px;
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

const TitleDiv = styled.div`
  font-size: 24px;
  color: ${(props) => props.color};
`;
