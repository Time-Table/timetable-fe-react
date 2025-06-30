import theme from "../theme";

export default function PrivacyPage() {
  return (
    <div
      style={{
        background: "#F5F5F5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        minHeight: "100vh",
        fontFamily: "Pretendard, sans-serif",
      }}
    >
      <h2 style={{ color: theme.color.primary, fontSize: "24px", fontWeight: "bold" }}>
        📜 개인정보처리방침
      </h2>
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          width: "80%",
          maxWidth: "600px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          textAlign: "left",
          fontSize: "16px",
          lineHeight: "1.6",
        }}
      >
        <h3>1. 총칙</h3>
        <p>
          본 개인정보처리방침은 <strong>타임테이블</strong> 서비스가 이용자의 개인정보를 어떻게
          수집, 이용, 보호하는지를 설명합니다.
        </p>

        <h3>2. 수집하는 개인정보 항목</h3>
        <ul>
          <li>필수 정보: 계정 정보(이름, 비밀번호)</li>
          <li>자동 수집: IP 주소, 접속 로그, 쿠키, 서비스 이용 기록</li>
          <li>선택 정보: 사용자가 입력하는 기타 정보</li>
        </ul>

        <h3>3. 개인정보 이용 목적</h3>
        <ul>
          <li>서비스 제공 및 운영</li>
          <li>고객 문의 응대 및 공지 전달</li>
          <li>서비스 개선 및 맞춤형 콘텐츠 제공</li>
        </ul>

        <h3>4. 개인정보 보호책임자</h3>
        <p>문의 사항은 아래 담당자에게 연락해주세요.</p>
        <p>{`email: timetable2official@gmail.com`}</p>
      </div>

      <button
        onClick={() => window.history.back()}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: theme.color.primary,
          color: "white",
          fontSize: "16px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontFamily: "Pretendard-Medium",
        }}
      >
        돌아가기
      </button>
    </div>
  );
}
