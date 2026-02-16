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

        <DescriptionSection ref={addToRefs} data-animation="fade-up">
          <h3>왜 타임테이블2 인가요?</h3>
          <p>
            타임테이블2는 복잡한 일정 조율 과정을 간소화하기 위해 만들어졌습니다.
            단순한 인터페이스를 통해 누구나 쉽게 모임 시간을 제안하고,
            구성원들의 가능한 시간을 한눈에 파악할 수 있습니다.
          </p>
          <p>
            로그인 없이도 30초 만에 시작할 수 있는 최적의 일정 조율 시스템을 경험해 보세요.
          </p>
          <h3>주요 기능</h3>
          <ul style={{ textAlign: "left", display: "inline-block" }}>
            <li>직관적인 드래그 방식의 시간 선택</li>
            <li>실시간으로 업데이트되는 그룹 시간표</li>
            <li>가장 많은 인원이 모일 수 있는 골든타임 자동 계산</li>
            <li>모바일과 PC 어디서나 편리한 접속</li>
          </ul>
        </DescriptionSection>

        <PageWrapper>
          <PrimaryButtonLarge onClick={() => navigate("/quick-create")}>
            <BsLightningChargeFill size={24} />
            로그인 없이 생성하기
          </PrimaryButtonLarge>
        </PageWrapper>
        <AdSense isReady={true} />
      </ContentDiv>
    </AboutPageDiv>
  );
}

const PrimaryButtonLarge = styled.button`
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
  color: white;
  border: none;
  padding: 20px 40px;
  border-radius: 16px;
  font-family: "Pretendard-Bold";
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px ${theme.color.primary}30;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px ${theme.color.primary}40;
  }

  @media (max-width: 480px) {
    padding: 16px 28px;
    font-size: 16px;
    gap: 8px;
    width: 90%;
    justify-content: center;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const PageWrapper = styled.div`
  ${theme.styles.flexCenterColumn}
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
`;

const DescriptionSection = styled.div`
  padding: 40px 20px;
  text-align: center;
  font-family: "Pretendard-Regular";
  color: ${theme.text.gamma[200]};
  line-height: 1.6;
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 1s ease-out,
    transform 1s ease-out;

  h3 {
    font-family: "Pretendard-Bold";
    font-size: 24px;
    margin-top: 30px;
    color: black;
  }

  p {
    font-size: 16px;
    max-width: 600px;
    margin: 10px auto;
  }

  li {
    font-size: 15px;
    margin-bottom: 8px;
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
