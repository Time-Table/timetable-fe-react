import theme from "../theme";
import Seo from "../Seo";

export default function PrivacyPage() {
  const sectionHeading = {
    fontSize: theme.font.size.title3,
    color: theme.text.gamma[200],
    margin: `${theme.space[8]} 0 ${theme.space[3]}`,
  };
  const linkStyle = { color: theme.color.primaryText, overflowWrap: "anywhere" };

  return (
    <>
      <Seo title="개인정보처리방침 - 타임테이블" description="타임테이블의 정보 수집·이용, 공개 범위, 광고와 이용 분석, 이용자의 선택을 안내합니다." />
      <main style={{
        background: theme.color.appSurface,
        padding: `${theme.space[10]} ${theme.space[4]}`,
        fontFamily: theme.font.family.regular,
        color: theme.text.gamma[300],
        lineHeight: theme.font.lineHeight.relaxed,
      }}>
        <article style={{
          background: theme.color.surface,
          padding: theme.space[6],
          width: "100%",
          maxWidth: theme.breakpoint.md,
          boxSizing: "border-box",
          margin: "0 auto",
          borderRadius: theme.radius.lg,
          boxShadow: theme.shadow.card,
          fontSize: theme.font.size.body,
          overflowWrap: "anywhere",
        }}>
          <h1 style={{ color: theme.color.primaryText, fontSize: theme.font.size.title2 }}>
            개인정보처리방침
          </h1>
          <p>수정일: 2026년 9월 25일</p>
          <p>
            타임테이블 운영팀은 모임 일정 조율 서비스를 제공하며, 아래와 같이 정보를 처리합니다.
            회원가입은 필요하지 않지만, 모임 참여와 일정 수정에는 이름과 비밀번호를 사용합니다.
          </p>

          <h2 style={sectionHeading}>1. 처리하는 정보와 이용 목적</h2>
          <ul>
            <li>모임 정보: 모임 제목, 후보 날짜와 시간 범위, 제외한 시간, 모임 식별자와 생성·수정 시각을 일정 조율에 사용합니다.</li>
            <li>참여 정보: 입력한 이름, 비밀번호, 가능한 시간을 참여자 확인·일정 저장·결과 집계에 사용합니다. 비밀번호는 원문 대신 해시 값으로 저장합니다.</li>
            <li>채팅: 입력한 이름, 메시지, 작성 시각을 모임 내 대화에 사용합니다.</li>
            <li>이용 기록: 방문·생성·참여·저장 등의 행동, 방문한 블로그 글, 시각, 유입 경로, 기기 구분, 모임 식별자, 생성·참여 역할과 무작위 브라우저 식별자를 서비스 이용 통계와 개선에 사용합니다.</li>
            <li>표별 입력 달성 통계: 모임 식별자, 생성 시각과 생성 당시 분석 마감, 최초 3명의 표별 가명 참여키와 첫 유효 입력 시각, 달성·수집 상태를 서비스 개선에 사용합니다. 가명 참여키는 같은 표 안의 같은 이름을 구분하도록 서버에서 만들며, 이 통계에 이름·비밀번호·가능 시간 원문을 복사하지 않습니다. 이 기록은 Google Analytics나 Microsoft Clarity로 보내지 않습니다.</li>
            <li>요청 처리: IP 주소를 과도한 요청 제한 등 서비스 보호 과정에서 처리합니다.</li>
            <li>문의: 이메일로 제공한 연락처와 문의 내용을 답변 및 요청 확인에 사용합니다.</li>
          </ul>

          <h2 style={sectionHeading}>2. 모임 링크와 정보 공개 범위</h2>
          <p>
            모임 링크를 가진 사람은 모임 제목, 참여자 이름과 가능한 시간, 채팅 내용을 확인할 수 있습니다.
            타임테이블은 익명 투표 서비스가 아닙니다. 링크와 입력 내용을 공유할 때 이 공개 범위를 고려해 주세요.
            비밀번호는 본인 일정의 확인·수정·참여 취소에 사용하며 다른 참여자에게 표시하지 않습니다.
          </p>

          <h2 style={sectionHeading}>3. 쿠키와 브라우저 저장소</h2>
          <p>
            서비스는 브라우저 저장소에 참여 이름, 모임 정보, 안내 표시 상태, 무작위 방문자 식별자와
            최초 유입 경로를 저장합니다. 이는 참여 편의와 방문 통계에 사용됩니다.
            방문자 식별자와 유입 경로에는 별도 만료 기간을 두고 있지 않습니다.
          </p>
          <p>
            브라우저 설정에서 쿠키 및 사이트 데이터를 차단하거나 삭제할 수 있습니다.
            이 경우 저장된 참여 정보나 환경설정이 초기화될 수 있습니다.
            브라우저의 사이트 데이터를 삭제해도 서버에 저장된 모임·참여·채팅 기록이 함께 삭제되지는 않습니다.
          </p>

          <h2 style={sectionHeading}>4. 이용 분석과 Google 광고</h2>
          <p>
            방문 현황과 사용성을 파악하기 위해 Google Analytics와 Microsoft Clarity를 사용하며,
            광고 게재에는 Google AdSense를 사용합니다. 이 서비스들은 쿠키, 웹 비콘, IP 주소와 기타 식별자를 이용해 정보를 수집할 수 있습니다.
          </p>
          <ul>
            <li>
              Google Analytics는 페이지 조회와 이용 환경 등을 분석합니다.
              자세한 내용은 <a href="https://policies.google.com/technologies/partner-sites?hl=ko" style={linkStyle}>Google의 파트너 사이트 정보 이용 안내</a>와{" "}
              <a href="https://policies.google.com/privacy?hl=ko" style={linkStyle}>Google 개인정보처리방침</a>을 확인해 주세요.
            </li>
            <li>
              Microsoft Clarity는 클릭·스크롤·페이지 이용 및 화면 구성 정보를 바탕으로 히트맵과 세션 재생을 제공해 사용성을 분석합니다.
              생성·참여 등의 행동과 역할 구분도 분석에 사용합니다.
              자세한 내용은 <a href="https://privacy.microsoft.com/ko-kr/privacystatement" style={linkStyle}>Microsoft 개인정보처리방침</a>을 확인해 주세요.
            </li>
            <li>
              Google 및 제3자 광고 공급업체는 쿠키를 이용하여 이 사이트나 다른 사이트의 이전 방문 기록을 바탕으로 광고를 게재할 수 있습니다.
              Google의 광고 쿠키를 통해 Google과 파트너는 방문 기록에 따른 광고를 제공할 수 있습니다.
            </li>
          </ul>
          <p>
            <a href="https://myadcenter.google.com/" style={linkStyle}>Google 내 광고 센터</a>에서 개인 맞춤 광고를 사용 중지할 수 있습니다.
            제3자 광고 업체의 선택 사항은 <a href="https://optout.aboutads.info/" style={linkStyle}>광고 쿠키 선택 페이지</a>에서 확인할 수 있습니다.
            광고 개인 맞춤설정을 끄는 것은 모든 광고나 이용 분석을 차단하는 것과는 다릅니다.
            Google Analytics 측정은 <a href="https://tools.google.com/dlpage/gaoptout?hl=ko" style={linkStyle}>측정 거부 브라우저 부가기능</a>으로 별도 제어할 수 있습니다.
          </p>
          <p>외부 서비스가 처리하는 정보와 보관 방식은 각 제공업체의 정책 및 적용 설정에 따릅니다.</p>

          <h2 style={sectionHeading}>5. 보관과 참여 취소</h2>
          <p>
            현재 모임·참여·일정 집계·채팅 정보, 참여 취소 시 남기는 기록과 블로그 방문 기록에는
            자동 삭제 기한이 설정되어 있지 않습니다. 서비스 행동 분석 기록은 180일을 기준으로 자동 정리하도록 설정되어 있습니다.
          </p>
          <p>
            참여를 취소하면 활성 참여 목록과 일정 집계에서 제외됩니다.
            다만 이름, 모임·참여자 식별자, 가능한 시간은 별도 기록으로 남으며, 이 기록에는 비밀번호가 포함되지 않습니다.
            채팅과 기존 이용 분석 기록도 참여 취소만으로 삭제되지 않습니다.
            모임 표 삭제 역시 관련 기록 전체의 삭제를 의미하지 않습니다.
          </p>
          <p>
            표별 입력 달성 통계는 서비스 행동 분석 기록의 180일 정리 대상과 별개입니다.
            참여 취소·일정 비우기·모임 표 삭제 뒤에도 유지하며, 현재 자동 삭제 기한은 설정되어 있지 않습니다.
            표별 가명 참여키도 함께 남으므로 익명 정보로 간주하지 않습니다.
          </p>
          <p>남아 있는 정보의 삭제를 요청하려면 아래 연락처로 문의해 주세요.</p>

          <h2 style={sectionHeading}>6. 문의와 정보 관련 요청</h2>
          <p>
            개인정보 처리, 열람·수정·삭제에 관한 문의는 타임테이블 운영팀으로 보내 주세요.
            요청할 때 해당 모임 링크와 확인에 필요한 내용을 알려주시되, 비밀번호는 이메일에 적지 마세요.
          </p>
          <p><a href="mailto:timetable2official@gmail.com" style={linkStyle}>timetable2official@gmail.com</a></p>
          <button onClick={() => window.history.back()} style={{
            marginTop: theme.space[6],
            padding: `${theme.space[3]} ${theme.space[5]}`,
            backgroundColor: theme.color.primary,
            color: theme.text.gamma[100],
            border: "none",
            borderRadius: theme.radius.sm,
            cursor: "pointer",
            fontSize: theme.font.size.body,
            fontFamily: theme.font.family.medium,
          }}>
            돌아가기
          </button>
        </article>
      </main>
    </>
  );
}
