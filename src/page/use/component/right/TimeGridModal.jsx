import React from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { FiLogIn } from "react-icons/fi";
import AllTimeGrid from "../left/AllTimeGrid";
import theme from "../../../../theme";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const TimeGridModal = ({
  isOpen,
  onClose,
  banedCells,
  title,
  dates,
  startHour,
  endHour,
  timeInfo,
  selectedName,
  setSelectedName,
  setTableInfo,
  tableId,
  usersSchedule,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          {/* 버튼의 아이콘을 FiLogIn으로 변경 */}
          <CloseButton
            onClick={onClose}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 0.2 } }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiLogIn size={24} />
          </CloseButton>

          <ModalContainer variants={modalVariants} onClick={(e) => e.stopPropagation()}>
            <AllTimeGrid
              banedCells={banedCells}
              title={title}
              dates={dates}
              startHour={startHour}
              endHour={endHour}
              timeInfo={timeInfo}
              selectedName={selectedName}
              setSelectedName={setSelectedName}
              setTableInfo={setTableInfo}
              tableId={tableId}
              usersSchedule={usersSchedule}
            />
          </ModalContainer>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};

const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  box-sizing: border-box;
`;

const ModalContainer = styled(motion.div)`
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    padding: 30px;
  }
  @media (max-width: 480px) {
    padding: 20px;
  }
`;

const CloseButton = styled(motion.button)`
  position: fixed;
  bottom: 25px;
  right: 25px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${theme.color.primary};
  border: none;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
  box-shadow: 0 4px 15px rgba(0, 98, 204, 0.4);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${theme.color.primaryTint};
  }

  @media (max-width: 768px) {
    bottom: 25px;
    right: 30px;
    width: 48px;
    height: 48px;
  }
`;

export default TimeGridModal;
