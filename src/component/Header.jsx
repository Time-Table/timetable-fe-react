import styled from "@emotion/styled/macro";
import theme from "../theme";
import Button from "./Button";
import Swal from "sweetalert2";
import Help from "../assets/svg/Help";

export default function Header() {
  return (
    <HeaderLayout>
      <TitleLayout
        onClick={() => {
          window.location.href = "/";
        }}
      >
        <span style={{ color: theme.color.timeGrid.selected }}>Time</span>
        <span style={{ color: theme.color.timeGrid.select }}>Table</span>
      </TitleLayout>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "end" }}>
        <ButtonDiv>
          <HelpDiv
            onClick={() => {
              Swal.fire({
                icon: "question",
                iconColor: `${theme.text.gamma[800]}`,
                title: "사이트 정보",
                text: "우리 사이트는 단체나 모임(스터디, 팀플, 회식 등) 행사의 수요 인원과 최적의 시간을 파악할 수 있도록 도와줍니다.",
                confirmButtonText: "자세히 보기",
                confirmButtonColor: `${theme.color.primary}`,
                showCancelButton: true,
                cancelButtonText: "취소",
                cancelButtonColor: `${theme.text.gamma[800]}`,
                preConfirm: () => (window.location.href = "/about"),
              });
            }}
          >
            <Help />
          </HelpDiv>
        </ButtonDiv>
        <ButtonDiv
          onClick={() => {
            Swal.fire({
              icon: "success",
              iconColor: `${theme.color.primary}`,
              title: "문의하기",
              html: "사용 중 불편을 드렸다면 죄송합니다.<br>메일 보내주시면 확인 후 답변드리겠습니다.<br>감사합니다.<br><br><strong>jjjangtoy7@gmail.com</strong>",
              confirmButtonText: "메일 복사",
              confirmButtonColor: `${theme.color.button.blue}`,
              showCancelButton: true,
              cancelButtonText: "취소",
              cancelButtonColor: `${theme.text.gamma[800]}`,
              preConfirm: () => {
                const email = "jjjangtoy7@gmail.com";
                return navigator.clipboard
                  .writeText(email)
                  .then(() => {
                    Swal.fire({
                      icon: "success",
                      iconColor: `${theme.color.button.blue}`,
                      title: "메일 주소 복사됨",
                      text: "메일 주소가 클립보드에 복사되었습니다.",
                      showConfirmButton: false,
                      timer: 1700,
                    });
                  })
                  .catch(() => {
                    Swal.fire({
                      icon: "error",
                      iconColor: `${theme.color.primary}`,
                      title: "복사 실패",
                      text: "메일 주소를 복사하는 중 문제가 발생했습니다. 직접 복사해주세요.",
                      showConfirmButton: false,
                      timer: 2000,
                    });
                  });
              },
            });
          }}
        >
          <Button title="FAQ" background="white" color="black" onClick={() => {}} />
        </ButtonDiv>

        <ButtonDiv
          onClick={() => {
            window.location.href = "/CreatePage";
          }}
        >
          <Button title="새 테이블" />
        </ButtonDiv>
      </div>
    </HeaderLayout>
  );
}
const HeaderLayout = styled.div`
  ${theme.styles.flexCenterRow}
  justify-content: space-between;
  font-family: Pretendard-ExtraLight;
  padding: 0px 60px;
  height: 70px;
  border-bottom: 1px ${theme.text.gamma[900]} solid;

  @media (max-width: 480px) {
    align-items: end;
    height: auto;

    padding: 11px 20px;
  }
`;

const TitleLayout = styled.button`
  ${theme.styles.flexCenterRow}
  font-size: 25px;
  background: none;
  border: none;
  padding: 0;
  letter-spacing: -0.05em;
  font-family: Pretendard-ExtraLight;
  cursor: pointer;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const ButtonDiv = styled.div`
  display: flex;
  justify-content: end;
  width: 106px;
  height: 46px;
  button {
    font-size: 18px;
  }
  @media (max-width: 480px) {
    width: 70px;
    height: 30px;

    button {
      font-size: 12px;
    }
  }
`;

const HelpDiv = styled.div`
  background: none;
  border: none;
  ${theme.styles.flexCenterColumn}

  svg {
    width: 30px;
    height: 30px;

    @media (max-width: 480px) {
      width: 20px;
      height: 20px;
    }
  }
`;
