import styled from "@emotion/styled/macro";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiAward } from "react-icons/fi";
import theme from "../../../theme";
import RankingList from "./RankingList";

export default function RankingModal({
  isOpen,
  onClose,
  timeInfo,
  selectedName,
  setSelectedName,
  usersCount,
  onGoJoin,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Container
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <Title>
                <FiAward size={18} />
                골든타임 순위
              </Title>
              <CloseBtn onClick={onClose} aria-label="닫기">
                <FiX size={20} />
              </CloseBtn>
            </Header>
            <Body>
              <RankingList
                timeInfo={timeInfo}
                selectedName={selectedName}
                setSelectedName={setSelectedName}
                usersCount={usersCount}
                setRightScreen={onGoJoin}
              />
            </Body>
          </Container>
        </Backdrop>
      )}
    </AnimatePresence>
  );
}

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  box-sizing: border-box;
`;

const Container = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 460px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
`;

const Header = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid ${theme.text.gamma[900]};
`;

const Title = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-family: "Pretendard-Bold";
  font-size: 16px;
  color: ${theme.text.primary};

  svg {
    color: ${theme.color.primary};
  }
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: ${theme.text.gamma[500]};
  padding: 4px;
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.text.gamma[900]};
    color: ${theme.text.primary};
  }
`;

const Body = styled.div`
  overflow-y: auto;
  padding: 16px 18px 20px;
`;
