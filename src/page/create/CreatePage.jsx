import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import theme from "../../theme";
import Seo from "../../Seo";
import { BsLightningChargeFill } from "react-icons/bs";
import { useEffect, useRef } from "react";
import { trackVisit } from "../../api/visit";
import { motion } from "framer-motion";
import Preview3 from "../../assets/svg/Preview3";

export default function CreatePage() {
  const navigate = useNavigate();
  const hasTrackedVisit = useRef(false);

  useEffect(() => {
    if (!hasTrackedVisit.current) {
      trackVisit("landing");
      hasTrackedVisit.current = true;
    }
  }, []);

  return (
    <>
      <Seo
        title="타임테이블 - 시작하기"
        description="가장 빠른 일정 조율, 링크 하나로 시작하세요."
      />
      <PageWrapper>
        <ContentContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge>No Login, No Stress</Badge>
            <MainTitle>
              도대체 다들,
              <br />
              <span>언제 시간되세요?</span>
            </MainTitle>
          </motion.div>

          <PreviewSection
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <PreviewWrapper>
              <Preview3 width="100%" height="auto" />
            </PreviewWrapper>
            <PreviewLabel>서비스 화면 예시</PreviewLabel>
          </PreviewSection>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CTASection>
              <PrimaryButton onClick={() => navigate("/quick-create")}>
                <BsLightningChargeFill size={20} />
                로그인 없이 생성하기
              </PrimaryButton>
              <SecondaryButton onClick={() => navigate("/about")}>서비스 소개 보기</SecondaryButton>
            </CTASection>

            <SubTitle>
              번거로운 회원가입 없이 30초 만에 테이블을 생성하고 팀원들과{" "}
              <SubTitleEmphasis>최적의 약속 시간을 찾아보세요.</SubTitleEmphasis>{" "}
              타임테이블2는 복잡한 일정 조율 과정을 단순하게 만들고, 모임의 효율성을
              극대화하기 위해 설계된 무료 도구입니다. 이미 수많은 팀들이 이 서비스를 통해 조별 과제,
              회식, 주말 약속 등 다양한 일정들을 성공적으로 조율하고 있습니다.
            </SubTitle>
          </motion.div>

          <FeatureGrid>
            <FeatureCard>
              <div className="icon">🚀</div>
              <h3>초고속 테이블 생성</h3>
              <p>
                단 몇 번의 클릭으로 모임의 후보 날짜와 시간 범위를 설정할 수 있습니다. 불필요한 입력
                과정을 모두 제거하여, 누구나 즉시 일정 조율을 시작할 수 있는 최적의 환경을
                제공합니다.
              </p>
            </FeatureCard>
            <FeatureCard>
              <div className="icon">📊</div>
              <h3>실시간 데이터 분석</h3>
              <p>
                참여자들이 응답하는 즉시 그룹 시간표에 반영되어 한눈에 상황을 파악할 수 있습니다.
                가장 많은 인원이 참여 가능한 '골든타임'을 자동으로 계산하여 최적의 시간대를 추천해
                드립니다.
              </p>
            </FeatureCard>
            <FeatureCard>
              <div className="icon">📱</div>
              <h3>완벽한 기기 호환성</h3>
              <p>
                모바일 앱 설치 없이도 웹브라우저에서 바로 사용 가능합니다. 아이폰, 갤럭시, 태블릿,
                PC 등 모든 기기에서 동일하게 매끄러운 사용자 경험과 기능을 누릴 수 있습니다.
              </p>
            </FeatureCard>
          </FeatureGrid>

          <div
            style={{
              marginTop: "100px",
              padding: "40px",
              backgroundColor: theme.text.gamma[950],
              borderRadius: "24px",
            }}
          >
            <h2 style={{ fontFamily: "Pretendard-Bold", fontSize: "28px", marginBottom: "20px" }}>
              왜 타임테이블2를 써야 하나요?
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "30px",
                textAlign: "left",
              }}
            >
              <div>
                <h4 style={{ color: theme.color.primary, marginBottom: "10px" }}>
                  개인정보 걱정 없는 익명 참여
                </h4>
                <p style={{ fontSize: "14px", color: theme.text.gamma[500], lineHeight: "1.6" }}>
                  이메일 주소나 전화번호를 수집하지 않습니다. 오직 이름(닉네임)만으로 참여가
                  가능하여 보안 걱정 없이 가볍게 사용할 수 있습니다.
                </p>
              </div>
              <div>
                <h4 style={{ color: theme.color.primary, marginBottom: "10px" }}>
                  가독성 높은 시각화 기능
                </h4>
                <p style={{ fontSize: "14px", color: theme.text.gamma[500], lineHeight: "1.6" }}>
                  복잡한 표 대신 색상의 농도를 통해 참여 인원 분포를 시각적으로 보여줍니다. 색이
                  진한 부분을 찾는 것만으로도 빠른 의사결정이 가능합니다.
                </p>
              </div>
              <div>
                <h4 style={{ color: theme.color.primary, marginBottom: "10px" }}>
                  편리한 공유 시스템
                </h4>
                <p style={{ fontSize: "14px", color: theme.text.gamma[500], lineHeight: "1.6" }}>
                  고유한 짧은 링크를 통해 카카오톡 단톡방이나 대규모 커뮤니티에 쉽게 공유하고,
                  실시간으로 취합되는 결과물을 확인해 보세요.
                </p>
              </div>
            </div>
          </div>
        </ContentContainer>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.div`
  width: 100%;
  min-height: calc(100vh - 72px);
  background:
    radial-gradient(circle at top right, ${theme.color.primary}08, transparent),
    radial-gradient(circle at bottom left, ${theme.color.button.blue}08, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  box-sizing: border-box;
`;

const ContentContainer = styled.div`
  max-width: 1000px;
  width: 100%;
  text-align: center;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 6px 16px;
  background-color: ${theme.color.primary}15;
  color: ${theme.color.primary};
  border-radius: 99px;
  font-family: "Pretendard-Bold";
  font-size: 14px;
  margin-bottom: 24px;
`;

const MainTitle = styled.h1`
  font-family: "Pretendard-Black";
  font-size: 64px;
  line-height: 1.2;
  color: ${theme.text.gamma[100]};
  margin-bottom: 24px;

  span {
    background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  @media (max-width: 768px) {
    font-size: 42px;
  }
`;

const SubTitle = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 18px;
  color: ${theme.text.gamma[500]};
  line-height: 1.8;
  margin-top: 0;
  margin-bottom: 60px;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const CTASection = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
  }
`;

const SubTitleEmphasis = styled.strong`
  font-family: "Pretendard-Bold";
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.05em;
`;

const PrimaryButton = styled.button`
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
  color: white;
  border: none;
  padding: 18px 36px;
  border-radius: 16px;
  font-family: "Pretendard-Bold";
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px ${theme.color.primary}30;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px ${theme.color.primary}40;
  }
`;

const SecondaryButton = styled.button`
  background: white;
  color: ${theme.text.gamma[200]};
  border: 1px solid ${theme.text.gamma[800]};
  padding: 18px 36px;
  border-radius: 16px;
  font-family: "Pretendard-Bold";
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${theme.text.gamma[950]};
    border-color: ${theme.text.gamma[800]};
  }
`;

const PreviewSection = styled(motion.div)`
  width: 100%;
  margin-bottom: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const PreviewLabel = styled.span`
  display: inline-block;
  padding: 4px 14px;
  background-color: ${theme.color.primary}12;
  color: ${theme.color.primary};
  border-radius: 99px;
  font-family: "Pretendard-Medium";
  font-size: 13px;
`;

const PreviewWrapper = styled.div`
  width: 100%;
  max-width: 860px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid ${theme.text.gamma[900]};
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.04),
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.03);

  svg {
    display: block;
    width: 100%;
    height: auto;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: white;
  padding: 32px;
  border-radius: 24px;
  border: 1px solid ${theme.text.gamma[900]};
  text-align: left;
  transition: all 0.3s ease;

  .icon {
    font-size: 32px;
    margin-bottom: 16px;
  }

  h3 {
    font-family: "Pretendard-Bold";
    font-size: 20px;
    margin-bottom: 12px;
    color: ${theme.text.gamma[100]};
  }

  p {
    font-family: "Pretendard-Regular";
    font-size: 15px;
    color: ${theme.text.gamma[500]};
    line-height: 1.5;
  }

  &:hover {
    transform: translateY(-5px);
    border-color: ${theme.color.primary}40;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  }
`;
