import React from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Seo from "../Seo";
import AdSense from "../component/AdSense";

const GuidePage = () => {
  return (
    <PageWrapper>
      <Seo title="이용 가이드 - 타임테이블2" description="타임테이블2를 효율적으로 사용하는 방법을 알아보세요." />
      <Content>
        <Title>이용 가이드</Title>
        <p className="subtitle">타임테이블2를 처음 사용하시나요? 아래 가이드를 따라 30초 만에 약속을 잡아보세요.</p>
        
        <Section>
          <h3>1. 테이블 생성하기</h3>
          <p>
            '빠른 생성' 버튼을 클릭하여 모임 이름과 후보 날짜를 선택합니다. 
            참여자들이 선택할 수 있는 시간 범위를 설정하면 즉시 고유한 링크가 생성됩니다.
          </p>
        </Section>

        <AdSense isReady={true} />

        <Section>
          <h3>2. 링크 공유 및 초대</h3>
          <p>
            생성된 테이블의 URL을 복사하여 카카오톡, 슬랙 등 커뮤니티에 공유하세요. 
            참여자들은 별도의 로그인 없이 이름만 입력하고 즉시 참여할 수 있습니다.
          </p>
        </Section>

        <Section>
          <h3>3. 가능한 시간 드래그하기</h3>
          <p>
            시간표에서 자신이 가능한 시간대를 마우스로 드래그하거나 모바일에서 터치하여 선택합니다.
            선택된 시간은 실시간으로 저장되며 그룹 시간표에 즉시 반영됩니다.
          </p>
        </Section>

        <Section>
          <h3>4. 최적의 시간 확인 (골든타임)</h3>
          <p>
            '순위' 탭을 클릭하면 가장 많은 인원이 참여 가능한 최적의 시간대를 순위별로 확인할 수 있습니다.
            색상이 진할수록 더 많은 인원이 참여 가능한 시간대입니다.
          </p>
        </Section>

        <Section>
          <h3>자주 묻는 질문 (FAQ)</h3>
          <FaqItem>
            <strong>Q. 회원가입이 필요한가요?</strong>
            <p>A. 아니요, 타임테이블2는 회원가입 없이 누구나 익명으로 참여할 수 있는 서비스입니다.</p>
          </FaqItem>
          <FaqItem>
            <strong>Q. 생성한 테이블은 언제까지 유지되나요?</strong>
            <p>A. 마지막 접속으로부터 최소 30일간 유지되며, 이후에는 데이터 보호를 위해 자동으로 삭제될 수 있습니다.</p>
          </FaqItem>
          <FaqItem>
            <strong>Q. 잘못 입력한 시간을 수정하고 싶어요.</strong>
            <p>A. 참여 시 입력했던 이름을 다시 입력하여 접속하면 언제든지 자신의 시간표를 수정할 수 있습니다.</p>
          </FaqItem>
        </Section>
        <AdSense isReady={true} />
      </Content>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  padding: 80px 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const Content = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 50px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);

  .subtitle {
    text-align: center;
    color: ${theme.text.gamma[500]};
    margin-bottom: 50px;
  }

  @media (max-width: 480px) {
    padding: 30px 20px;
  }
`;

const Title = styled.h1`
  text-align: center;
  font-family: "Pretendard-Bold";
  font-size: 32px;
  margin-bottom: 10px;
`;

const Section = styled.section`
  margin-bottom: 40px;
  
  h3 {
    font-family: "Pretendard-Bold";
    font-size: 20px;
    color: ${theme.color.primary};
    margin-bottom: 15px;
    border-left: 4px solid ${theme.color.primary};
    padding-left: 12px;
  }

  p {
    font-size: 16px;
    line-height: 1.8;
    color: ${theme.text.gamma[200]};
  }
`;

const FaqItem = styled.div`
  margin-top: 20px;
  background: ${theme.text.gamma[950]};
  padding: 20px;
  border-radius: 12px;

  strong {
    display: block;
    margin-bottom: 8px;
    color: black;
  }
  
  p {
    margin: 0;
    font-size: 15px;
  }
`;

export default GuidePage;
