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
        title="서비스 소개 — 약속 조율 도구 타임테이블"
        description="타임테이블은 회원가입 없이 가능한 시간을 모아 약속을 조율하는 무료 도구입니다. 이름과 비밀번호로 참여하고, 저장된 응답을 바탕으로 만날 시간을 찾아보세요."
      />
      <PageHeading>약속 조율 도구, 타임테이블 소개</PageHeading>
      <ContentDiv>
        <div>
          <AnimatedText ref={addToRefs}>다 같이 만나고 싶은데,</AnimatedText>
          <AnimatedText ref={addToRefs}>언제 시간 되세요?</AnimatedText>
        </div>
        <div>
          <AnimatedSubtitle ref={addToRefs} data-animation="slide">
            각자 다른 일정, 한곳에 모아 보세요
          </AnimatedSubtitle>
          <div>
            <Talk />
          </div>
        </div>
        <AnimatedText ref={addToRefs}>
          여러 사람의 <span style={{ color: theme.color.primary }}>시간 맞추기</span>, 타임테이블로 시작하세요
        </AnimatedText>
        <RedBackgroundDiv ref={addToRefs} data-animation="slide">
          <AnimatedText>
            친구와의 약속부터 단체 모임까지 가능한 시간{" "}
            <span style={{ color: theme.color.primary }}>체크 </span>
          </AnimatedText>
        </RedBackgroundDiv>{" "}
        <RedBackgroundDiv ref={addToRefs} data-animation="slide">
          <AnimatedSubtitle>
            내가 가능한 시간을 드래그로{" "}
            <span style={{ color: theme.color.primary }}>선택 </span>
          </AnimatedSubtitle>

          <AnimatedSVG ref={addToRefs} data-animation="fade-up">
            <Preview1 />
          </AnimatedSVG>
        </RedBackgroundDiv>
        <RedBackgroundDiv ref={addToRefs} data-animation="slide">
          <AnimatedText>모임 표를 만들고 링크로 공유하세요</AnimatedText>
          <AnimatedSVG ref={addToRefs} data-animation="fade-up">
            <Preview2 />
          </AnimatedSVG>
        </RedBackgroundDiv>
        <RedBackgroundDiv ref={addToRefs} data-animation="slide">
          <AnimatedText>시간대별로 누가 가능한지 확인하세요</AnimatedText>
          <AnimatedSVG ref={addToRefs} data-animation="fade-up">
            <Preview3 />
          </AnimatedSVG>
        </RedBackgroundDiv>
        <div>
          <AnimatedText ref={addToRefs} style={{ color: theme.color.primary }}>
            가능한 시간을 모아, 함께 만날 때를 정하세요.
          </AnimatedText>

          <AnimatedNotes ref={addToRefs} data-animation="slide">
            스마트폰·태블릿·PC에서 이용할 수 있어요
          </AnimatedNotes>
        </div>

        <DescriptionSection ref={addToRefs} data-animation="fade-up" style={{ opacity: 1, transform: "translateY(0)" }}>
          <h3>타임테이블은 어떤 서비스인가요?</h3>
          <p>
            타임테이블은 여러 사람의 가능한 시간을 모아 약속을 정하는 무료 서비스입니다.
            회원가입 없이 모임 표를 만들고 링크를 공유할 수 있습니다.
            참여자는 이름(닉네임)과 비밀번호를 입력한 뒤 가능한 시간을 선택하고 저장합니다.
          </p>
          <p>
            채팅방에 흩어진 답변을 하나씩 비교하는 대신, 저장된 응답을 전체 시간표에서
            확인할 수 있습니다. 가능한 인원이 많은 시간대를 골든타임으로 추천하므로,
            참여자들과 결과를 확인하고 모임 시간을 정해 보세요.
          </p>
          <h3>주요 기능 및 장점</h3>
          <ul style={{ textAlign: "left", display: "inline-block", padding: "0 20px" }}>
            <li><strong>드래그로 시간 선택:</strong> 모바일과 PC에서 가능한 시간을 선택하고 저장할 수 있습니다.</li>
            <li><strong>전체 시간표:</strong> 참여자가 저장한 응답을 한 화면에서 비교할 수 있습니다. 다른 사람의 최신 응답은 새로고침하여 확인하세요.</li>
            <li><strong style={{ color: "#D4AF37" }}>골든타임 추천:</strong> 저장된 응답을 기준으로 가능한 인원이 많은 시간대부터 보여줍니다.</li>
            <li><strong>회원가입 없이 참여:</strong> 이름(닉네임)과 비밀번호를 사용합니다. 참여를 위해 이메일이나 전화번호를 입력할 필요는 없습니다.</li>
            <li><strong>링크로 결과 공유:</strong> 모임 링크를 가진 사람은 참여자의 이름과 가능한 시간, 채팅 내용을 볼 수 있습니다. 공개해도 되는 닉네임을 사용하고 민감한 정보는 입력하지 마세요.</li>
            <li><strong>여러 기기에서 이용:</strong> 스마트폰, 태블릿, PC의 웹 브라우저에서 이용할 수 있습니다.</li>
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
            회원가입 없이 표 만들기
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

const AboutPageDiv = styled.main`
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

// 검색엔진과 스크린리더용 페이지 제목. 히어로 카피가 이미 시각적 헤드라인 역할을 한다.
const PageHeading = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const AnimatedText = styled.p`
  font-size: 30px;
  margin: 0.67em 0;
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
