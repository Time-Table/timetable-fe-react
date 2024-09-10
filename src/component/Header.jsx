import styled from "@emotion/styled/macro";
import theme from "../theme";
import Button from "./Button";

export default function Header() {
  return (
    <HeaderLayout>
      <TitleLayout
        onClick={() => {
          console.log("TimeTable");
        }}
      >
        <span style={{ color: theme.color.timeGrid.selected }}>Time</span>
        <span style={{ color: theme.color.timeGrid.select }}>Table</span>
      </TitleLayout>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "end" }}>
        <ButtonDiv
          onClick={() => {
            console.log("FAQ");
          }}
        >
          <Button title="FAQ" background="white" color="black" onClick={() => {}} />
        </ButtonDiv>

        <ButtonDiv
          onClick={() => {
            window.location.href = "/CreatePage";
          }}
        >
          <Button title="일정 생성" />
        </ButtonDiv>
      </div>
    </HeaderLayout>
  );
}
const HeaderLayout = styled.div`
  ${theme.styles.flexCenterRow}
  justify-content: space-between;
  font-family: Pretendard-ExtraLight;
  padding: 11px 60px;
  height: 70px;

  @media (max-width: 480px) {
    align-items: end;
    padding: 11px 20px;
  }
`;

const TitleLayout = styled.div`
  ${theme.styles.flexCenterRow}
  font-size: 28px;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const ButtonDiv = styled.div`
  display: flex;
  justify-content: end;
  width: 106px;
  height: 52px;
  button {
    font-size: 20px;
  }
  @media (max-width: 480px) {
    width: 70px;
    height: 30px;

    button {
      font-size: 12px;
    }
  }
`;
