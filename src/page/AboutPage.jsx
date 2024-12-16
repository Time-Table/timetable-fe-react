import React, { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Preview1 from "../assets/svg/Preview1";
import Preview2 from "../assets/svg/Preview2";
import Preview3 from "../assets/svg/Preview3";
import Talk from "../assets/svg/Talk";

export default function AboutPage() {
  const sectionsRef = useRef([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            if (entry.target.dataset.animation === "slide") {
              entry.target.style.transform = "translateX(0)";
            } else if (entry.target.dataset.animation === "fade-up") {
              entry.target.style.transform = "translateY(0)";
            }
          } else {
            entry.target.style.opacity = "0";
            if (entry.target.dataset.animation === "slide") {
              entry.target.style.transform = "translateX(-20px)";
            } else if (entry.target.dataset.animation === "fade-up") {
              entry.target.style.transform = "translateY(20px)";
            }
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleButtonClick = () => {
    localStorage.clear();
    localStorage.setItem("title", inputValue);
    window.location.href = "/createPage";
  };

  return (
    <CreatePageDiv>
      <ContentDiv>
        <div>
          <AnimatedText ref={addToRefs}>도대체 다들..</AnimatedText>
          <AnimatedText ref={addToRefs}>언제 시간되세요 ?</AnimatedText>
        </div>
        <div>
          <AnimatedSubtitle ref={addToRefs} data-animation="slide">
            각자 다른 스케줄
          </AnimatedSubtitle>
          <div>
            <Talk />
          </div>
        </div>
        <AnimatedText ref={addToRefs}>
          . . <span style={{ color: theme.color.primary }}>시간 맞추기</span> 힘드시죠?
        </AnimatedText>
        <RedBackgroundDiv ref={addToRefs} data-animation="slide">
          <AnimatedText>
            1대1 약속부터 대규모 회식까지 시간 / 인원{" "}
            <span style={{ color: theme.color.primary }}>체크 </span>
          </AnimatedText>
        </RedBackgroundDiv>{" "}
        <RedBackgroundDiv ref={addToRefs} data-animation="slide">
          <AnimatedSubtitle>
            내가 가능한 시간 or 불가능한 시간{" "}
            <span style={{ color: theme.color.primary }}>선택 </span>
          </AnimatedSubtitle>

          <AnimatedSVG ref={addToRefs} data-animation="fade-up">
            <Preview1 />
          </AnimatedSVG>
        </RedBackgroundDiv>
        <RedBackgroundDiv ref={addToRefs} data-animation="slide">
          <AnimatedText>간단하게 만들고</AnimatedText>
          <AnimatedSVG ref={addToRefs} data-animation="fade-up">
            <Preview2 />
          </AnimatedSVG>
        </RedBackgroundDiv>
        <RedBackgroundDiv ref={addToRefs} data-animation="slide">
          <AnimatedText>디테일하게 확인 !</AnimatedText>
          <AnimatedSVG ref={addToRefs} data-animation="fade-up">
            <Preview3 />
          </AnimatedSVG>
        </RedBackgroundDiv>
        <div>
          <AnimatedText ref={addToRefs} style={{ color: theme.color.primary }}>
            30초 만에 템플릿 제작하고 공유하세요.
          </AnimatedText>

          <AnimatedNotes ref={addToRefs} data-animation="slide">
            Mobile / Tab / PC 이용{" "}
          </AnimatedNotes>
        </div>
        <InputWrapper>
          <input
            type="text"
            name="text"
            className="input"
            placeholder="모임 이름"
            value={inputValue}
            onChange={handleInputChange}
            maxLength={25}
          />
        </InputWrapper>
        <StyledWrapper onClick={handleButtonClick}>
          <a className="btn" href="#">
            1분 생성
          </a>
        </StyledWrapper>
      </ContentDiv>
    </CreatePageDiv>
  );
}

const InputWrapper = styled.div`
  .input {
    border: none;
    padding: 1rem;
    border-radius: 1rem;
    background: #ffffff;
    box-shadow: 10px 10px 35px ${theme.color.primary}, -15px -15px 45px #ffffff;
    transition: 0.3s;
    font-family: Pretendard-Medium;
  }

  .input:focus {
    outline-color: ${theme.color.primary};
    background: #fffafa;
    box-shadow: inset 20px 20px 60px #e8e8e8, inset -20px -20px 60px #ffffff;
    transition: 0.5s;
  }
`;

const CreatePageDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
`;

const ContentDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 40px;
  padding: 200px 0 350px 0;
  width: 700px;

  @media (max-width: 480px) {
    width: 100%;
    padding: 200px;
    svg {
      width: 95%;
    }
  }
`;

const RedBackgroundDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px;
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 1s ease-out, transform 1s ease-out;

  & > * {
    opacity: 1;
    transform: translateX(0);
    transition: inherit;
  }
`;

const AnimatedText = styled.h1`
  font-size: 30px;
  font-family: Pretendard-Bold;
  color: black;
  text-align: center;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 1s ease-out, transform 1s ease-out;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const AnimatedSubtitle = styled.h2`
  font-size: 24px;
  font-family: Pretendard-Regular;
  color: black;
  text-align: center;
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 1s ease-out, transform 1s ease-out;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const AnimatedNotes = styled.span`
  font-size: 16px;
  font-family: Pretendard-semi-Bold;
  color: ${theme.color.primaryTint};
  text-align: center;
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 1s ease-out, transform 1s ease-out;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const AnimatedSVG = styled.div`
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 1s ease-out, transform 1s ease-out;

  svg {
    width: 100%;
    height: auto;
  }
`;

const StyledWrapper = styled.div`
  font-family: Pretendard-Bold;
  .btn {
    display: inline-block;
    padding: 0.9rem 1.8rem;
    font-size: 16px;
    font-weight: 700;
    color: ${theme.color.primaryTint};
    border: 3px solid ${theme.color.primary};
    border-radius: 20px;
    cursor: pointer;

    position: relative;
    background-color: transparent;
    text-decoration: none;
    overflow: hidden;
    z-index: 1;
    font-family: inherit;
  }

  .btn::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: ${theme.color.timeGrid[80]};
    transform: translateX(-100%);
    transition: all 0.3s;
    z-index: -1;
  }

  .btn:hover::before {
    transform: translateX(0);
  }
`;
