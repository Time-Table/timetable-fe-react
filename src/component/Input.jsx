import React from "react";
import styled from "@emotion/styled";
import theme from "../theme";

const Input = ({
     height = "48px",
     placeholder,
     fontSize = "16px",
     onChange = () => {},
     onKeyDown = () => {},
     value,
     maxLength,
     type,
     ...props
}) => {
     return (
          <InputWrapper>
               <StyledInput
                    maxLength={maxLength}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    style={{
                         height,
                         fontSize,
                    }}
                    type={type}
                    {...props}
               />
          </InputWrapper>
     );
};

const InputWrapper = styled.div`
     position: relative;
     width: 100%;
`;

const StyledInput = styled.input`
     width: 100%;
     border: none;
     border-bottom: 1.5px solid ${theme.text.gamma[800]};
     outline: none;
     font-family: "Pretendard-Regular";
     background: none;
     padding: 0 4px 8px 4px;
     box-sizing: border-box;
     transition: border-color 0.2s ease-in-out;

     &::placeholder {
          color: ${theme.text.gamma[700]};
     }

     &:focus {
          border-bottom-color: ${theme.color.primary};
     }
`;

export default Input;
