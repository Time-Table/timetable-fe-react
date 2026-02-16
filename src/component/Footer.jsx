import React from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

const Footer = () => {
  const email = "timetable2official@gmail.com";

  const handleContactClick = (e) => {
    e.preventDefault();
    Swal.fire({
      icon: "success",
      iconColor: `${theme.color.primary}`,
      title: "문의하기",
      html: `사용 중 불편을 드렸다면 죄송합니다.<br>메일 보내주시면 확인 후 답변드리겠습니다.<br>감사합니다.<br><br><strong>${email}</strong>`,
      confirmButtonText: "메일 복사",
      confirmButtonColor: `${theme.color.button.blue}`,
      showCancelButton: true,
      cancelButtonText: "취소",
      cancelButtonColor: `${theme.text.gamma[800]}`,
      preConfirm: () => {
        return navigator.clipboard
          .writeText(email)
          .then(() => {
            Swal.fire({
              icon: "success",
              iconColor: `${theme.color.button.blue}`,
              title: "메일 주소 복사됨",
              text: "메일 주소가 클립보드에 복사되었습니다.",
              showConfirmButton: false,
              timer: 1700,
            });
          })
          .catch(() => {
            Swal.fire({
              icon: "error",
              iconColor: `${theme.color.primary}`,
              title: "복사 실패",
              text: "메일 주소를 복사하는 중 문제가 발생했습니다. 직접 복사해주세요.",
              showConfirmButton: false,
              timer: 2000,
            });
          });
      },
    });
  };

  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <FooterLogo>타임테이블2</FooterLogo>
          <FooterDescription>
            복잡한 일정 조율을 간단하게. <br />
            링크 하나로 시작하는 스마트한 약속 잡기.
          </FooterDescription>
        </FooterSection>
        
        <FooterLinks>
          <LinkGroup>
            <h4>서비스</h4>
            <Link to="/about">소개</Link>
            <Link to="/guide">이용 가이드</Link>
          </LinkGroup>
          <LinkGroup>
            <h4>정책</h4>
            <Link to="/terms">이용약관</Link>
            <Link to="/privacy">개인정보처리방침</Link>
          </LinkGroup>
          <LinkGroup>
            <h4>고객지원</h4>
            <a href="#contact" onClick={handleContactClick}>문의하기 (Q&A)</a>
          </LinkGroup>
        </FooterLinks>
      </FooterContent>
      <FooterBottom>
        <p>&copy; 2026 Timetable2. All rights reserved.</p>
      </FooterBottom>
    </FooterContainer>
  );
};

const FooterContainer = styled.footer`
  background-color: white;
  border-top: 1px solid ${theme.text.gamma[900]};
  padding: 60px 20px 30px;
  width: 100%;
  box-sizing: border-box;
`;

const FooterContent = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  gap: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FooterLogo = styled.div`
  font-family: "Pretendard-Bold";
  font-size: 20px;
  color: ${theme.color.primary};
`;

const FooterDescription = styled.p`
  font-size: 14px;
  color: ${theme.text.gamma[500]};
  line-height: 1.6;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 20px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 30px;
  }
`;

const LinkGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  h4 {
    font-family: "Pretendard-Bold";
    font-size: 16px;
    color: ${theme.text.gamma[100]};
    margin: 0 0 5px 0;
  }

  a {
    font-size: 14px;
    color: ${theme.text.gamma[500]};
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: ${theme.color.primary};
    }
  }
`;

const FooterBottom = styled.div`
  max-width: 1000px;
  margin: 40px auto 0;
  padding-top: 20px;
  border-top: 1px solid ${theme.text.gamma[950]};
  text-align: center;
  
  p {
    font-size: 12px;
    color: ${theme.text.gamma[700]};
  }
`;

export default Footer;
