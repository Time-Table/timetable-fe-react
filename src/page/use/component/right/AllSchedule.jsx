import styled from "@emotion/styled/macro";
import theme from "../../../../theme";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { postChat } from "../../../../api/Use/postChat";
import { getChating } from "../../../../api/Use/getChating";
import Swal from "sweetalert2";
import { LuRefreshCw } from "react-icons/lu";
import { keyframes } from "@emotion/react";
import { BsSendFill } from "react-icons/bs";
import Input from "../../../../component/Input";
import { AnimatePresence, motion } from "framer-motion";

export default function AllSchedule({ tableId, name, setRightScreen, setSelectedName, usersSchedule, selectedName }) {
     const [message, setMessage] = useState("");
     const [chatLog, setChatLog] = useState([]);
     const chatEndRef = useRef(null);
     const isNameMatching = usersSchedule.some((item) => item.name === name);
     const [isRotating, setIsRotating] = useState(false);

     const Toast = useMemo(
          () =>
               Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
               }),
          []
     );

     const fetchData = useCallback(async () => {
          const res = await getChating(tableId);
          if (res.status === 200) {
               setChatLog(res.data);
          } else if (res.status === 201) {
               setChatLog([{ name: "안내", message: "공지사항이나 의견을 자유롭게 공유해 보세요." }]);
          } else {
               setChatLog([]);
               Toast.fire({ icon: "error", title: "채팅을 불러오지 못했습니다." });
          }
     }, [tableId, Toast]);

     useEffect(() => {
          fetchData();
     }, [fetchData]);

     const handleRefresh = async (isChat = false) => {
          if (isChat) {
               setIsRotating(true);
               setTimeout(() => setIsRotating(false), 700);
          }
          await fetchData();
     };

     const handleUserClick = (userName) => {
          if (selectedName === userName) {
               setSelectedName(null);
          } else {
               setSelectedName(userName);
          }
     };

     const updateChatLog = async () => {
          if (!name || !isNameMatching) {
               setRightScreen("AddUser");
               Toast.fire({ icon: "warning", title: "먼저 참여해주세요." });
               return;
          }
          if (message.trim()) {
               const res = await postChat(tableId, name, message);
               if (res.success) {
                    setMessage("");
                    await fetchData();
               } else {
                    Toast.fire({ icon: "error", title: "메시지 전송에 실패했습니다." });
               }
          }
     };

     useLayoutEffect(() => {
          if (chatEndRef.current) {
               chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
          }
     }, [chatLog]);

     return (
          <AnimatePresence>
               <Frame initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <MembersSection>
                         <SectionHeader>
                              <SectionTitle>참여자 ({usersSchedule.length})</SectionTitle>
                         </SectionHeader>
                         <MembersGrid>
                              {usersSchedule.length === 0 ? (
                                   <EmptyMessage>첫 참여자가 되어보세요!</EmptyMessage>
                              ) : (
                                   usersSchedule.map((user, index) => (
                                        <MemberChip
                                             key={index}
                                             onClick={() => handleUserClick(user.name)}
                                             isSelected={selectedName === user.name}
                                        >
                                             {user.name}
                                        </MemberChip>
                                   ))
                              )}
                         </MembersGrid>
                    </MembersSection>

                    <ChatSection>
                         <SectionHeader>
                              <SectionTitle>채팅</SectionTitle>
                              <RefreshButton
                                   className={isRotating ? "rotating" : ""}
                                   onClick={() => handleRefresh(true)}
                              >
                                   <LuRefreshCw size={18} />
                              </RefreshButton>
                         </SectionHeader>
                         <ChatLog ref={chatEndRef}>
                              {chatLog.map((chat, idx) => (
                                   <ChatBubble key={idx} isMine={chat.name === name}>
                                        <ChatName>{chat.name}</ChatName>
                                        <ChatMessage>{chat.message}</ChatMessage>
                                   </ChatBubble>
                              ))}
                         </ChatLog>
                         <ChatInputWrapper>
                              <Input
                                   placeholder={
                                        isNameMatching ? "메시지를 입력하세요..." : "참여 후 채팅할 수 있습니다."
                                   }
                                   maxLength={500}
                                   onChange={(e) => setMessage(e.target.value)}
                                   value={message}
                                   onKeyDown={(e) => e.key === "Enter" && updateChatLog()}
                                   disabled={!isNameMatching}
                              />
                              <SendButton onClick={updateChatLog} disabled={!isNameMatching || !message.trim()}>
                                   <BsSendFill />
                              </SendButton>
                         </ChatInputWrapper>
                    </ChatSection>
               </Frame>
          </AnimatePresence>
     );
}

const Frame = styled(motion.div)`
     width: 100%;
     display: flex;
     flex-direction: column;
     gap: 30px;
`;

const Section = styled.div`
     width: 100%;
     background: white;
     border-radius: 16px;
     padding: 24px;
     box-sizing: border-box;
     box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
     display: flex;
     flex-direction: column;
`;

const MembersSection = styled(Section)``;
const ChatSection = styled(Section)``;

const SectionHeader = styled.div`
     display: flex;
     justify-content: space-between;
     align-items: center;
     margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
     font-family: "Pretendard-Bold";
     font-size: 20px;
     color: ${theme.text.gamma[300]};
     margin: 0;
`;

const MembersGrid = styled.div`
     display: flex;
     flex-wrap: wrap;
     gap: 12px;
     max-height: 200px;
     overflow-y: auto;
`;

const MemberChip = styled.button`
     background-color: ${({ isSelected }) => (isSelected ? theme.color.primary : theme.text.gamma[950])};
     border: 1px solid ${({ isSelected }) => (isSelected ? theme.color.primary : theme.text.gamma[900])};
     color: ${({ isSelected }) => (isSelected ? "white" : theme.text.gamma[400])};
     font-family: "Pretendard-Medium";
     font-size: 15px;
     padding: 8px 16px;
     border-radius: 999px;
     cursor: pointer;
     transition: all 0.2s ease;

     &:hover {
          background-color: ${({ isSelected }) => (isSelected ? theme.color.primary : `${theme.color.primary}15`)};
          color: ${({ isSelected }) => (isSelected ? "white" : theme.color.primary)};
          border-color: ${({ isSelected }) => (isSelected ? theme.color.primary : `${theme.color.primary}30`)};
     }
`;

const EmptyMessage = styled.p`
     font-family: "Pretendard-Regular";
     color: ${theme.text.gamma[600]};
     width: 100%;
     text-align: center;
     padding: 20px 0;
`;

const ChatLog = styled.div`
     display: flex;
     flex-direction: column;
     gap: 12px;
     height: 250px;
     overflow-y: auto;
     padding: 10px;
     background-color: ${theme.text.gamma[950]};
     border-radius: 8px;
`;

const ChatBubble = styled.div`
     display: flex;
     flex-direction: column;
     align-self: ${({ isMine }) => (isMine ? "flex-end" : "flex-start")};
     max-width: 80%;
`;

const ChatName = styled.span`
     font-family: "Pretendard-SemiBold";
     font-size: 13px;
     color: ${theme.text.gamma[500]};
     margin: 0 8px 4px 8px;
     text-align: ${({ isMine }) => (isMine ? "right" : "left")};
`;

const ChatMessage = styled.div`
     font-family: "Pretendard-Regular";
     font-size: 15px;
     padding: 10px 14px;
     border-radius: 18px;
     background-color: ${({ isMine }) => (isMine ? theme.color.primary : "#EAEAEA")};
     color: ${({ isMine }) => (isMine ? "white" : "black")};
     word-wrap: break-word;
     white-space: pre-wrap;
`;

const ChatInputWrapper = styled.div`
     display: flex;
     align-items: center;
     gap: 10px;
     margin-top: 16px;
`;

const SendButton = styled.button`
     display: flex;
     align-items: center;
     justify-content: center;
     min-width: 48px;
     height: 48px;
     border-radius: 50%;
     border: none;
     background-color: ${theme.color.primary};
     color: white;
     cursor: pointer;
     transition: background-color 0.2s;

     &:hover:not(:disabled) {
          background-color: ${theme.color.primaryTint};
     }
     &:disabled {
          background-color: ${theme.text.gamma[800]};
          cursor: not-allowed;
     }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
`;

const RefreshButton = styled.button`
     ${theme.styles.flexCenterRow}
     background: none;
     border: none;
     cursor: pointer;
     color: ${theme.text.gamma[600]};
     padding: 8px;
     border-radius: 50%;

     &:hover {
          background-color: ${theme.text.gamma[900]};
     }
     &.rotating {
          animation: ${rotate} 0.7s linear;
     }
`;
