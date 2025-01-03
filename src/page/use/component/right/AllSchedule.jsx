import styled from "@emotion/styled/macro";
import Input from "../../../../component/Input";
import theme from "../../../../theme";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { postChat } from "../../../../api/Use/postChat";
import { getChating } from "../../../../api/Use/getChating";
import Swal from "sweetalert2";
import { MdOutlineModeEdit } from "react-icons/md";
import { LuRefreshCw } from "react-icons/lu";
import { keyframes } from "@emotion/react";
import { BsSend } from "react-icons/bs";

export default function AllSchedule({
  tableId,
  name,
  setRightScreen,
  setName,
  selectedName,
  setSelectedName,
  usersSchedule,
  setSelectedToggle,
  setCurrentSlide,
}) {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [shouldFetch, setShouldFetch] = useState(false);
  const chatEndRef = useRef(null);
  const isNameMatching = usersSchedule.some((item) => item.name === name);
  const [isRotating, setIsRotating] = useState(false);
  const handleClick = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 1000);
  };

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
      setCurrentSlide(0);
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
        {names.length === 0 ? <span>참여하기를 클릭해 첫 일정을 등록해주세요.</span> : <></>}
        {names.map((name, index) => (
          <MemberContainer key={index}>
            <MemberDiv
              onClick={() => {
                toggleMemberDetail(index);
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
                {/* <img src={Edit} /> */}
                <MdOutlineModeEdit size={25} color={theme.text.gamma[800]} />
              </EditBox>
            ) : null}
          </MemberContainer>
        ))}
      </MembersLayout>

      <ChatLayout>
        <div style={{ display: "flex", width: "100%" }}>
          <div
            style={{
              flex: 1,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "90%",
              flex: 1,
            }}
          >
            채팅
          </div>
          <ButtonBox
            className={isRotating ? "rotating" : ""}
            onClick={async () => {
              handleClick();
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
            <LuRefreshCw size={25} color={theme.text.gamma[800]} />
          </ButtonBox>
        </div>
        <ChatingDiv ref={chatEndRef}>
          {chatLog.map((chat, idx) => (
            <ChatDiv key={idx}>
              <NameDiv>{chat.name}:</NameDiv>
              <MessageDiv>{chat.message}</MessageDiv>
            </ChatDiv>
          ))}
        </ChatingDiv>
        <InputLayout>
          <Input
            placeholder={"채팅을 입력하세요."}
            maxLength={500}
            onChange={(e) => {
              setMessage(e.target.value);
              if (e.target.value.length >= 500) {
                Toast.fire({
                  icon: "error",
                  iconColor: `${theme.color.primary}`,
                  title: "최대 500 자까지 입력 가능합니다.",
                });
              }
            }}
            value={message}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateChatLog();
              }
            }}
          />
          <ButtonBox onClick={updateChatLog}>
            <BsSend color={theme.text.gamma[800]} />
          </ButtonBox>
        </InputLayout>
      </ChatLayout>
    </>
  );
}

const MembersLayout = styled.div`
  ${theme.styles.flexCenterColumn}
  justify-content: flex-start;
  font-family: Pretendard-SemiBold;
  width: 100%;
  gap: 20px;
  padding-bottom: 30px;
  border-bottom: 1px solid ${theme.text.gamma[800]};
  height: 250px;
  overflow-y: auto;
  scroll-behavior: smooth;

  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; //IE and Edge
  scrollbar-width: none; //Firefox

  @media (max-width: 480px) {
    height: 300px;
  }
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
  min-height: 105px;
  max-height: 300px;
  overflow-y: auto;
  scroll-behavior: smooth;
  border-radius: 8px;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; //IE and Edge
  scrollbar-width: none; //Firefox

  @media (max-width: 480px) {
    max-height: 200px;
    width: 280px;
  }
`;

const ChatDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  align-items: flex-start;
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
  justify-content: flex-start;
  align-items: center;
  text-align: start;
  font-family: Pretendard-Medium;
  font-size: 22px;
  width: 100%;

  @media (max-width: 480px) {
    font-size: 18px;
    /* width: 20%; */
  }
`;

const MessageDiv = styled.div`
  height: 100%;
  width: 100%;
  font-family: Pretendard-Light;
  word-wrap: break-word; /* 긴 단어나 텍스트가 넘어갈 경우 자동으로 줄바꿈 */
  white-space: normal; /* 기본적으로 줄바꿈이 가능하도록 설정 */
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const InputLayout = styled.div`
  ${theme.styles.flexCenterRow}
  width: 423px;

  @media (max-width: 480px) {
    width: 90%;

    input {
      font-size: 18px;
    }
  }
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(180deg);
  }
`;

const ButtonBox = styled.div`
  ${theme.styles.flexCenterRow}
  background: none;
  border: none;
  cursor: pointer;
  flex: 1;
  transition: all 0.3s ease;

  &.rotating {
    animation: ${rotate} 0.5s linear infinite;
  }
`;

const EditBox = styled.button`
  display: flex;
  background: none;
  border: none;
  cursor: pointer;
`;
