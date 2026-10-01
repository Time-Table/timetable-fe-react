import styled from "@emotion/styled/macro";
import theme from "../../../theme";
import Button from "../../../component/Button";
import Input from "../../../component/Input";
import { useRef, useState } from "react";
import { joinUser, getUserInfo, deleteUser } from "../../../api/user";
import { trackEvent, EVENTS } from "../../../utils/analytics";
import { readTableState, writeTableState, clearTableState } from "../../../utils/tableSession";
import Swal from "sweetalert2";
import { FiLogIn } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

export default function JoinForm({
  name: beforeName,
  setRightScreen,
  tableId,
  setSelectedToggle,
  setName: setAfterName,
  refreshData,
}) {
  const inputCondition = /^[A-Za-z0-9\uAC00-\uD7A3\u3131-\u318E\s]+$/;
  const [name, setName] = useState(beforeName ? beforeName : "");
  const [password, setPassword] = useState("");
  // 요청 중에는 다시 보내지 않는다(연타·Enter 반복으로 join_submit·join_success가 두 번 남지 않게, 새 화면과 같은 조건).
  // 상태는 다음 그리기에서야 바뀌므로 같은 순간의 두 번째 요청은 ref로 막는다(Codex 교차 검증 2026-10-01).
  const [joining, setJoining] = useState(false);
  const joiningRef = useRef(false);

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    padding: "1em",
    customClass: {
      popup: "custom-swal-popup",
      title: "custom-swal-title",
    },
  });

  const deleteMember = async (name, password) => {
    if (!name || !password) {
      Toast.fire({
        icon: "error",
        iconColor: `${theme.color.primary}`,
        title: "이름과 비밀번호를 모두 입력해주세요.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "정말 삭제하시겠습니까?",
      text: "일정은 모두 삭제 되지만 메시지 기록은 남습니다.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
      confirmButtonColor: theme.color.primary,
    });

    if (!result.isConfirmed) return;

    const user = await getUserInfo(tableId, name, password);
    if (user.code !== 200) {
      Toast.fire({
        icon: "error",
        iconColor: `${theme.color.primary}`,
        title: user.message || "사용자 정보가 일치하지 않습니다.",
      });
      return;
    }

    const res = await deleteUser(tableId, name, password);
    if (res?.success) {
      Toast.fire({
        icon: "success",
        iconColor: `${theme.color.button.blue}`,
        title: "참여 정보가 삭제되었습니다.",
      });
      localStorage.removeItem("name");
      // 표 화면 A/B 공유 상태도 지운다(저장 안 한 선택이 다음 사람에게 이어지지 않게).
      clearTableState(tableId);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      Toast.fire({
        icon: "error",
        iconColor: `${theme.color.primary}`,
        title: res?.message || "삭제 중 문제가 발생했습니다.",
      });
    }
  };

  const handleSuccess = async (userName) => {
    trackEvent(EVENTS.JOIN_SUCCESS, tableId);
    // 다른 이름으로 들어오면 앞사람의 저장 안 한 선택은 쓰지 않는다(표 화면 A/B 공유 상태).
    if (readTableState(tableId).name !== userName) writeTableState(tableId, { name: userName, draft: null, editing: true });
    if (refreshData) {
      await refreshData();
    }
    localStorage.setItem("name", userName);
    setAfterName(userName);
    setRightScreen("PersonalSchedule");
    setSelectedToggle("내 일정");
  };

  const updateMember = async (name, password) => {
    if (name.length === 0 || password.length === 0) {
      Toast.fire({
        icon: "error",
        iconColor: `${theme.color.primary}`,
        title: "이름과 비밀번호를 모두 입력해주세요.",
      });
      return;
    }
    if (!inputCondition.test(name) || !inputCondition.test(password)) {
      Toast.fire({
        icon: "error",
        iconColor: `${theme.color.primary}`,
        title: "이름과 비밀번호는 영문자, 숫자, 한글, 공백만 사용할 수 있습니다.",
      });
      return;
    }

    if (joiningRef.current) return;
    joiningRef.current = true;
    setJoining(true);
    let user;
    try {
      trackEvent(EVENTS.JOIN_SUBMIT, tableId);
      user = await joinUser(tableId, name, password);
    } finally {
      joiningRef.current = false;
      setJoining(false);
    }
    if (user) {
      switch (user.code) {
        case 200:
          Toast.fire({
            icon: "success",
            iconColor: `${theme.color.button.blue}`,
            title: "로그인되었습니다. 일정을 수정해 주세요.",
          });
          handleSuccess(user.data.name);
          break;
        case 201:
          Toast.fire({
            icon: "success",
            iconColor: `${theme.color.button.blue}`,
            title: user.message,
          });
          handleSuccess(user.data.name);
          Swal.fire({
            icon: "success",
            iconColor: `${theme.color.primary}`,
            title: "환영합니다!",
            text: "모두가 볼 수 있게 가능한 시간을 선택해주세요.",
            confirmButtonText: "확인",
            confirmButtonColor: `${theme.color.primary}`,
            customClass: {
              popup: "custom-swal-popup",
              title: "custom-swal-title",
              htmlContainer: "custom-swal-html-container",
              confirmButton: "custom-swal-confirm-button",
            },
          });
          break;
        case 401:
        case 402:
        default:
          Toast.fire({
            icon: "error",
            iconColor: `${theme.color.primary}`,
            title: user.message || "오류가 발생했습니다.",
          });
          break;
      }
    }
  };

  return (
    <AnimatePresence>
      <Frame initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Header>
          <FiLogIn size={32} color={theme.color.primary} />
          <HeaderText>내 일정 등록/수정</HeaderText>
        </Header>
        <ContentFrame>
          <Input
            placeholder="이름을 입력해주세요."
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue.startsWith(" ")) return;
              setName(e.target.value);
              if (e.target.value.length >= 15) {
                Toast.fire({
                  icon: "warning",
                  title: "최대 15자까지 입력 가능합니다.",
                });
              }
            }}
            value={name}
            maxLength={15}
          />
          <Input
            placeholder="비밀번호를 입력해주세요(1자리 이상)"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateMember(name, password)}
            value={password}
            maxLength={15}
            type="password"
          />
        </ContentFrame>
        <ButtonLayout>
          <Button
            title="참여 / 수정"
            variant="primary"
            onClick={() => updateMember(name, password)}
            disabled={!name || !password || joining}
            width="65%"
          />
          <Button
            title="삭제"
            variant="secondary"
            onClick={() => deleteMember(name, password)}
            disabled={!name || !password}
            width="30%"
          />
        </ButtonLayout>
        <TermsPrivacyContainer>
          <TermsPrivacyText onClick={() => (window.location.href = "/terms")}>
            이용약관
          </TermsPrivacyText>
          <span>|</span>
          <TermsPrivacyText onClick={() => (window.location.href = "/privacy")}>
            개인정보처리방침
          </TermsPrivacyText>
        </TermsPrivacyContainer>
      </Frame>
    </AnimatePresence>
  );
}

const Frame = styled(motion.div)`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 30px;
  background-color: white;
  border-radius: 16px;
  padding: 30px;
  box-sizing: border-box;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderText = styled.h2`
  font-family: "Pretendard-Bold";
  font-size: 24px;
  color: ${theme.text.gamma[200]};
  margin: 0;
`;

const ContentFrame = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

const ButtonLayout = styled.div`
  display: flex;
  width: 100%;
  gap: 10px;
  margin-top: 10px;
`;

const TermsPrivacyContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  font-size: 13px;
  color: ${theme.text.gamma[500]};
`;

const TermsPrivacyText = styled.span`
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: ${theme.color.primary};
  }
`;
