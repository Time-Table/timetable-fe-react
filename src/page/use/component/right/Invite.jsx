import styled from "@emotion/styled/macro";
import Button from "../../../../component/Button";
import theme from "../../../../theme";
import Swal from "sweetalert2";
import { useEffect } from "react";
import { keyframes } from "@emotion/react";
import { MdContentCopy } from "react-icons/md";
import { GrShareOption } from "react-icons/gr";

export default function Invite({ setRightScreen, tableId, title, setSelectedToggle }) {
  const tableUrl = `${process.env.REACT_APP_DOMAIN_URL}/table/${tableId}`;

  useEffect(() => {
    setSelectedToggle("초대하기");
  }, []);

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
      <Title>
        <AnimatedDiv alt="Copy Icon">
          <MdContentCopy size={40} />
        </AnimatedDiv>

        <AnimatedText>초대하기</AnimatedText>
      </Title>
      <TitleFrame>
        <TitleDiv>{title}</TitleDiv>
      </TitleFrame>
      <ContentFrame>
        <UrlDiv>
          <GrShareOption color={theme.text.gamma[500]} size={30} />

          {tableUrl}
        </UrlDiv>
        <ButtonLayout>
          <ButtonDiv>
            <Button
              title="링크 복사"
              background={theme.color.button.blue}
              onClick={() => {
                copyToClipboard();
                setRightScreen("MySchedule");
              }}
            />
          </ButtonDiv>
        </ButtonLayout>
      </ContentFrame>
    </Frame>
  );
}

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const AnimatedDiv = styled.div`
  @media (max-width: 480px) {
    animation: ${fadeIn} 1s ease-in-out;
  }
`;

const AnimatedText = styled.span`
  @media (max-width: 480px) {
    animation: ${fadeIn} 1.2s ease-in-out;
  }
`;

const Frame = styled.div`
  width: 65%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  background-color: #fbfbfb;
  border-radius: 50px;
  padding: 40px 30px 200px 30px;
  @media (max-width: 480px) {
    width: 70%;
    font-size: 24px;
    border-radius: 50px 50px 0px 0px;
    padding: 40px 30px 300px 30px;
  }
`;

const TitleFrame = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 90%;
`;

const ContentFrame = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
  gap: 30px;
`;

const UrlDiv = styled.div`
  ${theme.styles.flexCenterRow}
  background-color:white;
  font-family: Pretendard-Regular;
  font-size: 20px;
  width: 100%;
  height: 50px;
  border-radius: 30px;
  padding: 8px;
  border: 2px solid ${theme.text.gamma[800]};
  gap: 5px;

  @media (max-width: 480px) {
    font-size: 14px;
    width: 100%;
    height: 35px;
    justify-content: space-evenly;
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
  font-size: 28px;
  color: ${(props) => props.color};
  @media (max-width: 480px) {
    font-size: 25px;
  }
`;

const Title = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
  font-size: 28px;
  color: ${theme.color.button.blue};
  @media (max-width: 480px) {
    font-size: 24px;
  }
`;
