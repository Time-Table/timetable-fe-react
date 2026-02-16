import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import theme from "../../theme";
import Seo from "../../Seo";
import { BsLightningChargeFill } from "react-icons/bs";
import { useEffect, useRef } from "react";
import { trackVisit } from "../../api/visit";
import { motion } from "framer-motion";

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
      <Seo title="타임테이블 - 시작하기" description="가장 빠른 일정 조율, 링크 하나로 시작하세요." />
      <PageWrapper>
        <ContentContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge>No Login, No Stress</Badge>
            <MainTitle>
              도대체 다들,<br />
              <span>언제 시간되세요?</span>
            </MainTitle>
            <SubTitle>
              번거로운 회원가입 없이 30초 만에 테이블을 생성하고<br />
              팀원들과 최적의 약속 시간을 찾아보세요.
            </SubTitle>
            
            <CTASection>
              <PrimaryButton onClick={() => navigate("/quick-create")}>
                <BsLightningChargeFill size={20} />
                로그인 없이 생성하기
              </PrimaryButton>
              <SecondaryButton onClick={() => navigate("/about")}>
                서비스 소개 보기
              </SecondaryButton>
            </CTASection>
          </motion.div>

          <FeatureGrid>
            <FeatureCard>
              <div className="icon">🚀</div>
              <h3>초고속 생성</h3>
              <p>필수 정보만 입력하면<br/>즉시 링크가 생성됩니다.</p>
            </FeatureCard>
            <FeatureCard>
              <div className="icon">📊</div>
              <h3>실시간 통계</h3>
              <p>누가 언제 가능한지<br/>한눈에 확인하세요.</p>
            </FeatureCard>
            <FeatureCard>
              <div className="icon">📱</div>
              <h3>멀티 디바이스</h3>
              <p>모바일과 PC 어디서든<br/>편리하게 이용하세요.</p>
            </FeatureCard>
          </FeatureGrid>
        </ContentContainer>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.div`
  width: 100%;
  min-height: calc(100vh - 72px);
  background: radial-gradient(circle at top right, ${theme.color.primary}08, transparent),
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
  font-size: 20px;
  color: ${theme.text.gamma[500]};
  line-height: 1.6;
  margin-bottom: 48px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const CTASection = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 80px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
  }
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
    border-color: ${theme.text.gamma[700]};
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
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  }
`;
