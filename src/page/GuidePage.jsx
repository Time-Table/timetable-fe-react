import React from "react";
import styled from "@emotion/styled";
import theme from "../theme";
import Seo from "../Seo";
import { Link } from "react-router-dom";

const GuidePage = () => {
  return (
    <PageWrapper>
      <Seo title="이용 가이드 - 타임테이블" description="모임 표 만들기부터 이름·비밀번호로 참여하기, 가능한 시간 선택과 저장, 골든타임 확인, 일정 수정과 참여 취소까지 안내합니다." />
      <Content>
        <Title>이용 가이드</Title>
        <p className="subtitle">모임 표를 만들고, 각자의 가능한 시간을 저장한 뒤 함께 만날 시간을 정해 보세요.</p>
        
        <Section>
          <h2>1. 테이블 생성 및 시간 범위 설정</h2>
          <p>
            메인 페이지에서 모임 이름, 후보 날짜, 시작 시간과 종료 시간을 정합니다.
            미리 채워진 값은 모임에 맞게 바꿀 수 있습니다.
            '이대로 만들기'를 누르면 선택 사항인 시간 잠금 화면이 열립니다.
            아무도 선택할 수 없게 할 시간이 있다면 표시한 뒤 '잠그고 생성'을,
            없다면 '생성'을 누르세요. 생성이 완료되면 모임 링크를 복사하거나 표로 이동할 수 있습니다.
          </p>
        </Section>

        <Section>
          <h2>2. 초대 링크 공유하기</h2>
          <p>
            표 상단의 '초대 링크'에서 '복사하기'를 누르고, 함께 약속을 잡을 사람에게 공유하세요.
            앱 설치나 회원가입은 필요하지 않습니다. 링크를 받은 사람은 이름(닉네임)과
            비밀번호를 입력해 참여할 수 있습니다.
            모임 링크를 가진 사람은 참여자의 이름과 가능한 시간, 채팅 내용을 볼 수 있으므로
            링크를 공유할 범위를 정해 주세요.
          </p>
        </Section>

        <Section>
          <h2>3. 가능한 시간 선택 후 저장하기</h2>
          <p>
            '참여/삭제'에서 이름(닉네임)과 비밀번호를 입력하고 '참여 / 수정'을 누르세요.
            '내 일정' 화면에서 가능한 시간을 드래그하거나 터치하여 선택합니다.
            잘못 선택한 칸은 다시 선택해 해제할 수 있습니다.
          </p>
          <p>
            <strong>선택만으로는 저장되지 않습니다. '저장하기'를 누르고 '저장되었습니다!' 안내를 확인하세요.</strong>
          </p>
          <p>
            저장에 실패했다는 안내가 나오면 연결 상태를 확인하고 다시 저장해 주세요.
          </p>
        </Section>

        <Section>
          <h2>4. 그룹 통계 및 골든타임 확인</h2>
          <p>
            저장된 응답은 전체 시간표에 모입니다. 모바일에서는 '전체 시간표 보기'를 눌러 확인하세요.
            전체 참여자를 보는 상태에서 색이 진한 칸일수록 가능한 인원이 많습니다.
            '골든타임 순위'를 누르면 가능한 인원이 많은 시간대부터 볼 수 있습니다.
            다른 사람이 저장한 최신 응답은 전체 시간표의 새로고침 버튼으로 불러오세요.
            후보 시간의 인원과 명단을 확인한 뒤 참여자들과 최종 약속을 정하면 됩니다.
          </p>
        </Section>

        <Section>
          <h2>5. 일정 수정과 참여 취소</h2>
          <p>
            같은 모임 링크에서 '참여/삭제'를 열고 처음 사용한 이름과 비밀번호로 '참여 / 수정'을 누르세요.
            '내 일정'에서 시간을 바꾸고 다시 '저장하기'를 눌러야 변경 내용이 반영됩니다.
            참여를 취소하려면 '참여/삭제'에 이름과 비밀번호를 입력하고 '삭제'를 누른 뒤 확인하세요.
          </p>
          <p>
            참여를 취소하면 활성 참여 목록과 일정 집계에서 제외됩니다.
            다만 이름과 가능한 시간의 별도 기록, 작성한 채팅 등은 남습니다.
            보관 범위와 삭제 요청 방법은 <Link to="/privacy">개인정보처리방침</Link>에서 확인해 주세요.
          </p>
        </Section>

        <Section>
          <h2>자주 묻는 질문 (FAQ)</h2>
          <FaqItem>
            <strong>Q. 다른 사람에게 어떤 정보가 보이나요?</strong>
            <p>A. 모임 링크를 가진 사람은 참여자의 이름과 가능한 시간, 채팅 내용을 볼 수 있습니다. 비밀번호는 다른 참여자에게 표시하지 않습니다. 공개해도 되는 닉네임을 사용하고 민감한 정보는 입력하지 마세요.</p>
          </FaqItem>
          <FaqItem>
            <strong>Q. 모바일에서도 똑같이 사용할 수 있나요?</strong>
            <p>A. 스마트폰, 태블릿, PC의 웹 브라우저에서 이용할 수 있습니다. 모바일에서는 '전체 시간표 보기'를 눌러 참여자들이 저장한 시간을 확인할 수 있습니다.</p>
          </FaqItem>
          <FaqItem>
            <strong>Q. 비밀번호는 꼭 입력해야 하나요?</strong>
            <p>A. 네, 참여할 때 이름과 비밀번호를 모두 입력해야 합니다. 같은 모임에서 다시 참여하거나 일정을 수정·취소할 때도 처음 사용한 이름과 비밀번호를 입력하세요. 참여를 위해 이메일이나 전화번호를 입력할 필요는 없습니다.</p>
          </FaqItem>
        </Section>
      </Content>
    </PageWrapper>
  );
};

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
  
  h2 {
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
