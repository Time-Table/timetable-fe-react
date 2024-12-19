import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";
import Input from "../../../../component/Input";
import { useEffect, useState } from "react";
import { joinUser } from "../../../../api/Use/joinUser";
import { getUserInfo } from "../../../../api/Use/getUserInfo";
import { deleteUser } from "../../../../api/Use/deleteUser";
import Swal from "sweetalert2";

export default function AddUser({
  name: beforeName,
  setLeftScreen,
  setRightScreen,
  tableId,
  setSelectedToggle,
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

      // 1. 유저 정보 확인
      const user = await getUserInfo(tableId, name, password);
      // 2. 유저 정보가 없는 경우
      if (!user) {
        Toast.fire({
          icon: "error",
          iconColor: `${theme.color.primary}`,
          title: "서버와의 연결이 원활하지 않습니다. 다시 시도해주세요.",
        });
        return;
      }
      // 3. 존재하지 않는 유저
      if (user.code === 201) {
        Toast.fire({
          icon: "error",
          iconColor: `${theme.color.primary}`,
          title: user.message,
        });
        return;
      }
      // 4. 비밀번호 오류
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
      // 5. 기타 서버 오류
      if (user.code !== 200) {
        Toast.fire({
          icon: "error",
          iconColor: `${theme.color.primary}`,
          title: "알 수 없는 오류가 발생했습니다. 다시 시도해주세요.",
        });
        return;
      }

      // 6. 유저 삭제 요청
      const res = await deleteUser(tableId, name, password);

      // 7. 삭제 요청 처리
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

      // 8. 예외 상황 처리
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
        title: "이름과 비밀번호를 모두 입력해주세요.", // 유저가 있으니까 수정 페이지 이동
      });
      return;
    }
    try {
      // 1. 유저 정보를 가져옴
      const user = await getUserInfo(tableId, name, password);

      if (user) {
        switch (user.code) {
          case 200: // 유저가 존재하는 경우
            Toast.fire({
              icon: "success",
              iconColor: `${theme.color.button.blue}`,
              title: "등록된 유저로 로그인합니다.", // 유저가 있으니까 수정 페이지 이동
            });
            localStorage.setItem("name", user.data.name);
            setLeftScreen("AllTimeGrid");
            setRightScreen("MySchedule");
            setSelectedToggle("내 일정");
            return;

          case 201: // 유저가 없어서 새로 가입 가능
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

            // 3. 유저 정보가 없으므로 새로 가입 처리
            const res = await joinUser(tableId, name, password, availableTimes);
            if (res && res.code === 200) {
              Toast.fire({
                icon: "success",
                iconColor: `${theme.color.button.blue}`,
                title: res.message,
              });
              localStorage.setItem("name", res.data.name);
              setLeftScreen("AllTimeGrid");
              setRightScreen("MySchedule");
              setSelectedToggle("내 일정");
              return;
            } else if (res && res.code === 201) {
              localStorage.setItem("name", res.data.name);
              setLeftScreen("AllTimeGrid");
              setRightScreen("MySchedule");
              setSelectedToggle("내 일정");
              return;
            } else {
              Toast.fire({
                icon: "error",
                iconColor: `${theme.color.primary}`,
                title: "유저 등록에 실패했습니다. 다시 시도해주세요.",
              });
              return;
            }

          case 401: // 비밀번호가 틀린 경우
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
      <TitleFrame>회원 등록 / 수정</TitleFrame>
      <ContentFrame>
        <ContentDiv>
          <SubTitleDiv>이름</SubTitleDiv>
          <InputLayout>
            <Input
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
    </Frame>
  );
}

const TitleFrame = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
  font-size: 32px;

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const ContentFrame = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
  gap: 30px;
`;

const Frame = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 50px;
  gap: 50px;
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
`;

const SubTitleDiv = styled.div`
  font-size: 20px;
`;

const InputLayout = styled.div`
  width: 423px;

  @media (max-width: 480px) {
    width: 90%;
  }
`;
