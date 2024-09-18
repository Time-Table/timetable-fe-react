import styled from "@emotion/styled/macro";
import Share from "../../../../assets/svg/Share";
import Input from "../../../../component/Input";
import theme from "../../../../theme";
import { MOCKDATA } from "../../MOCKDATA";

export default function AllSchedule() {
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            width: "423px",
          }}
        >
          {MOCKDATA.chatLog.map((chat) => (
            <ChatDiv key={chat.id}>
              <div>{chat.name} :</div> {chat.message}
            </ChatDiv>
          ))}
        </div>
        <div style={{ width: "423px" }}>
          <Input fontSize={"22px"} placeholder={"일정을 추가하고 채팅을 이용해 보세요."} />
        </div>{" "}
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

const ChatDiv = styled.div`
  ${theme.styles.flexCenterRow}
  font-family: Pretendard-Light;

  gap: 10px;
  font-size: 22px;
`;
