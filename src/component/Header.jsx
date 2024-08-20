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
        <Button
          title="FAQ"
          background="white"
          color="black"
          onClick={() => {
            console.log("FAQ");
          }}
        />
        <Button
          title="약속 잡기"
          onClick={() => {
            console.log("약속 잡기");
          }}
        />
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

  button {
    height: 28px;
  }

  @media (max-width: 480px) {
    align-items: end;
    font-size: 20px;
    padding: 11px 20px;

    button {
      font-size: 12px;
    }
  }
`;

const TitleLayout = styled.div`
  ${theme.styles.flexCenterRow}
  font-size: 28px;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;
