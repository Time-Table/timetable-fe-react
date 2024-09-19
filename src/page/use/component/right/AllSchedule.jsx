import styled from "@emotion/styled/macro";
import Share from "../../../../assets/svg/Share";
import Input from "../../../../component/Input";
import theme from "../../../../theme";
import { MOCKDATA } from "../../MOCKDATA";
import Send from "../../../../assets/svg/Send";
import { useState } from "react";

export default function AllSchedule() {
  const [message, setMessage] = useState();
  const memberName = MOCKDATA.memberNames;
  return (
    <>
      <MembersLayout>
        {memberName.map((name) => {
          return <MemberDiv>{name}</MemberDiv>;
        })}
      </MembersLayout>

      <ChatLayout>
        채팅
        <ChatingDiv>
          {MOCKDATA.chatLog.map((chat) => (
            <ChatDiv key={chat.id}>
              <NameDiv>{chat.name} :</NameDiv>
              <div style={{ width: "343px", height: "100%" }}>{chat.message}</div>
            </ChatDiv>
          ))}
        </ChatingDiv>
        <InputLayout>
          <Input
            fontSize={"22px"}
            placeholder={"일정을 추가하고 채팅을 이용해 보세요."}
            maxLength={300}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            value={message}
          />
          <SendButtonBox
            onClick={() => {
              if (message) {
                console.log(message); // message가 있는 경우에만 출력
              } else {
                console.log("메시지를 입력해주세요."); // message가 없을 때 안내 메시지 출력
              }
            }}
          >
            <Send />
          </SendButtonBox>
        </InputLayout>
      </ChatLayout>
    </>
  );
}

const MembersLayout = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
  gap: 10px;
  padding-bottom: 30px;
  border-bottom: 1px solid ${theme.text.gamma[800]};
`;

const MemberDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-Light;
  font-size: 24px;
`;

const ChatLayout = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
  gap: 20px;
  font-size: 25px;
`;

const ChatingDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 423px;
  gap: 10px;
  max-height: 166px;
  overflow-y: auto;
  scroll-behavior: smooth;
`;

const ChatDiv = styled.div`
  ${theme.styles.flexCenterRow}
  font-family: Pretendard-Light;
  width: 100%;
  gap: auto;
  font-size: 22px;
`;

const NameDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-family: Pretendard-Regular;
  font-size: 22px;
  width: 70px;
  height: 100%;
`;

const InputLayout = styled.div`
  ${theme.styles.flexCenterRow}
  width: 423px;
`;

const SendButtonBox = styled.button`
  ${theme.styles.flexCenterRow}
  background: none;
  border: none;
`;
