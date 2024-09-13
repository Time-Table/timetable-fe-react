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

export default function UsePage() {
  const dates = MOCKDATA.dates;
  const startHour = MOCKDATA.startHour;
  const endHour = MOCKDATA.endHour;
  // console.log(dates, startHour, endHour);
  const a = Invite();
  // const a = AllTimeGrid(dates, startHour, endHour);
  const b = Rank();

  const leftArea = () => {
    return <>{a}</>;
  };

  const rightArea = () => {
    return <>{b}</>;
  };
  return (
    <UsePageLayout>
      <ContentDiv>{leftArea()}</ContentDiv>
      <ContentDiv>{rightArea()}</ContentDiv>
    </UsePageLayout>
  );
}
const UsePageLayout = styled.div`
  ${theme.styles.flexCenterRow}
  width: 100%;
  gap: 100px;
`;

const ContentDiv = styled.div`
  ${theme.styles.flexCenterColumn}
  gap: 40px;
  margin: 50px 0;
  width: 510px;
  height: 500px;
  padding: 200px 0;
  /* opacity: 0;
  transform: translateY(-30px);
  animation: fadeIn 1.2s ease-in-out forwards; */
  /* background-color: aqua; */
  @media (max-width: 480px) {
    width: 380px;
  }

  /* @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  } */
`;
