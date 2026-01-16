import styled from "@emotion/styled";
import { css } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import theme from "../../theme";
import Seo from "../../Seo";
import { BsCalendarDate, BsLightningChargeFill } from "react-icons/bs";
import { IoHelpCircleOutline } from "react-icons/io5";
import Swal from "sweetalert2";

export default function CreatePage() {
  const navigate = useNavigate();

  const handleHelpClick = () => {
    Swal.fire({
      title: "생성 방식 안내",
      html: `
        <div style="text-align: left; padding: 0 1rem;">
          <h4 style="color: ${theme.color.button.blue}; margin-bottom: 5px;">빠른 생성</h4>
          <p style="margin-top: 0; font-size: 15px;">
            모임 이름, 날짜, 시간만 빠르게 입력하여<br>
            신속하게 타임테이블을 생성할 수 있습니다.
          </p>
          <h4 style="color: ${theme.text.gamma[600]}; margin-bottom: 5px;">일반 생성 (준비중)</h4>
          <p style="margin-top: 0; font-size: 15px;">
            날짜, 시간, 공통 불가 시간 등을 세부적으로 설정하여<br>
            정교한 타임테이블을 만들 수 있습니다.
          </p>
        </div>
      `,
      confirmButtonText: "확인",
      confirmButtonColor: `${theme.color.primary}`,
    });
  };

  return (
    <>
      <Seo title="타임테이블 - 생성" description="새로운 약속을 만들어보세요." />
      <PageWrapper>
        <Title>어떤 방식으로 생성할까요?</Title>
        <SelectionContainer>
          <SelectionBox onClick={() => navigate("/quick-create")}>
            <IconWrapper color={theme.color.primary}>
              <BsLightningChargeFill size={40} />
            </IconWrapper>
            <BoxTitle>빠른 생성</BoxTitle>
            <BoxDescription>필수 정보만으로</BoxDescription>
            <BoxDescription>신속하게</BoxDescription>
          </SelectionBox>
          <SelectionBox disabled>
            <IconWrapper color={theme.color.button.blue}>
              <BsCalendarDate size={40} />
            </IconWrapper>
            <BoxTitle>일반 생성</BoxTitle>
            <BoxDescription>{"세부 설정으로 정교하게"}</BoxDescription>
            <BoxDescription>{"(준비중)"}</BoxDescription>
          </SelectionBox>
        </SelectionContainer>
        <HelpContainer onClick={handleHelpClick}>
          <IoHelpCircleOutline size={24} color={theme.text.gamma[500]} />
          <span>각 생성 방식이 궁금하신가요?</span>
        </HelpContainer>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
  height: calc(100vh - 71px);
  padding: 20px;
  box-sizing: border-box;
`;

const Title = styled.h1`
  font-family: "Pretendard-SemiBold";
  font-size: 28px;
  margin-bottom: 40px;
  @media (max-width: 480px) {
    font-size: 24px;
    text-align: center;
  }
`;

const SelectionContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  @media (max-width: 480px) {
    flex-direction: row;
    width: 100%;
    gap: 15px;
  }
`;

const SelectionBox = styled.div`
     ${theme.styles.flexCenterColumn}
     width: 100%;
     max-width: 220px;
     aspect-ratio: 1 / 1;
     border: 1px solid ${theme.text.gamma[800]};
     border-radius: 20px;
     cursor: pointer;
     transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.3s ease, opacity 0.3s ease;
     background-color: white;
     padding: 20px;
     box-sizing: border-box;

     &:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
     }

     @media (max-width: 480px) {
          flex: 1;
          padding: 15px;
          justify-content: center;
     }
  ${(props) =>
    props.disabled &&
    css`
      filter: grayscale(100%);
      opacity: 0.6;
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: none;
      }
    `}
`;

const IconWrapper = styled.div`
  color: ${(props) => props.color};
  margin-bottom: 15px;
  @media (max-width: 480px) {
    margin-bottom: 10px;
    svg {
      width: 28px;
      height: 28px;
    }
  }
`;

const BoxTitle = styled.h2`
  font-family: "Pretendard-Bold";
  font-size: 22px;
  margin: 0 0 10px 0;
  text-align: center;
  @media (max-width: 480px) {
    font-size: 16px;
    margin-bottom: 5px;
  }
`;

const BoxDescription = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 16px;
  color: ${theme.text.gamma[500]};
  margin: 0;
  text-align: center;
  @media (max-width: 480px) {
    font-size: 12px;
    line-height: 1.3;
  }
`;

const HelpContainer = styled.div`
  ${theme.styles.flexCenterRow}
  margin-top: 40px;
  gap: 8px;
  cursor: pointer;
  color: ${theme.text.gamma[500]};
  font-family: "Pretendard-Regular";
  font-size: 16px;
  text-align: center;
  &:hover {
    color: ${theme.color.primary};
  }
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;
