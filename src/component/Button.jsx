import React from "react";
import styled from "@emotion/styled";
import theme from "../theme";

const Button = ({
     title = "다음",
     onClick = () => {},
     width = "100%",
     height = "56px",
     disabled = false,
     variant = "primary",
     fontSize = "18px",
     style,
     ...props
}) => {
     return (
          <StyledButton
               onClick={!disabled ? onClick : undefined}
               disabled={disabled}
               variant={variant}
               style={{ width, height, fontSize, ...style }}
               {...props}
          >
               {title}
          </StyledButton>
     );
};

const getVariantStyles = (variant) => {
     switch (variant) {
          case "secondary":
               return `
        background-color: ${theme.color.button.blue};
        color: white;
        &:hover:not(:disabled) {
          background-color: ${theme.color.button.blue}E6;
        }
      `;
          case "text":
               return `
        background: none;
        color: ${theme.text.gamma[500]};
        font-family: 'Pretendard-Regular';
        &:hover:not(:disabled) {
          color: ${theme.color.primary};
          background-color: ${theme.color.primary}15;
        }
        &.active {
          color: ${theme.color.primary};
          font-family: 'Pretendard-Bold';
        }
      `;
          case "primary":
          default:
               return `
        background: ${theme.color.button.primary};
        color: white;
        &:hover:not(:disabled) {
          background-color: ${theme.color.primary}E6;
        }
      `;
     }
};

const StyledButton = styled.button`
     display: inline-flex;
     justify-content: center;
     align-items: center;
     font-family: "Pretendard-Bold";
     letter-spacing: -0.05em;
     border: 0;
     border-radius: 12px;
     cursor: pointer;
     transition: all 0.2s ease-in-out;
     -webkit-tap-highlight-color: transparent;

     ${({ variant }) => getVariantStyles(variant)}

     &:disabled {
          background: ${theme.color.button.neutral[100]};
          color: ${theme.color.button.neutral[300]};
          cursor: not-allowed;
     }
`;

export default Button;
