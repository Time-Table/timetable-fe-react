import styled from "@emotion/styled/macro";
import Input from "../../../../component/Input";
import theme from "../../../../theme";
import Send from "../../../../assets/svg/Send";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Edit from "../../../../assets/svg/Edit";
import { postChat } from "../../../../api/Use/postChat";
import { getChating } from "../../../../api/Use/getChating";
import Refresh from "../../../../assets/svg/Refresh";
import Swal from "sweetalert2";

export default function AllSchedule({
  tableId,
  name,
  setLeftScreen,
  setRightScreen,
  setName,
  selectedName,
  setSelectedName,
  usersSchedule,
  setSelectedToggle,
}) {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [shouldFetch, setShouldFetch] = useState(false);
  const chatEndRef = useRef(null);
  const isNameMatching = usersSchedule.some((item) => item.name == name);

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  const names = usersSchedule.map((user) => user.name);
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

  const updateChatLog = async () => {
    if (!name || !isNameMatching) {
      setRightScreen("MySchedule");
      setSelectedToggle("내 일정");
      return;
    }
    if (message) {
      const res = await postChat(tableId, name, message);
      if (res.success) {
        setMessage("");
        setShouldFetch((prev) => !prev);
        if (chatEndRef.current) {
          chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
        }
      } else {
        await Toast.fire({
          icon: "error",
          iconColor: `${theme.color.primary}`,
          title: "채팅 메시지 저장 실패",
        });
      }
    } else {
      await Toast.fire({
        icon: "error",
        iconColor: `${theme.color.primary}`,
        title: "메시지를 입력해주세요.",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await getChating(tableId);
      if (res.status === 200) {
        setChatLog(res.data);
      } else if (res.status === 201) {
        const info = [
          {
            name: "팁: ",
            message: "공지사항이나 의견 등을 자유롭게 공유해 보세요. ",
          },
        ];
        setChatLog(info);
      } else {
        setChatLog([]);
        await Toast.fire({
          icon: "error",
          iconColor: `${theme.color.primary}`,
          title: "채팅 데이터를 가져오는 중 오류 발생",
        });
      }
    };
    fetchData();
  }, [tableId, shouldFetch]);

  useLayoutEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [chatLog]);

  return (
    <>
      <MembersLayout>
        {names.map((name, index) => (
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
                  setSelectedToggle("참여하기");
                }}
              >
                <Edit />
              </EditBox>
            ) : null}
          </MemberContainer>
        ))}
      </MembersLayout>

      <ChatLayout>
        <div style={{ display: "flex", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "center", width: "90%" }}>채팅</div>
          <ButtonBox
            onClick={async () => {
              const res = await getChating(tableId);
              if (res.status === 200) {
                setChatLog(res.data);
              } else if (res.status === 201) {
                setChatLog([{ name: "", message: "첫 댓글을 남겨보세요." }]);
              } else {
                setChatLog([]);
                await Toast.fire({
                  icon: "error",
                  iconColor: `${theme.color.primary}`,
                  title: "채팅 데이터를 가져오는 중 오류 발생",
                });
              }
            }}
          >
            <Refresh />
          </ButtonBox>
        </div>
        <ChatingDiv ref={chatEndRef}>
          {chatLog.map((chat, idx) => (
            <ChatDiv key={idx}>
              <NameDiv>{chat.name}</NameDiv>
              <MessageDiv>{chat.message}</MessageDiv>
            </ChatDiv>
          ))}
        </ChatingDiv>
        <InputLayout>
          <Input
            placeholder={"일정을 추가하고 채팅을 이용해 보세요."}
            maxLength={300}
            onChange={(e) => setMessage(e.target.value)}
            value={message}
          />
          <ButtonBox onClick={updateChatLog}>
            <Send />
          </ButtonBox>
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

const ButtonBox = styled.button`
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
