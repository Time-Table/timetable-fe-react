import { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Preview1 from "../assets/svg/Preview1";
import Preview2 from "../assets/svg/Preview2";
import Preview3 from "../assets/svg/Preview3";
import Talk from "../assets/svg/Talk";
import Seo from "../Seo";
import { trackVisit } from "../api/visit";
import { useNavigate } from "react-router-dom";
import { BsCalendarDate, BsLightningChargeFill } from "react-icons/bs";
import { css } from "@emotion/react";
import Swal from "sweetalert2";
import { IoHelpCircleOutline } from "react-icons/io5";
import AdSense from "../component/AdSense";

export default function AboutPage() {
  const sectionsRef = useRef([]);
  const navigate = useNavigate();
  const hasTrackedVisit = useRef(false);

  useEffect(() => {
    const getVisitLog = async () => {
      if (!hasTrackedVisit.current) {
        await trackVisit("about");
        hasTrackedVisit.current = true;
      }
    };
    getVisitLog();
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
      },
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

  const handleHelpClick = () => {
    Swal.fire({
      title: "생성 방식 안내",
      html: `
        <div style="text-align: left; padding: 0 1rem;">
          <h4 style="color: ${theme.color.button.blue}; margin-bottom: 5px;">빠른 생성</h4>
          <p style="margin-top: 0; font-size: 15px;">
            모임 이름, 날짜, 시간만 빠르게 입력하여<br>
            신속하게 타임테이블을 생성할 수 있습니다.
          </p>
          <h4 style="color: ${theme.text.gamma[600]}; margin-bottom: 5px;">일반 생성 (준비중)</h4>
          <p style="margin-top: 0; font-size: 15px;">
            날짜, 시간, 공통 불가 시간 등을 세부적으로 설정하여<br>
            정교한 타임테이블을 만들 수 있습니다.
          </p>
        </div>
      `,
      confirmButtonText: "확인",
      confirmButtonColor: `${theme.color.primary}`,
    });
  };

  return (
    <AboutPageDiv>
      <Seo
        description={"타임테이블에 대해 궁금하신가요?"}
        url={"https://www.timetable2.com/about"}
      />
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
        <PageWrapper>
          <SelectionContainer>
            <SelectionBox onClick={() => navigate("/quick-create")}>
              <IconWrapper color={theme.color.primary}>
                <BsLightningChargeFill size={40} />
              </IconWrapper>
              <BoxTitle>빠른 생성</BoxTitle>
              <BoxDescription>필수 정보만으로 신속하게</BoxDescription>
            </SelectionBox>
            <SelectionBox disabled>
              <IconWrapper color={theme.color.button.blue}>
                <BsCalendarDate size={40} />
              </IconWrapper>
              <BoxTitle>일반 생성</BoxTitle>
              <BoxDescription>{"세부 설정으로 정교하게"}</BoxDescription>
              <BoxDescription>{"(준비중)"}</BoxDescription>
            </SelectionBox>
          </SelectionContainer>
          <HelpContainer onClick={handleHelpClick}>
            <IoHelpCircleOutline size={24} color={theme.text.gamma[500]} />
            <span>각 생성 방식이 궁금하신가요?</span>
          </HelpContainer>
        </PageWrapper>
        <AdSense />
      </ContentDiv>
    </AboutPageDiv>
  );
}

const PageWrapper = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
`;

const SelectionContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  @media (max-width: 480px) {
    flex-direction: row;
    width: 100%;
    gap: 15px;
  }
`;

const SelectionBox = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
  max-width: 220px;
  aspect-ratio: 1 / 1;
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: 20px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.3s ease,
    opacity 0.3s ease;
  background-color: white;
  padding: 20px;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 480px) {
    flex: 1;
    padding: 15px;
    justify-content: center;
  }

  ${(props) =>
    props.disabled &&
    css`
      filter: grayscale(100%);
      opacity: 0.6;
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: none;
      }
    `}
`;

const IconWrapper = styled.div`
  color: ${(props) => props.color};
  margin-bottom: 15px;
  @media (max-width: 480px) {
    margin-bottom: 10px;
    svg {
      width: 28px;
      height: 28px;
    }
  }
`;

const BoxTitle = styled.h2`
  font-family: "Pretendard-Bold";
  font-size: 22px;
  margin: 0 0 10px 0;
  text-align: center;
  @media (max-width: 480px) {
    font-size: 16px;
    margin-bottom: 5px;
  }
`;

const BoxDescription = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 16px;
  color: ${theme.text.gamma[500]};
  margin: 0;
  text-align: center;
  @media (max-width: 480px) {
    font-size: 12px;
    line-height: 1.3;
  }
`;

const HelpContainer = styled.div`
  ${theme.styles.flexCenterRow}
  margin-top: 40px;
  gap: 8px;
  cursor: pointer;
  color: ${theme.text.gamma[500]};
  font-family: "Pretendard-Regular";
  font-size: 16px;
  text-align: center;
  &:hover {
    color: ${theme.color.primary};
  }
  @media (max-width: 480px) {
    ${theme.styles.flexCenterColumn}
    font-size: 14px;
  }
`;

const AboutPageDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
`;

const ContentDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 40px;
  padding: 200px 0px 350px 0px;
  width: 100%;
  max-width: 700px;

  @media (max-width: 480px) {
    width: 100%;
    padding: 200px 0px 200px 0px;
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
  transition:
    opacity 1s ease-out,
    transform 1s ease-out;

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
  transition:
    opacity 1s ease-out,
    transform 1s ease-out;

  @media (max-width: 480px) {
    font-size: 20px;
    padding-bottom: 5px;
  }
`;

const AnimatedSubtitle = styled.h2`
  font-size: 24px;
  font-family: Pretendard-Regular;
  color: black;
  text-align: center;
  opacity: 0;
  transform: translateX(-20px);
  transition:
    opacity 1s ease-out,
    transform 1s ease-out;

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
  transition:
    opacity 1s ease-out,
    transform 1s ease-out;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const AnimatedSVG = styled.div`
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 1s ease-out,
    transform 1s ease-out;

  svg {
    width: 100%;
    height: auto;
  }
`;
