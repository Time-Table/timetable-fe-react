import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";
import Input from "../../../../component/Input";
import { useState } from "react";
import { joinUser } from "../../../../api/Use/joinUser";
import { getUserInfo } from "../../../../api/Use/getUserInfo";
import { deleteUser } from "../../../../api/Use/deleteUser";
import Swal from "sweetalert2";
import { FiLogIn } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

export default function AddUser({
     name: beforeName,
     setRightScreen,
     tableId,
     setSelectedToggle,
     setName: setAfterName,
}) {
     const inputCondition = /^[A-Za-z0-9\uAC00-\uD7A3\u3131-\u318E\s]+$/;
     const [name, setName] = useState(beforeName ? beforeName : "");
     const [password, setPassword] = useState("");

     const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          padding: "1em",
          customClass: {
               popup: "custom-swal-popup",
               title: "custom-swal-title",
          },
     });

     const deleteMember = async (name, password) => {
          if (!name || !password) {
               Toast.fire({
                    icon: "error",
                    iconColor: `${theme.color.primary}`,
                    title: "이름과 비밀번호를 모두 입력해주세요.",
               });
               return;
          }
          const user = await getUserInfo(tableId, name, password);
          if (user.code !== 200) {
               Toast.fire({
                    icon: "error",
                    iconColor: `${theme.color.primary}`,
                    title: user.message || "사용자 정보가 일치하지 않습니다.",
               });
               return;
          }

          const res = await deleteUser(tableId, name, password);
          if (res?.success) {
               Toast.fire({
                    icon: "success",
                    iconColor: `${theme.color.button.blue}`,
                    title: "참여 정보가 삭제되었습니다.",
               });
               localStorage.removeItem("name");
               setTimeout(() => window.location.reload(), 1000);
          } else {
               Toast.fire({
                    icon: "error",
                    iconColor: `${theme.color.primary}`,
                    title: res?.message || "삭제 중 문제가 발생했습니다.",
               });
          }
     };

     const handleSuccess = (userName) => {
          localStorage.setItem("name", userName);
          setAfterName(userName);
          setRightScreen("MySchedule");
          setSelectedToggle("내 일정");
     };

     const updateMember = async (name, password) => {
          if (name.length === 0 || password.length === 0) {
               Toast.fire({
                    icon: "error",
                    iconColor: `${theme.color.primary}`,
                    title: "이름과 비밀번호를 모두 입력해주세요.",
               });
               return;
          }
          if (!inputCondition.test(name) || !inputCondition.test(password)) {
               Toast.fire({
                    icon: "error",
                    iconColor: `${theme.color.primary}`,
                    title: "이름과 비밀번호는 영문자, 숫자, 한글, 공백만 사용할 수 있습니다.",
               });
               return;
          }

          const user = await joinUser(tableId, name, password);
          if (user) {
               switch (user.code) {
                    case 200: // 기존 유저 로그인 성공
                         Toast.fire({
                              icon: "success",
                              iconColor: `${theme.color.button.blue}`,
                              title: "로그인되었습니다. 일정을 수정해 주세요.",
                         });
                         handleSuccess(user.data.name);
                         break;
                    case 201: // 신규 유저 참여 성공
                         Toast.fire({
                              icon: "success",
                              iconColor: `${theme.color.button.blue}`,
                              title: user.message,
                         });
                         handleSuccess(user.data.name);
                         Swal.fire({
                              icon: "success",
                              iconColor: `${theme.color.primary}`,
                              title: "환영합니다!",
                              text: "모두가 볼 수 있게 가능한 시간을 선택해주세요.",
                              confirmButtonText: "확인",
                              confirmButtonColor: `${theme.color.primary}`,
                              customClass: {
                                   popup: "custom-swal-popup",
                                   title: "custom-swal-title",
                                   htmlContainer: "custom-swal-html-container",
                                   confirmButton: "custom-swal-confirm-button",
                              },
                         });
                         break;
                    case 401:
                    case 402:
                    default:
                         Toast.fire({
                              icon: "error",
                              iconColor: `${theme.color.primary}`,
                              title: user.message || "오류가 발생했습니다.",
                         });
                         break;
               }
          }
     };

     return (
          <AnimatePresence>
               <Frame initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Header>
                         <FiLogIn size={32} color={theme.color.primary} />
                         <HeaderText>내 일정 등록/수정</HeaderText>
                    </Header>
                    <ContentFrame>
                         <Input
                              placeholder="이름을 입력해주세요."
                              onChange={(e) => {
                                   const inputValue = e.target.value;
                                   if (inputValue.startsWith(" ")) return;
                                   setName(e.target.value);
                                   if (e.target.value.length >= 15) {
                                        Toast.fire({
                                             icon: "warning",
                                             title: "최대 15자까지 입력 가능합니다.",
                                        });
                                   }
                              }}
                              value={name}
                              maxLength={15}
                         />
                         <Input
                              placeholder="비밀번호를 입력해주세요."
                              onChange={(e) => setPassword(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && updateMember(name, password)}
                              value={password}
                              maxLength={15}
                              type="password"
                         />
                    </ContentFrame>
                    <ButtonLayout>
                         <Button
                              title="참여 / 수정"
                              variant="primary"
                              onClick={() => updateMember(name, password)}
                              disabled={!name || !password}
                              width="65%"
                         />
                         <Button
                              title="나가기"
                              variant="secondary"
                              onClick={() => deleteMember(name, password)}
                              disabled={!name || !password}
                              width="30%"
                         />
                    </ButtonLayout>
                    <TermsPrivacyContainer>
                         <TermsPrivacyText onClick={() => (window.location.href = "/terms")}>이용약관</TermsPrivacyText>
                         <span>|</span>
                         <TermsPrivacyText onClick={() => (window.location.href = "/privacy")}>
                              개인정보처리방침
                         </TermsPrivacyText>
                    </TermsPrivacyContainer>
               </Frame>
          </AnimatePresence>
     );
}

const Frame = styled(motion.div)`
     width: 100%;
     display: flex;
     flex-direction: column;
     gap: 30px;
     background-color: white;
     border-radius: 16px;
     padding: 30px;
     box-sizing: border-box;
     box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const Header = styled.div`
     display: flex;
     align-items: center;
     gap: 12px;
`;

const HeaderText = styled.h2`
     font-family: "Pretendard-Bold";
     font-size: 24px;
     color: ${theme.text.gamma[200]};
     margin: 0;
`;

const ContentFrame = styled.div`
     display: flex;
     flex-direction: column;
     gap: 24px;
     width: 100%;
`;

const ButtonLayout = styled.div`
     display: flex;
     width: 100%;
     gap: 10px;
     margin-top: 10px;
`;

const TermsPrivacyContainer = styled.div`
     display: flex;
     justify-content: center;
     align-items: center;
     gap: 10px;
     margin-top: 10px;
     font-size: 13px;
     color: ${theme.text.gamma[500]};
`;

const TermsPrivacyText = styled.span`
     text-decoration: underline;
     cursor: pointer;
     transition: color 0.2s;

     &:hover {
          color: ${theme.color.primary};
     }
`;
