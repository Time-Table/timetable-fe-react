import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";
import Input from "../../../../component/Input";
import { useState } from "react";

export default function AddUser({ setLeftScreen, setRightScreen }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const inputCondition = /^[A-Za-z0-9\uAC00-\uD7A3\u3131-\u318E\s]+$/;

  return (
    <Frame>
      <TitleFrame>
        <div style={{ fontSize: "32px" }}>{"추가 및 수정"}</div>
      </TitleFrame>

      <ContentFrame>
        <ContentDiv>
          <div style={{ fontSize: "28px" }}>이름</div>
          <div style={{ width: "423px" }}>
            <Input
              placeholder={"일정에 표시될 성함이나 닉네임을 작성해주세요."}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.length >= 15) {
                  alert("최대 15글자까지만 입력 가능합니다.");
                }
              }}
              value={name}
              maxLength={15}
            />
          </div>
        </ContentDiv>
        <ContentDiv>
          <div style={{ fontSize: "28px" }}>비밀번호(선택)</div>
          <div style={{ width: "423px" }}>
            <Input
              placeholder={"*비밀번호는 일정 수정과 삭제에 사용됩니다."}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value.length >= 15) {
                  alert("최대 15글자까지만 입력 가능합니다.");
                }
              }}
              value={password}
              maxLength={15}
              type={"password"}
            />
          </div>
        </ContentDiv>
      </ContentFrame>
      <ButtonLayout>
        <ButtonDiv>
          <Button
            title="생성"
            onClick={() => {
              if (inputCondition.test(name)) {
                if (inputCondition.test(password) || password === "") {
                  console.log("name: ", name);
                  console.log("password: ", password);

                  localStorage.clear();
                  localStorage.setItem("name", name);

                  setLeftScreen("AllTimeGrid");
                  setRightScreen("MySchedule");
                } else {
                  alert("비밀번호는 영문자, 숫자, 한글, 공백만 사용할 수 있습니다.");
                }
              } else {
                alert("이름은 영문자, 숫자, 한글, 공백만 사용할 수 있습니다.");
              }
            }}
            //TODO: 닉넴 중복? 비번 자리 수 체크
            disabled={name.length === 0 ? true : false}
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

const ContentDiv = styled.div`
  ${theme.styles.flexCenterColumn};
  gap: 20px;
`;
