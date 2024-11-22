import styled from "@emotion/styled/macro";
import theme from "../../theme";
import Button from "../../component/Button";
import Share from "../../assets/svg/Share";
import Invite from "./component/right/Invite";
import AllSchedule from "./component/right/AllSchedule";
import MySchedule from "./component/right/MySchedule";
import AddUser from "./component/right/AddUser";
import AllTimeGrid from "./component/left/AllTimeGird";
import Rank from "./component/right/Rank";
import { MOCKDATA } from "./MOCKDATA";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTableInfo } from "../../api/Use/getTableInfo";

export default function UsePage() {
  const { tableId } = useParams();

  const [tableInfo, setTableInfo] = useState();
  const { startHour, endHour, dates } = tableInfo ? tableInfo : "";

  useEffect(() => {
    const fetchData = async () => {
      const tableInfo = await getTableInfo(tableId);
      setTableInfo(tableInfo);
    };
    if (tableId) {
      fetchData();
    }
    fetchData();
  }, []);

  const [leftScreen, setLeftScreen] = useState("Invite");
  const [rightScreen, setRightScreen] = useState("AllSchedule");
  const [selectedToggle, setSelectedToggle] = useState(false);
  const [selectedName, setSelectedName] = useState(false);
  const [name, setName] = useState("");
  const membersSchedule = MOCKDATA.membersSchedule;

  const datesInfo = () => {
    if (selectedName) {
      const scheduleOfSelectedName = membersSchedule.users.find(
        (user) => user.name === selectedName
      );
      return scheduleOfSelectedName.availableTimes;
    }
  };

  const handleToggle = (button) => {
    setSelectedToggle(button);
  };

  const showScreen = (Screen) => {
    switch (Screen) {
      case "AddUser":
        return (
          <AddUser
            setLeftScreen={setLeftScreen}
            setRightScreen={setRightScreen}
            setName={setName}
            name={name}
            tableId={tableId}
          />
        );
      case "Invite":
        return tableInfo ? (
          <Invite setLeftScreen={setLeftScreen} tableInfo={tableInfo} />
        ) : (
          <p>Loading...</p>
        );
      case "AllTimeGrid":
        return (
          <AllTimeGrid
            dates={dates}
            startHour={startHour}
            endHour={endHour}
            membersSchedule={selectedName ? datesInfo() : membersSchedule}
            selectedName={selectedName}
          />
        );
      case "AllSchedule":
        return (
          <AllSchedule
            setLeftScreen={setLeftScreen}
            setRightScreen={setRightScreen}
            setName={setName}
            selectedName={selectedName}
            setSelectedName={setSelectedName}
          />
        );
      case "MySchedule":
        return (
          <MySchedule
            dates={dates}
            startHour={startHour}
            endHour={endHour}
            setRightScreen={setRightScreen}
          />
        );
      case "Rank":
        return <Rank />;
      default:
        return "예상치 못한 에러입니다. 다시 시도해주세요.";
    }
  };

  return (
    <UsePageLayout>
      <LeftArea>{showScreen(leftScreen)}</LeftArea>
      <RightArea>
        <ButtonLayout>
          <ButtonDiv>
            <Button
              background={theme.color.button.blue}
              title="초대하기"
              onClick={() => setLeftScreen("Invite")}
            />
          </ButtonDiv>
          <ButtonDiv>
            <Button
              background={theme.color.primary}
              title="참여하기"
              onClick={() => {
                setLeftScreen("AllTimeGrid");
                setRightScreen("AddUser");
              }}
            />
          </ButtonDiv>
        </ButtonLayout>

        <ToggleLayout>
          <ToggleButtonDiv>
            <Button
              fontFamily={selectedToggle === "전체 일정" ? "Pretendard-Bold" : "Pretendard-Regular"}
              title={`전체 일정(${MOCKDATA.memberNames.length})`}
              background="none"
              color={selectedToggle === "전체 일정" ? theme.color.primary : "black"}
              onClick={() => {
                setRightScreen("AllSchedule");
                setLeftScreen("AllTimeGrid");
                handleToggle("전체 일정");
                setSelectedName(false);
              }}
            />
          </ToggleButtonDiv>
          <ToggleButtonDiv>
            <Button
              fontFamily={selectedToggle === "내 일정" ? "Pretendard-Bold" : "Pretendard-Regular"}
              title="내 일정"
              background="none"
              color={selectedToggle === "내 일정" ? theme.color.primary : "black"}
              onClick={() => {
                setRightScreen("MySchedule");
                setLeftScreen("AllTimeGrid");
                handleToggle("내 일정");
              }}
            />
          </ToggleButtonDiv>
          <ToggleButtonDiv>
            <Button
              fontFamily={selectedToggle === "순위" ? "Pretendard-Bold" : "Pretendard-Regular"}
              title="순위"
              background="none"
              color={selectedToggle === "순위" ? theme.color.primary : "black"}
              onClick={() => {
                setRightScreen("Rank");
                setLeftScreen("AllTimeGrid");
                handleToggle("순위");
                setSelectedName(false);
              }}
            />
          </ToggleButtonDiv>
        </ToggleLayout>
        {showScreen(rightScreen)}
      </RightArea>
    </UsePageLayout>
  );
}
const UsePageLayout = styled.div`
  ${theme.styles.flexCenterRow}
  width: 100%;
  gap: 100px;
  flex-wrap: wrap-reverse;
  @media (max-width: 480px) {
    ${theme.styles.flexCenterColumn}
  }
`;

const LeftArea = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 30px;
  width: 583px;
  height: 900px;
  padding-top: 60px;
  padding-bottom: 10px;
  @media (max-width: 480px) {
    width: 90%;
  }
`;
const RightArea = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 30px;
  padding-top: 60px;
  width: 583px;
  height: 900px;

  @media (max-width: 480px) {
    width: 90%;
  }
`;

const ButtonLayout = styled.div`
  ${theme.styles.flexCenterRow}
  justify-content: flex-end;
  width: 490px;
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
  height: 30px;
  gap: 20px;
`;

const ToggleButtonDiv = styled.div`
  display: flex;
  button {
    font-size: 25px;
  }

  @media (max-width: 480px) {
    height: 50px;
    button {
      font-size: 19px;
    }
  }
`;
