import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { BsFillGrid3X3GapFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import theme from "../../../../theme";
import { motion, AnimatePresence } from "framer-motion";

const FloatingActionButton = ({ onClick, selectedName }) => {
     const isUserView = !!selectedName;
     const [isHighlighted, setIsHighlighted] = useState(false);

     useEffect(() => {
          setIsHighlighted(true);
          const timer = setTimeout(() => setIsHighlighted(false), 800);
          return () => clearTimeout(timer);
     }, [selectedName]);

     const textAnimation = {
          initial: { y: 20, opacity: 0, scale: 0.8, rotateX: -90 },
          animate: { y: 0, opacity: 1, scale: 1, rotateX: 0 },
          exit: { y: -20, opacity: 0, scale: 0.8, rotateX: 90 },
          transition: { type: "spring", stiffness: 300, damping: 20 },
     };

     const iconAnimation = {
          initial: { scale: 0, rotate: -180 },
          animate: { scale: 1, rotate: 0 },
          exit: { scale: 0, rotate: 180 },
          transition: { type: "spring", stiffness: 400, damping: 25 },
     };

     const fabVariants = {
          initial: {
               scale: 1,
          },
          highlight: {
               scale: [1, 1.3, 1],
               transition: { duration: 1.0, ease: "easeInOut" },
          },
     };

     return (
          <FabContainer
               onClick={onClick}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               variants={fabVariants}
               animate={isHighlighted ? "highlight" : "initial"}
          >
               <AnimatePresence mode="wait">
                    <motion.div
                         key={isUserView ? "user" : "grid"}
                         initial={iconAnimation.initial}
                         animate={iconAnimation.animate}
                         exit={iconAnimation.exit}
                         transition={iconAnimation.transition}
                    >
                         {isUserView ? (
                              <FaUserCircle size={20} color="white" />
                         ) : (
                              <BsFillGrid3X3GapFill size={20} color="white" />
                         )}
                    </motion.div>
               </AnimatePresence>
               <LabelWrapper>
                    <AnimatePresence mode="wait">
                         <motion.span
                              key={isUserView ? selectedName : "all"}
                              initial={textAnimation.initial}
                              animate={textAnimation.animate}
                              exit={textAnimation.exit}
                              transition={textAnimation.transition}
                              style={{ display: "inline-block", transformOrigin: "center" }}
                         >
                              {isUserView ? `${selectedName} 시간표` : "전체 시간표 보기"}
                         </motion.span>
                    </AnimatePresence>
               </LabelWrapper>
          </FabContainer>
     );
};

const FabContainer = styled(motion.button)`
     position: fixed;
     bottom: 30px;
     right: 30px;
     z-index: 1000;
     display: flex;
     align-items: center;
     justify-content: center;
     gap: 10px;
     width: auto;
     height: 56px;
     padding: 0 24px;
     border-radius: 999px;
     border: none;
     cursor: pointer;
     color: white;
     background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
     box-shadow: 0 6px 20px rgba(0, 98, 204, 0.35);
     transition: all 0.2s ease-in-out;

     &:hover {
          box-shadow: 0 8px 25px rgba(0, 98, 204, 0.45);
          transform: translateY(-2px);
     }

     @media (max-width: 480px) {
          bottom: 20px;
          right: 20px;
          height: 50px;
          padding: 0 20px;
     }
`;

const LabelWrapper = styled.div`
     font-family: "Pretendard-Bold";
     font-size: 16px;
     color: white;
     overflow: hidden;
     position: relative;
     height: 1.2em;
     display: inline-block;

     span {
          display: block;
     }
     @media (max-width: 480px) {
          font-size: 15px;
     }
`;

export default FloatingActionButton;
