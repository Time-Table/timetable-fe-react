import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";
import Input from "../../../../component/Input";
import { useEffect, useState } from "react";
import { joinUser } from "../../../../api/Use/joinUser";
import { getUserInfo } from "../../../../api/Use/getUserInfo";
import { deleteUser } from "../../../../api/Use/deleteUser";
import Swal from "sweetalert2";
import Enter from "../../../../assets/svg/Enter.png";
import { keyframes } from "@emotion/react";

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

     useEffect(() => {
          setSelectedToggle("참여하기");
     }, [setSelectedToggle]);

     const Toast = Swal.mixin({
          toast: true,
          showConfirmButton: false,
          timer: 2000,
          padding: "1em",
     });

     const deleteMember = async (name, password) => {
          try {
               if (!name || !password) {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: "이름과 비밀번호를 모두 입력해주세요.",
                    });
                    return;
               }
               const user = await getUserInfo(tableId, name, password);
               if (!user) {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: "서버와의 연결이 원활하지 않습니다. 다시 시도해주세요.",
                    });
                    return;
               }
               if (user.code === 201) {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: user.message,
                    });
                    return;
               }
               if (user.code === 401) {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: user.message || "입력하신 비밀번호가 올바르지 않습니다.",
                    });
                    return;
               }
               if (user.code === 400) {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: user.message || "필수 정보를 모두 입력해주세요.",
                    });
                    return;
               }
               if (user.code !== 200) {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: "알 수 없는 오류가 발생했습니다. 다시 시도해주세요.",
                    });
                    return;
               }
               const res = await deleteUser(tableId, name, password);
               if (res?.success) {
                    Toast.fire({
                         icon: "success",
                         iconColor: `${theme.color.button.blue}`,
                         title: "유저가 성공적으로 삭제되었습니다.",
                    });
                    localStorage.removeItem("name", name);
                    setTimeout(() => {
                         window.location.reload();
                    }, 1000);
               } else {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: res?.message || "삭제 요청 중 문제가 발생했습니다.",
                    });
               }
          } catch (error) {
               console.error("Error in deleteMember: ", error);
               if (error.response) {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: error.response.data?.message || "서버 요청 중 문제가 발생했습니다.",
                    });
               } else {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: "네트워크 문제로 요청을 처리할 수 없습니다. 다시 시도해주세요.",
                    });
               }
          }
     };

     const updateMember = async (name, password) => {
          const availableTimes = [];
          if (name.length === 0 || password.length === 0) {
               Toast.fire({
                    icon: "error",
                    iconColor: `${theme.color.primary}`,
                    title: "이름과 비밀번호를 모두 입력해주세요.",
               });
               return;
          }
          try {
               if (!inputCondition.test(name)) {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: "이름은 영문자, 숫자, 한글, 공백만 사용할 수 있습니다.",
                    });
                    return;
               }

               if (!inputCondition.test(password)) {
                    Toast.fire({
                         icon: "error",
                         iconColor: `${theme.color.primary}`,
                         title: "비밀번호는 영문자, 숫자, 한글, 공백만 사용할 수 있습니다.",
                    });
                    return;
               }
               const user = await joinUser(tableId, name, password, availableTimes);
               if (user) {
                    switch (user.code) {
                         case 200: // 유저가 존재하는 경우
                              Toast.fire({
                                   icon: "success",
                                   iconColor: `${theme.color.button.blue}`,
                                   title: "등록된 유저로 로그인합니다.", // 유저가 있으니까 수정 페이지 이동
                              });
                              localStorage.setItem("name", user.data.name);
                              setRightScreen("MySchedule");
                              setSelectedToggle("내 일정");
                              setAfterName(name);
                              return;

                         case 201: // 유저가 없어서 새로 가입 가능
                              Toast.fire({
                                   icon: "success",
                                   iconColor: `${theme.color.button.blue}`,
                                   title: user.message,
                              });
                              localStorage.setItem("name", user.data.name);
                              setRightScreen("MySchedule");
                              setSelectedToggle("내 일정");
                              setAfterName(name);
                              Swal.fire({
                                   icon: "success",
                                   iconColor: `${theme.color.primary}`,
                                   title: `<div style="font-size: 0.8em;">환영합니다!</div>`,
                                   html: `<div class="${CustomText.className}">모두가 볼 수 있게 가능한 시간을 선택해주세요.</div>`,
                                   showConfirmButton: false,
                                   showCancelButton: true,
                                   cancelButtonText: "확인",
                                   cancelButtonColor: `${theme.color.primary}`,
                                   width: "23em",
                              });
                              return;

                         case 401: // id 양식 x
                              Toast.fire({
                                   icon: "error",
                                   iconColor: `${theme.color.primary}`,
                                   title: user.message,
                              });
                              return;

                         case 402: // 비밀번호가 양식 x
                              Toast.fire({
                                   icon: "error",
                                   iconColor: `${theme.color.primary}`,
                                   title: user.message,
                              });
                              return;

                         default:
                              Toast.fire({
                                   icon: "error",
                                   iconColor: `${theme.color.primary}`,
                                   title: "알 수 없는 오류가 발생했습니다.",
                              });
                              return;
                    }
               }
          } catch (error) {
               console.error("Error in updateMember:", error);
               Toast.fire({
                    icon: "error",
                    iconColor: `${theme.color.primary}`,
                    title: "오류가 발생했습니다. 다시 시도해주세요.",
               });
          }
     };

     return (
          <Frame>
               <div
                    style={{
                         display: "flex",
                         flexDirection: "column",
                         alignItems: "center",
                    }}
               >
                    <AnimatedImage src={Enter} alt="Copy Icon" />
                    <AnimatedText>입장하기</AnimatedText>
               </div>
               <ContentFrame>
                    <ContentDiv>
                         <SubTitleDiv>이름</SubTitleDiv>
                         <InputLayout>
                              <Input
                                   placeholder={"보여질 이름을 입력해주세요."}
                                   underLine={theme.text.gamma[800]}
                                   onChange={(e) => {
                                        const inputValue = e.target.value;
                                        if (inputValue.startsWith(" ")) {
                                             Toast.fire({
                                                  icon: "error",
                                                  iconColor: `${theme.color.primary}`,
                                                  title: "이름의 첫 글자는 공백일 수 없습니다.",
                                             });
                                             return;
                                        }
                                        setName(e.target.value);
                                        if (e.target.value.length >= 15) {
                                             Toast.fire({
                                                  icon: "error",
                                                  iconColor: `${theme.color.primary}`,
                                                  title: "최대 15 자까지만 입력 가능합니다.",
                                             });
                                        }
                                   }}
                                   value={name}
                                   maxLength={15}
                              />
                         </InputLayout>
                    </ContentDiv>
                    <ContentDiv>
                         <SubTitleDiv>비밀번호</SubTitleDiv>
                         <InputLayout>
                              <Input
                                   placeholder={"비밀번호를 입력해주세요."}
                                   underLine={theme.text.gamma[800]}
                                   onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (e.target.value.length >= 15) {
                                             Toast.fire({
                                                  icon: "error",
                                                  iconColor: `${theme.color.primary}`,
                                                  title: "최대 15 자까지만 입력 가능합니다.",
                                             });
                                        }
                                   }}
                                   onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                             updateMember(name, password);
                                        }
                                   }}
                                   value={password}
                                   maxLength={15}
                                   type={"password"}
                              />
                         </InputLayout>
                    </ContentDiv>
               </ContentFrame>
               <ButtonLayout>
                    <ButtonDiv>
                         <Button
                              title="완료"
                              background={theme.color.button.blue}
                              onClick={() => {
                                   updateMember(name, password);
                              }}
                              disabled={!name || !password ? true : false}
                         />
                    </ButtonDiv>

                    <ButtonDiv>
                         <Button
                              title="삭제"
                              onClick={() => {
                                   deleteMember(name, password);
                              }}
                              disabled={false}
                         />
                    </ButtonDiv>
               </ButtonLayout>
               <TermsPrivacyContainer>
                    <TermsPrivacyText onClick={() => (window.location.href = "/terms")}>이용약관</TermsPrivacyText>
                    <span> | </span>
                    <TermsPrivacyText onClick={() => (window.location.href = "/privacy")}>
                         개인정보처리방침
                    </TermsPrivacyText>
               </TermsPrivacyContainer>
          </Frame>
     );
}

const Frame = styled.div`
     width: 100%;
     height: 100%;
     display: flex;
     justify-content: center;
     align-items: center;
     flex-direction: column;
     gap: 30px;
     background-color: #fbfbfb;
     border-radius: 50px;
     padding: 40px;
     box-sizing: border-box;

     @media (max-width: 480px) {
          border-radius: 50px 50px 0px 0px;
          padding: 40px 30px;
     }
`;

const TermsPrivacyContainer = styled.div`
     display: flex;
     justify-content: center;
     align-items: center;
     margin-top: 10px;
     font-size: 14px;
     color: ${theme.text.gamma[500]};
     cursor: pointer;

     @media (max-width: 480px) {
          font-size: 12px;
     }
`;

const TermsPrivacyText = styled.span`
     color: ${theme.text.gamma[700]};
     text-decoration: underline;
     cursor: pointer;
     margin: 0 5px;

     &:hover {
          color: ${theme.color.primary};
     }
`;

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const AnimatedImage = styled.img`
     @media (max-width: 480px) {
          animation: ${fadeIn} 1s ease-in-out;
     }
`;

const AnimatedText = styled.span`
     color: ${theme.color.button.blue};
     font-family: Pretendard-SemiBold;
     font-size: 28px;

     @media (max-width: 480px) {
          animation: ${fadeIn} 1.2s ease-in-out;
          font-size: 24px;
     }
`;

const ContentFrame = styled.div`
     ${theme.styles.flexCenterColumn}
     font-family: Pretendard-SemiBold;
     width: 100%;
     gap: 30px;
`;

const ButtonLayout = styled.div`
     ${theme.styles.flexCenterRow}
     width: 100%;
     gap: 50px;
`;

const ButtonDiv = styled.div`
     display: flex;
     width: 160px;
     height: 56px;
     button {
          font-size: 20px;
     }

     @media (max-width: 480px) {
          width: 140px;
          height: 50px;
          button {
               font-size: 16px;
          }
     }
`;

const ContentDiv = styled.div`
     ${theme.styles.flexCenterColumn};
     gap: 20px;
     @media (max-width: 480px) {
          gap: 10px;
     }
`;

const SubTitleDiv = styled.div`
     font-size: 20px;
`;

const InputLayout = styled.div`
     @media (max-width: 480px) {
          width: 90%;
     }
`;
const CustomText = styled.div`
     font-size: 2em;
`;
