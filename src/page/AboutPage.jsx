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
import { BsLightningChargeFill } from "react-icons/bs";
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
            // 한 번 보여진 것은 계속 유지되도록 관찰 중지 (선택 사항)
            // observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
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

        <DescriptionSection ref={addToRefs} data-animation="fade-up" style={{ opacity: 1, transform: "translateY(0)" }}>
          <h3>왜 타임테이블2 인가요?</h3>
          <p>
            타임테이블2는 복잡한 일정 조율 과정을 간소화하기 위해 만들어진 무료 서비스입니다.
            회원가입이나 번거로운 로그인 과정 없이, 단 30초 만에 약속을 제안하고
            구성원들의 가능한 시간을 한눈에 파악할 수 있는 가장 효율적인 시스템을 제공합니다.
          </p>
          <p>
            우리는 일상 속에서 빈번하게 일어나는 "언제 시간 돼?"라는 질문에 대한
            가장 빠르고 명확한 답변을 찾을 수 있도록 돕는 것을 목표로 합니다.
            직관적인 인터페이스와 실시간 데이터 동기화를 통해 불필요한 대화 시간을 줄이고,
            더욱 즐거운 모임을 준비하는 데 집중할 수 있도록 지원합니다.
          </p>
          <h3>주요 기능 및 장점</h3>
          <ul style={{ textAlign: "left", display: "inline-block", padding: "0 20px" }}>
            <li><strong>직관적인 드래그 방식:</strong> 모바일과 PC 어디서나 손쉽게 시간을 선택할 수 있습니다.</li>
            <li><strong>실시간 그룹 시간표:</strong> 모든 구성원의 응답이 실시간으로 취합되어 한눈에 보여집니다.</li>
            <li><strong style={{ color: "#D4AF37" }}>골든타임 자동 추천:</strong> 알고리즘을 통해 가장 많은 인원이 모일 수 있는 최적의 시간을 자동으로 찾아줍니다.</li>
            <li><strong>완벽한 익명성 보장:</strong> 로그인 없이 이름만으로 참여가 가능하며, 개인정보를 요구하지 않습니다.</li>
            <li><strong>반응형 디자인:</strong> 다양한 디바이스(스마트폰, 태블릿, PC)에 최적화된 사용자 경험을 제공합니다.</li>
          </ul>
          <h3>이런 분들께 추천합니다</h3>
          <p>
            - 대학 조별 과제 시간을 정해야 하는 학생들<br />
            - 회식이나 정기 모임 날짜를 조율해야 하는 동호회<br />
            - 여러 명의 일정을 한꺼번에 관리해야 하는 프로젝트 매니저<br />
            - 친구들과의 주말 약속을 빠르게 확정하고 싶은 분들
          </p>
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
  opacity: 0.1;
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
  opacity: 0.1;
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
  opacity: 0.1;
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
  opacity: 0.1;
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
  opacity: 0.1;
  transform: translateX(-20px);
  transition:
    opacity 1s ease-out,
    transform 1s ease-out;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const AnimatedSVG = styled.div`
  opacity: 0.1;
  transform: translateY(20px);
  transition:
    opacity 1s ease-out,
    transform 1s ease-out;

  svg {
    width: 100%;
    height: auto;
  }
`;
