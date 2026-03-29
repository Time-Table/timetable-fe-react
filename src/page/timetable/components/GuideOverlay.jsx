import React, { useState, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import theme from "../../../theme";

const GuideOverlay = ({ isDesktop }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowLeft: 0 });

  const steps = React.useMemo(() => [
    {
      id: "guide-quick-join",
      title: "빠른 참여",
      description: "이름을 등록하고 바로 내 일정을 입력할 수 있어요.",
      position: "bottom",
    },
    {
      id: "guide-invite",
      title: "초대",
      description: "링크를 복사해 친구들에게 공유하고 초대해 보세요.",
      position: "bottom",
    },
    ...(isDesktop
      ? [
          {
            id: "guide-all-timetable",
            title: "전체 시간표 현황",
            description: "그룹원들의 일정을 한눈에 확인하고 최적의 시간을 찾아보세요.",
            position: "right",
          },
        ]
      : [
          {
            id: "guide-floating-button",
            title: "전체 시간표 보기",
            description: "언제든지 전체 인원의 시간표 현황을 확인할 수 있어요.",
            position: "top",
          },
        ]),
  ], [isDesktop]);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("hasSeenTimetableGuide");
    if (!hasSeenGuide) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!isVisible || step >= steps.length) return;
    const element = document.getElementById(steps[step].id);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    setTargetRect(rect);

    const tooltipWidth = 280;
    const tooltipHeight = 150; // 근사치
    const margin = 15;
    const currentStep = steps[step];

    let top = 0;
    let left = 0;
    let arrowLeft = 50; // %

    if (currentStep.position === "bottom") {
      top = rect.bottom + margin;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else if (currentStep.position === "top") {
      top = rect.top - tooltipHeight - margin;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else if (currentStep.position === "right") {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + margin;
    }

    // 화면 밖으로 나가는 것 방지
    const minLeft = 10;
    const maxLeft = window.innerWidth - tooltipWidth - 10;
    const originalLeft = left;
    left = Math.min(Math.max(minLeft, left), maxLeft);

    // 꼭지점(화살표) 위치 보정 (타겟 요소의 중앙을 가리키도록)
    if (currentStep.position === "top" || currentStep.position === "bottom") {
      const targetCenter = rect.left + rect.width / 2;
      const tooltipRelativeCenter = targetCenter - left;
      arrowLeft = (tooltipRelativeCenter / tooltipWidth) * 100;
      arrowLeft = Math.min(Math.max(10, arrowLeft), 90); // 너무 끝으로 가는 것 방지
    }

    setTooltipPos({ top, left, arrowLeft });
  }, [isVisible, step, steps]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleNeverShowAgain = () => {
    localStorage.setItem("hasSeenTimetableGuide", "true");
    setIsVisible(false);
  };

  if (!isVisible || !targetRect) return null;

  const currentStep = steps[step];

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Highlight
          animate={{
            top: targetRect.top - 5,
            left: targetRect.left - 5,
            width: targetRect.width + 10,
            height: targetRect.height + 10,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        
        <Tooltip
          key={step}
          currentStepPosition={currentStep.position}
          arrowLeft={tooltipPos.arrowLeft}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            top: tooltipPos.top,
            left: tooltipPos.left,
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <TooltipTitle>{currentStep.title}</TooltipTitle>
          <TooltipDescription>{currentStep.description}</TooltipDescription>
          <ButtonGroup>
            <StepIndicator>{step + 1} / {steps.length}</StepIndicator>
            <div style={{ display: "flex", gap: "8px" }}>
              {step === steps.length - 1 && (
                <NeverShowButton onClick={handleNeverShowAgain}>
                  다시 보지 않기
                </NeverShowButton>
              )}
              <NextButton onClick={handleNext}>
                {step === steps.length - 1 ? "시작하기" : "다음"}
              </NextButton>
            </div>
          </ButtonGroup>
        </Tooltip>
      </Overlay>
    </AnimatePresence>
  );
};

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
`;

const Highlight = styled(motion.div)`
  position: fixed;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid white;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  z-index: 10000;
  pointer-events: none;
`;

const Tooltip = styled(motion.div)`
  position: fixed;
  width: 280px;
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::after {
    content: "";
    position: absolute;
    border-style: solid;
    ${({ currentStepPosition, arrowLeft }) => {
      if (currentStepPosition === "bottom") {
        return `
          top: -10px;
          left: ${arrowLeft}%;
          transform: translateX(-50%);
          border-width: 0 10px 10px 10px;
          border-color: transparent transparent white transparent;
        `;
      } else if (currentStepPosition === "top") {
        return `
          bottom: -10px;
          left: ${arrowLeft}%;
          transform: translateX(-50%);
          border-width: 10px 10px 0 10px;
          border-color: white transparent transparent transparent;
        `;
      } else if (currentStepPosition === "right") {
        return `
          left: -10px;
          top: 50%;
          transform: translateY(-50%);
          border-width: 10px 10px 10px 0;
          border-color: transparent white transparent transparent;
        `;
      }
      return "";
    }}
  }
`;

const TooltipTitle = styled.h4`
  margin: 0;
  font-family: "Pretendard-Bold";
  font-size: 18px;
  color: ${theme.color.primary};
`;

const TooltipDescription = styled.p`
  margin: 0;
  font-family: "Pretendard-Regular";
  font-size: 14px;
  color: ${theme.text.gamma[400]};
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const StepIndicator = styled.span`
  font-size: 12px;
  color: ${theme.text.gamma[600]};
  font-family: "Pretendard-Medium";
`;

const NextButton = styled.button`
  background: ${theme.color.primary};
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  font-family: "Pretendard-SemiBold";
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;

const NeverShowButton = styled.button`
  background: ${theme.text.gamma[950]};
  color: ${theme.text.gamma[500]};
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-family: "Pretendard-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${theme.text.gamma[900]};
    color: ${theme.text.gamma[300]};
  }
`;

export default GuideOverlay;
