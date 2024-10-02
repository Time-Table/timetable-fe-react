import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import Button from "../../../../component/Button";
import Input from "../../../../component/Input";
import { useState } from "react";
import { MOCKDATA } from "../../MOCKDATA";

export default function AddUser({ setLeftScreen, setRightScreen, setName, name }) {
  const [password, setPassword] = useState("");
  const inputCondition = /^[A-Za-z0-9\uAC00-\uD7A3\u3131-\u318E\s]+$/;
  const allofMember = MOCKDATA.memberNames;
  const membersPrivacy = MOCKDATA.membersPrivacy;

  const searchMember = (name) => allofMember.includes(name);

  const deleteMember = (name, password) => {
    const member = membersPrivacy.find((member) => member.name === name);
    if (member && member.password === password) {
      //TODO: 삭제 api
      alert("삭제되었습니다.(삭제API자리)");

      return console.log(true);
    } else {
      alert("입력하신 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <Frame>
      <TitleFrame>멤버 추가 및 수정</TitleFrame>
      <ContentFrame>
        <ContentDiv>
          <SubTitleDiv>이름</SubTitleDiv>
          <InputLayout>
            <Input
              placeholder={"*타임 테이블은 이름 중복을 허용하지 않습니다."}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.length >= 15) {
                  alert("최대 15글자까지만 입력 가능합니다.");
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
              placeholder={"*비밀번호는 1~15자리까지 입력할 수 있습니다."}
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
          </InputLayout>
        </ContentDiv>
      </ContentFrame>
      <ButtonLayout>
        <ButtonDiv>
          <Button
            title="생성"
            background={theme.color.button.blue}
            onClick={() => {
              if (inputCondition.test(name)) {
                if (searchMember(name)) {
                  return alert("이미 존재하는 이름입니다.");
                }

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

        <ButtonDiv>
          <Button
            title="삭제"
            onClick={() => {
              deleteMember(name, password);
            }}
            disabled={searchMember(name) ? false : true}
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
