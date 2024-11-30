import styled from "@emotion/styled/macro";
import Input from "../../../../component/Input";
import theme from "../../../../theme";
import { MOCKDATA } from "../../MOCKDATA";
import Send from "../../../../assets/svg/Send";
import { useEffect, useRef, useState } from "react";
import Edit from "../../../../assets/svg/Edit";

export default function AllSchedule({
  setLeftScreen,
  setRightScreen,
  setName,
  selectedName,
  setSelectedName,
  usersSchedule,
}) {
  const [message, setMessage] = useState();
  const names = usersSchedule.map((user) => user.name);
  const chatEndRef = useRef(null);
  const [memberDetails, setMemberDetails] = useState(Array(names.length).fill(false));

  const toggleMemberDetail = (index) => {
    setMemberDetails((prevDetails) => {
      const newDetails = Array(prevDetails.length).fill(false);
      newDetails[index] = !prevDetails[index];
      return newDetails;
    });

    if (names[index] === selectedName) {
      setSelectedName(false);
    } else {
      setSelectedName(names[index]);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, []);

  return (
    <>
      <MembersLayout>
        {names.map((name, index) => {
          return (
            <MemberContainer key={index}>
              <MemberDiv
                onClick={() => {
                  toggleMemberDetail(index);
                  setLeftScreen("AllTimeGrid");
                }}
                selected={selectedName === name}
              >
                {name}
              </MemberDiv>
              {memberDetails[index] ? (
                <EditBox
                  memberDetails={memberDetails[index]}
                  onClick={() => {
                    setName(name);
                    setRightScreen("AddUser");
                  }}
                >
                  <Edit />
                </EditBox>
              ) : (
                <></>
              )}
            </MemberContainer>
          );
        })}
      </MembersLayout>

      <ChatLayout>
        채팅
        <ChatingDiv ref={chatEndRef}>
          {MOCKDATA.chatLog.map((chat) => (
            <ChatDiv key={chat.id}>
              <NameDiv>{chat.name}</NameDiv>
              <MessageDiv>{chat.message}</MessageDiv>
            </ChatDiv>
          ))}
        </ChatingDiv>
        <InputLayout>
          <Input
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
  gap: 20px;
  padding-bottom: 30px;
  border-bottom: 1px solid ${theme.text.gamma[800]};
`;

const MemberContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 30px;
  align-items: center;
`;

const MemberDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: ${(props) => (props.selected ? "Pretendard-SemiBold" : "Pretendard-Light")};
  font-size: 24px;
  cursor: pointer;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const ChatLayout = styled.div`
  ${theme.styles.flexCenterColumn}
  font-family: Pretendard-SemiBold;
  width: 100%;
  gap: 20px;
  font-size: 25px;

  @media (max-width: 480px) {
    font-size: 20px;
  }
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

  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; //IE and Edge
  scrollbar-width: none; //Firefox

  @media (max-width: 480px) {
    width: 90%;
  }
`;

const ChatDiv = styled.div`
  ${theme.styles.flexCenterRow}
  font-family: Pretendard-Light;
  width: 100%;
  gap: auto;
  font-size: 22px;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const NameDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-family: Pretendard-Medium;
  font-size: 22px;
  width: 70px;
  height: 100%;

  @media (max-width: 480px) {
    font-size: 18px;
    width: 20%;
  }
`;

const MessageDiv = styled.div`
  height: 100%;
  width: 343px;
  font-family: Pretendard-Light;

  @media (max-width: 480px) {
    width: 80%;
    font-size: 18px;
  }
`;

const InputLayout = styled.div`
  ${theme.styles.flexCenterRow}
  width: 423px;

  @media (max-width: 480px) {
    width: 90%;

    //TODO: input fontsize 조절
    input {
      font-size: 18px;
    }
  }
`;

const SendButtonBox = styled.button`
  ${theme.styles.flexCenterRow}
  background: none;
  border: none;
`;

const EditBox = styled.button`
  display: flex;
  background: none;
  border: none;
  cursor: pointer;
`;
