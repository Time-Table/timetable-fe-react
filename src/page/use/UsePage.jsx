import styled from "@emotion/styled/macro";
import theme from "../../theme";
import Button from "../../component/Button";
import Share from "../../assets/svg/Share";
import Invite from "./component/left/Invite";
import AllSchedule from "./component/right/AllSchedule";
import MySchedule from "./component/right/MySchedule";
import AddUser from "./component/left/AddUser";
import AllTimeGrid from "./component/left/AllTimeGird";
import Rank from "./component/right/Rank";
import { MOCKDATA } from "./MOCKDATA";
import { useState } from "react";

export default function UsePage() {
  const dates = MOCKDATA.dates;
  const startHour = MOCKDATA.startHour;
  const endHour = MOCKDATA.endHour;
  // console.log(dates, startHour, endHour);
  const [leftScreen, setLeftScreen] = useState(Invite());
  const [rightScreen, setRightScreen] = useState(AllSchedule());

  return (
    <UsePageLayout>
      <LeftArea>{leftScreen}</LeftArea>
      <RightArea>
        <ButtonLayout>
          <ButtonDiv>
            <Button
              background={theme.color.button.blue}
              title="초대하기"
              onClick={() => setLeftScreen(Invite())}
            />
          </ButtonDiv>
          <ButtonDiv>
            <Button
              background={theme.color.primary}
              title="일정 추가"
              onClick={() => setLeftScreen(AddUser())}
            />
          </ButtonDiv>
        </ButtonLayout>

        <ToggleLayout>
          <Button
            width="70px"
            fontFamily="Pretendard-Regular"
            title="전체 일정"
            background="none"
            color="black"
            onClick={() => setRightScreen(AllSchedule())}
          />
          <Button
            width="70px"
            fontFamily="Pretendard-Regular"
            title="내 일정"
            background="none"
            color="black"
            onClick={() => setRightScreen(MySchedule())}
          ></Button>
          <Button
            width="70px"
            fontFamily="Pretendard-Regular"
            title="순위"
            background="none"
            color="black"
            onClick={() => setRightScreen(Rank())}
          ></Button>
        </ToggleLayout>
        {rightScreen}
      </RightArea>
    </UsePageLayout>
  );
}
const UsePageLayout = styled.div`
  ${theme.styles.flexCenterRow}
  width: 100%;
  gap: 100px;
`;

const LeftArea = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 30px;
  margin: 50px 0;
  width: 583px;
  height: 500px;
  padding: 200px 0;

  @media (max-width: 480px) {
    width: 380px;
  }
`;
const RightArea = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 30px;
  margin-top: 60px;
  width: 583px;
  height: 900px;

  @media (max-width: 480px) {
    width: 380px;
  }
`;

const ButtonLayout = styled.div`
  ${theme.styles.flexCenterRow}
  justify-content: end;
  width: 100%;
  gap: 12px;
  @media (max-width: 480px) {
    width: 320px;
  }
`;

const ButtonDiv = styled.div`
  display: flex;
  width: 160px;
  height: 56px;
  button {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    width: 100%;
    height: 50px;
    button {
      font-size: 16px;
    }
  }
`;

const ToggleLayout = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  gap: 20px;

  button {
    font-size: 25px;
    letter-spacing: -0.05em;
  }
`;
