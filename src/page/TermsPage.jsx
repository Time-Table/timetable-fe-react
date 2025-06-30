import theme from "../theme";

export default function TermsPage() {
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
        📜 타임테이블 이용약관
      </h2>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          width: "80%",
          maxWidth: "800px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          textAlign: "left",
          fontSize: "16px",
          lineHeight: "1.6",
        }}
      >
        <h3>제1조 (목적)</h3>
        <p>
          본 약관은 타임테이블(이하 "서비스")에서 제공하는 일정 조율 서비스의 이용과 관련하여,
          이용자와 서비스 간의 권리, 의무 및 책임 사항을 규정하는 것을 목적으로 합니다.
        </p>

        <h3>제2조 (용어의 정의)</h3>
        <ul>
          <li>
            <strong>서비스:</strong> 타임테이블에서 제공하는 일정 공유 및 조율 기능을 의미합니다.
          </li>
          <li>
            <strong>이용자:</strong> 본 약관에 따라 서비스를 이용하는 모든 개인 및 단체를
            의미합니다.
          </li>
          <li>
            <strong>회원:</strong> 서비스에 가입하여 계정을 생성한 이용자를 의미합니다.
          </li>
          <li>
            <strong>비회원:</strong> 회원 가입 없이 일정에 참여하는 이용자를 의미합니다.
          </li>
          <li>
            <strong>약속 테이블:</strong> 이용자가 특정 모임이나 일정 조율을 위해 생성하는 개별
            페이지를 의미합니다.
          </li>
          <li>
            <strong>초대 링크:</strong> 약속 테이블을 공유할 수 있도록 생성되는 고유 URL을
            의미합니다.
          </li>
        </ul>

        <h3>제3조 (약관의 효력 및 변경)</h3>
        <p>본 약관은 이용자가 서비스에 가입하거나 사용함으로써 동의한 것으로 간주됩니다.</p>
        <p>
          본 약관은 필요에 따라 변경될 수 있으며, 변경 시 서비스 내 공지사항을 통해 사전 고지합니다.
        </p>
        <p>변경된 약관에 동의하지 않을 경우, 이용자는 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>

        <h3>제4조 (회원 가입 및 계정 관리)</h3>
        <p>
          이용자는 서비스 가입 시 이름과 비밀번호를 등록해야 하며, 정확한 정보를 제공해야 합니다.
        </p>
        <p>타인의 정보를 도용하여 가입한 경우, 해당 계정은 삭제될 수 있습니다.</p>

        <h3>제5조 (서비스 이용 및 제한)</h3>
        <ul>
          <li>이용자는 본 약관과 관련 법령을 준수하여 서비스를 이용해야 합니다.</li>
          <li>다음과 같은 행위를 금지합니다.</li>
          <ul>
            <li>타인의 계정을 도용하는 행위</li>
            <li>부정확한 일정 정보를 입력하거나 허위 정보를 제공하는 행위</li>
            <li>서비스 내에서 불법적인 콘텐츠(악성 코드, 광고, 외설적 내용 등)를 게시하는 행위</li>
            <li>서비스 운영을 방해하는 행위 (해킹, 자동화 프로그램 이용, 데이터 조작 등)</li>
            <li>기타 법령 및 공공질서에 반하는 행위</li>
          </ul>
          <li>위반 행위가 발견될 경우, 서비스 이용이 제한되거나 계정이 삭제될 수 있습니다.</li>
        </ul>

        <h3>제6조 (개인정보 보호)</h3>
        <p>
          서비스는 이용자의 개인정보를 보호하기 위해 노력하며, 개인정보 보호 관련 사항은
          개인정보처리방침을 따릅니다.
        </p>

        <h3>제7조 (서비스 제공 및 변경)</h3>
        <p>
          서비스는 연중무휴 24시간 운영되지만, 기술적 문제 또는 운영상 필요에 따라 일시 중단될 수
          있습니다.
        </p>
        <p>서비스 제공이 중단될 경우, 사전에 공지를 통해 이용자에게 안내합니다.</p>

        <h3>제8조 (면책 조항)</h3>
        <p>
          서비스는 천재지변, 서버 장애, 해킹 등 불가항력적인 사유로 인해 발생한 문제에 대해서는
          책임을 지지 않습니다.
        </p>

        <h3>제9조 (이용 계약 해지 및 탈퇴)</h3>
        <p>
          이용자는 언제든지 서비스에서 탈퇴할 수 있으며, 탈퇴 시 계정과 관련된 모든 데이터가
          삭제됩니다.
        </p>

        <h3>제10조 (분쟁 해결 및 준거법)</h3>
        <p>본 약관과 관련하여 발생하는 분쟁은 서비스의 소재지를 관할하는 법원에서 해결합니다.</p>
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
