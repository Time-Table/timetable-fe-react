import { useState, useEffect } from "react";
import styled from "@emotion/styled/macro";
import theme from "../theme";
import Swal from "sweetalert2";
import { IoHelpCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

export default function Header() {
     const email = "timetable2official@gmail.com";
     const navigate = useNavigate();

     const [isScrolled, setIsScrolled] = useState(false);

     useEffect(() => {
          const handleScroll = () => {
               setIsScrolled(window.scrollY > 10);
          };
          window.addEventListener("scroll", handleScroll);
          return () => {
               window.removeEventListener("scroll", handleScroll);
          };
     }, []);

     const handleLogoClick = () => navigate("/");
     const handleHelpClick = () => {
          Swal.fire({
               icon: "question",
               iconColor: `${theme.text.gamma[800]}`,
               title: "사이트 정보",
               text: "우리 사이트는 단체나 모임(스터디, 팀플, 회식 등) 행사의 수요 인원과 최적의 시간을 파악할 수 있도록 도와줍니다.",
               confirmButtonText: "자세히 보기",
               confirmButtonColor: `${theme.color.primary}`,
               showCancelButton: true,
               cancelButtonText: "취소",
               cancelButtonColor: `${theme.text.gamma[800]}`,
               preConfirm: () => navigate("/about"),
          });
     };
     const handleContactClick = () => {
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
     const handleCreateClick = () => navigate("/create");

     return (
          <HeaderWrapper scrolled={isScrolled}>
               <HeaderContainer>
                    <Logo onClick={handleLogoClick}>
                         <span className="logo-time">Time</span>
                         <span className="logo-table">Table</span>
                    </Logo>
                    <ActionContainer>
                         <IconButton onClick={handleHelpClick} aria-label="사이트 정보">
                              <IoHelpCircleOutline />
                         </IconButton>
                         <ContactButton onClick={handleContactClick} />
                         <PrimaryButton onClick={handleCreateClick}>새 테이블</PrimaryButton>
                    </ActionContainer>
               </HeaderContainer>
          </HeaderWrapper>
     );
}

function ContactButton({ onClick }) {
     return (
          <ResponsiveButton onClick={onClick}>
               <span className="button-text">Q&A</span>
          </ResponsiveButton>
     );
}

const HeaderWrapper = styled.header`
     position: sticky;
     top: 0;
     width: 100%;
     height: 72px;
     z-index: 1000;
     transition: box-shadow 0.3s ease;
     background-color: rgba(255, 255, 255, 0.8);
     backdrop-filter: blur(8px);
     -webkit-backdrop-filter: blur(8px);
     box-shadow: ${(props) => (props.scrolled ? "0 2px 12px rgba(0, 0, 0, 0.08)" : "none")};
`;

const HeaderContainer = styled.div`
     max-width: 1400px;
     height: 100%;
     margin: 0 auto;
     padding: 0 24px;
     display: flex;
     align-items: center;
     justify-content: space-between;
     box-sizing: border-box;
`;

const Logo = styled.button`
     background: none;
     border: none;
     padding: 0;
     cursor: pointer;
     font-family: "Pretendard-Bold", sans-serif;
     font-size: 28px;
     letter-spacing: -0.05em;
     transition: opacity 0.2s ease;

     .logo-time {
          font-family: "Pretendard-Bold", sans-serif;
          background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
     }
     .logo-table {
          color: ${theme.text.gamma[500]};
          font-family: "Pretendard-Light", sans-serif;
     }
     &:hover {
          opacity: 0.8;
     }
     @media (max-width: 480px) {
          font-size: 24px;
     }
`;

const ActionContainer = styled.div`
     display: flex;
     align-items: center;
     gap: 8px;
`;

const BaseButton = styled.button`
     display: inline-flex;
     align-items: center;
     justify-content: center;
     border: none;
     cursor: pointer;
     transition: all 0.2s ease;
     &:active {
          transform: scale(0.96);
     }
`;

const PrimaryButton = styled(BaseButton)`
     font-family: "Pretendard-SemiBold", sans-serif;
     height: 42px;
     padding: 0 24px;
     border-radius: 999px;
     font-size: 15px;
     color: white;
     background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
     box-shadow: 0 2px 8px rgba(0, 98, 204, 0.2);

     &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 98, 204, 0.3);
     }

     @media (max-width: 480px) {
          height: 38px;
          padding: 0 16px;
          font-size: 14px;
     }
`;

const IconButton = styled(BaseButton)`
     width: 42px;
     height: 42px;
     border-radius: 50%;
     background-color: transparent;
     color: ${theme.text.gamma[700]};

     svg {
          width: 24px;
          height: 24px;
     }

     &:hover {
          background-color: ${theme.text.gamma[100]};
          color: ${theme.text.gamma[900]};
     }

     @media (max-width: 480px) {
          width: 38px;
          height: 38px;
          svg {
               width: 22px;
               height: 22px;
          }
     }
`;

const ResponsiveButton = styled(BaseButton)`
     height: 42px;
     padding: 0 16px;
     border-radius: 8px;
     font-family: "Pretendard-Medium", sans-serif;
     background-color: transparent;
     color: ${theme.text.gamma[700]};

     &:hover {
          background-color: ${theme.text.gamma[100]};
          color: ${theme.text.gamma[900]};
     }

     @media (max-width: 768px) {
          width: 42px;
          padding: 0;
          border-radius: 50%;
     }

     @media (max-width: 480px) {
          width: 38px;
          height: 38px;
     }
`;
