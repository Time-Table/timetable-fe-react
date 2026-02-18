import React from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Seo from "../Seo";

const GuidePage = () => {
  return (
    <PageWrapper>
      <Seo title="이용 가이드 - 타임테이블2" description="타임테이블2를 효율적으로 사용하는 방법을 알아보세요." />
      <Content>
        <Title>이용 가이드</Title>
        <p className="subtitle">타임테이블2를 처음 사용하시나요? 아래 가이드를 따라 30초 만에 약속을 잡아보세요.</p>
        
        <Section>
          <h3>1. 테이블 생성 및 시간 범위 설정</h3>
          <p>
            메인 페이지에서 '로그인 없이 생성하기'를 클릭하여 시작하세요. 
            모임의 성격에 맞는 이름을 입력하고(예: 팀 회의, 친구 생일 파티), 
            후보가 될 수 있는 날짜들을 캘린더에서 모두 선택합니다. 
            참여자들이 투표할 수 있는 시작 시간과 종료 시간을 설정하면 즉시 고유한 약속 테이블이 생성됩니다.
          </p>
        </Section>

        <Section>
          <h3>2. 초대 링크 공유하기</h3>
          <p>
            생성된 테이블 상단의 '초대' 버튼을 누르면 링크가 복사됩니다. 
            이 링크를 카카오톡 단톡방이나 협업 툴(Slack, Discord 등)에 공유하세요. 
            초대받은 사람들은 별도의 앱 설치나 회원가입 과정 없이, 
            공유받은 링크를 클릭하는 것만으로 즉시 자신의 가용 시간을 입력할 수 있습니다.
          </p>
        </Section>

        <Section>
          <h3>3. 개별 일정 등록 및 드래그 입력</h3>
          <p>
            참여자는 자신의 이름을 입력하고 '빠른 참여'를 통해 시간표 화면으로 들어갑니다. 
            자신이 모임에 참여할 수 있는 시간대를 마우스로 드래그하거나 스마트폰 화면에서 터치하여 선택하세요. 
            입력과 동시에 데이터가 서버에 저장되므로 별도의 저장 버튼을 누를 필요가 없어 편리합니다. 
            잘못 입력한 경우, 같은 위치를 다시 터치하거나 드래그하여 선택을 취소할 수 있습니다.
          </p>
        </Section>

        <Section>
          <h3>4. 그룹 통계 및 골든타임 확인</h3>
          <p>
            모든 구성원이 입력한 결과는 '전체 일정' 탭에서 실시간으로 합산되어 보여집니다. 
            색상이 진하게 표시된 부분일수록 더 많은 인원이 참여 가능한 시간대임을 의미합니다. 
            특히 '순위' 탭을 활용하면, 시스템이 자동으로 계산한 최적의 시간(가장 많은 인원이 모일 수 있는 골든타임)을 
            1위부터 순서대로 확인할 수 있어 의사결정이 훨씬 빨라집니다.
          </p>
        </Section>

        <Section>
          <h3>5. 일정 수정 및 관리</h3>
          <p>
            한 번 입력한 일정을 수정하고 싶다면, 처음에 입력했던 이름과 동일한 이름으로 다시 접속하세요. 
            시스템이 기존 데이터를 불러와서 보여주므로 언제든지 가용 시간을 업데이트할 수 있습니다. 
            생성자는 관리자 기능을 통해 테이블의 제목을 변경하거나 불필요한 테이블을 삭제할 수도 있습니다.
          </p>
        </Section>

        <Section>
          <h3>자주 묻는 질문 (FAQ)</h3>
          <FaqItem>
            <strong>Q. 회원가입을 하지 않아도 데이터가 안전한가요?</strong>
            <p>A. 네, 각 테이블은 고유한 ID로 관리되며 이름 기반의 인증 방식을 통해 본인의 데이터에 접근할 수 있습니다. 개인정보를 수집하지 않으므로 더욱 안전하게 이용하실 수 있습니다.</p>
          </FaqItem>
          <FaqItem>
            <strong>Q. 모바일에서도 똑같이 사용할 수 있나요?</strong>
            <p>A. 네, 타임테이블2는 완전한 반응형 웹사이트로 설계되어 있습니다. 갤럭시, 아이폰 등 스마트폰은 물론 태블릿과 PC 어디서나 최적화된 화면으로 이용이 가능합니다.</p>
          </FaqItem>
          <FaqItem>
            <strong>Q. 누군가 제 이름을 사칭하면 어떻게 하나요?</strong>
            <p>A. 비밀번호 설정 기능을 통해 본인만 자신의 일정을 수정할 수 있도록 보호할 수 있습니다. 중요한 약속이라면 참여 시 비밀번호 설정을 권장합니다.</p>
          </FaqItem>
        </Section>
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
