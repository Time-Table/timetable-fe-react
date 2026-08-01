import styled from "@emotion/styled";
import theme from "../theme";
import Seo from "../Seo";

export default function ContactPage() {
  return (
    <PageWrapper>
      <Seo
        title="문의하기 - 타임테이블"
        description="타임테이블 서비스 이용 중 궁금한 점이나 불편한 사항을 알려주세요. 이메일로 문의하시면 신속하게 답변드리겠습니다."
      />
      <Content>
        <Title>문의하기</Title>
        <Subtitle>궁금한 점이나 불편한 사항을 알려주세요. 최대한 빠르게 답변드리겠습니다.</Subtitle>

        <Section>
          <h2>이메일 문의</h2>
          <p>
            서비스 이용 중 문제가 발생하거나, 건의 사항, 버그 제보, 제휴 문의 등이 있으시면
            아래 이메일로 연락해 주세요.
          </p>
          <ContactEmail href="mailto:timetable2official@gmail.com">
            timetable2official@gmail.com
          </ContactEmail>
          <ResponseTime>
            <strong>평균 응답 시간:</strong> 영업일 기준 1~2일 이내
          </ResponseTime>
        </Section>

        <Section>
          <h2>자주 묻는 질문</h2>
          <FaqList>
            <FaqItem>
              <strong>Q. 서비스 이용은 무료인가요?</strong>
              <p>
                네, 타임테이블은 완전 무료로 이용하실 수 있습니다. 회원가입 없이
                바로 시작하실 수 있습니다.
              </p>
            </FaqItem>
            <FaqItem>
              <strong>Q. 만든 테이블은 얼마나 유지되나요?</strong>
              <p>
                생성된 테이블은 마지막 접속일로부터 일정 기간 동안 유지됩니다.
                중요한 일정은 별도로 기록해두시기를 권장합니다.
              </p>
            </FaqItem>
            <FaqItem>
              <strong>Q. 개인정보가 수집되나요?</strong>
              <p>
                타임테이블은 이름(닉네임)만으로 참여가 가능하며, 이메일·전화번호 등
                개인 식별 정보를 수집하지 않습니다. 자세한 내용은{" "}
                <a href="/privacy">개인정보처리방침</a>을 확인해 주세요.
              </p>
            </FaqItem>
            <FaqItem>
              <strong>Q. 광고 또는 제휴 문의는 어떻게 하나요?</strong>
              <p>
                광고 및 제휴 관련 문의는 위 이메일 주소로 연락해 주시면
                담당자가 확인 후 답변드리겠습니다.
              </p>
            </FaqItem>
          </FaqList>
        </Section>

        <Section>
          <h2>서비스 운영 정보</h2>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>서비스명</InfoLabel>
              <InfoValue>타임테이블 (Timetable)</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>웹사이트</InfoLabel>
              <InfoValue>https://timetable2.com</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>이메일</InfoLabel>
              <InfoValue>timetable2official@gmail.com</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>서비스 시작</InfoLabel>
              <InfoValue>2025년</InfoValue>
            </InfoItem>
          </InfoGrid>
        </Section>
      </Content>
    </PageWrapper>
  );
}

const PageWrapper = styled.main`
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

  @media (max-width: 480px) {
    padding: 30px 20px;
  }
`;

const Title = styled.h1`
  text-align: center;
  font-family: "Pretendard-Bold";
  font-size: 32px;
  color: ${theme.text.gamma[100]};
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${theme.text.gamma[500]};
  font-size: 16px;
  margin-bottom: 50px;
  line-height: 1.6;
`;

const Section = styled.section`
  margin-bottom: 50px;

  h2 {
    font-family: "Pretendard-Bold";
    font-size: 22px;
    color: ${theme.color.primary};
    margin-bottom: 16px;
    border-left: 4px solid ${theme.color.primary};
    padding-left: 12px;
  }

  p {
    font-size: 16px;
    line-height: 1.8;
    color: ${theme.text.gamma[300]};
    margin-bottom: 12px;
  }
`;

const ContactEmail = styled.a`
  display: inline-block;
  margin: 16px 0;
  padding: 14px 28px;
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
  color: white;
  font-family: "Pretendard-Bold";
  font-size: 18px;
  border-radius: 12px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 98, 204, 0.3);
  }
`;

const ResponseTime = styled.p`
  color: ${theme.text.gamma[500]} !important;
  font-size: 14px !important;
  margin-top: 8px !important;
`;

const FaqList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FaqItem = styled.div`
  background: ${theme.text.gamma[950]};
  padding: 20px;
  border-radius: 12px;

  strong {
    display: block;
    font-family: "Pretendard-SemiBold";
    font-size: 15px;
    color: ${theme.text.gamma[100]};
    margin-bottom: 8px;
  }

  p {
    margin: 0 !important;
    font-size: 15px !important;
  }

  a {
    color: ${theme.color.primary};
    text-decoration: underline;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  background: ${theme.text.gamma[950]};
  padding: 16px 20px;
  border-radius: 10px;
`;

const InfoLabel = styled.p`
  font-family: "Pretendard-SemiBold";
  font-size: 13px !important;
  color: ${theme.text.gamma[500]} !important;
  margin: 0 0 4px 0 !important;
`;

const InfoValue = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 15px !important;
  color: ${theme.text.gamma[100]} !important;
  margin: 0 !important;
`;
