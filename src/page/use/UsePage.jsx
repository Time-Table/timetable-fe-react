import styled from "@emotion/styled/macro";
import theme from "../../theme";
import Button from "../../component/Button";
import Invite from "./component/right/Invite";
import AllSchedule from "./component/right/AllSchedule";
import MySchedule from "./component/right/MySchedule";
import AddUser from "./component/right/AddUser";
import AllTimeGrid from "./component/left/AllTimeGird";
import Rank from "./component/right/Rank";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTableInfo } from "../../api/Use/getTableInfo";
import { getAllSchedule } from "../../api/Use/getAllSchedule";
import { getSchedule } from "../../api/Use/getSchedule";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Loader from "./component/Loading";

export default function UsePage() {
  const { tableId } = useParams();
  const [tableInfo, setTableInfo] = useState();
  const [usersScheduleList, setUsersScheduleList] = useState([]);
  const { startHour, endHour, dates } = tableInfo ? tableInfo : "";
  const [saveButtonState, setSaveButtonState] = useState(true);
  const [timeInfo, setTimeInfo] = useState([]);
  const title = tableInfo ? tableInfo.title : "";
  const isFirstUser = usersScheduleList.length === 0;
  const [leftScreen, setLeftScreen] = useState(isFirstUser ? "Invite" : "AllTimeGrid");
  const [rightScreen, setRightScreen] = useState("MySchedule");
  const [selectedToggle, setSelectedToggle] = useState("내 일정");
  const [selectedName, setSelectedName] = useState(false);
  const [name, setName] = useState("");
  const banedCells = tableInfo ? tableInfo.banedCells : [];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    switch (rightScreen) {
      case "AddUser":
      case "AllSchedule":
      case "MySchedule":
      case "Rank":
        setCurrentSlide(1);
        break;
      default:
    }
    switch (leftScreen) {
      case "Invite":
        setCurrentSlide(0);
        break;
      default:
        break;
    }
  }, [leftScreen, rightScreen]);

  useEffect(() => {
    const fetchTableInfo = async () => {
      const tableInfo = await getTableInfo(tableId);
      setTableInfo(tableInfo);
    };
    fetchTableInfo();
  }, [tableId]);

  useEffect(() => {
    const name = localStorage.getItem("name");
    if (tableId !== localStorage.getItem("tableId")) {
      localStorage.clear();
      localStorage.setItem("tableId", tableId);
    }
    if (name) {
      setName(name);
    }
    const fetchData = async () => {
      const membersSchedule = await getAllSchedule(tableId);
      if (membersSchedule.code === 200) {
        setUsersScheduleList(membersSchedule.data);
      }
      const timeData = await getSchedule(tableId);
      setTimeInfo(timeData);
    };
    if (tableId) {
      fetchData();
    }
  }, [saveButtonState, tableId]);

  const datesInfo = async () => {
    if (selectedName) {
      const scheduleOfSelectedName = usersScheduleList.find((user) => user.name === selectedName);
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
            setSelectedToggle={setSelectedToggle}
          />
        );
      case "Invite":
        return tableInfo ? (
          <Invite
            setLeftScreen={setLeftScreen}
            tableId={tableId}
            title={title}
            setCurrentSlide={setCurrentSlide}
            currentSlide={currentSlide}
          />
        ) : (
          <div>
            <Loader />
          </div>
        );

      case "AllTimeGrid":
        return (
          <AllTimeGrid
            dates={dates}
            startHour={startHour}
            endHour={endHour}
            timeInfo={selectedName ? datesInfo() : timeInfo}
            selectedName={selectedName}
            title={title}
            banedCells={banedCells}
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
            usersSchedule={usersScheduleList}
            name={name}
            tableId={tableId}
            setSelectedToggle={setSelectedToggle}
            setCurrentSlide={setCurrentSlide}
          />
        );
      case "MySchedule":
        return (
          <MySchedule
            dates={dates}
            startHour={startHour}
            endHour={endHour}
            setRightScreen={setRightScreen}
            tableId={tableId}
            saveButtonState={saveButtonState}
            setSaveButtonState={setSaveButtonState}
            usersScheduleList={usersScheduleList}
            banedCells={banedCells}
            setSelectedToggle={setSelectedToggle}
            name={name}
            setCurrentSlide={setCurrentSlide}
          />
        );
      case "Rank":
        return (
          <Rank
            setRightScreen={setRightScreen}
            timeInfo={timeInfo}
            selectedName={selectedName}
            setSelectedName={setSelectedName}
            setSelectedToggle={setSelectedToggle}
            setCurrentSlide={setCurrentSlide}
          />
        );
      default:
        return "예상치 못한 에러입니다. 다시 시도해주세요.";
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    adaptiveHeight: true,
    dotsClass: "slick-dots custom-dots",
    initialSlide: currentSlide,
    beforeChange: (_, next) => setCurrentSlide(next),
  };

  const SliderWrapper = styled.div`
    position: relative;

    .custom-dots {
      position: fixed;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex !important;
      justify-content: center;
      align-items: center;

      li {
        width: 8.5px;
        height: 8.5px;
        margin: 0 5px;
        border-radius: 50%;
        background: ${theme.text.gamma[300]};
        transition: background 0.3s ease;

        &.slick-active {
          background: ${theme.color.primary}; /* 현재 슬라이드 닷 색상 */
        }

        &:not(.slick-active) {
          background: ${theme.color.timeGrid[40]}; /* 비활성 닷 색상 */
        }
      }
      button {
        display: none;
      }
    }
  `;

  return (
    <Frame>
      <DesktopView>
        <LeftArea>{showScreen(leftScreen)}</LeftArea>
        <RightArea>
          <ButtonLayout>
            <ButtonDiv>
              <Button
                background={theme.color.button.blue}
                title="초대하기"
                onClick={() => {
                  setLeftScreen("Invite");
                  setCurrentSlide(0);
                }}
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
                fontFamily={
                  selectedToggle === "전체 일정" ? "Pretendard-Bold" : "Pretendard-Regular"
                }
                title={`전체 일정(${usersScheduleList.length})`}
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
      </DesktopView>
      <MobileView>
        <SliderWrapper>
          <Slider {...sliderSettings}>
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
                    fontFamily={
                      selectedToggle === "전체 일정" ? "Pretendard-Bold" : "Pretendard-Regular"
                    }
                    title={`전체 일정(${usersScheduleList.length})`}
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
                    fontFamily={
                      selectedToggle === "내 일정" ? "Pretendard-Bold" : "Pretendard-Regular"
                    }
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
                    fontFamily={
                      selectedToggle === "순위" ? "Pretendard-Bold" : "Pretendard-Regular"
                    }
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
          </Slider>
        </SliderWrapper>
      </MobileView>
    </Frame>
  );
}

const Frame = styled.div`
  @media (max-width: 880px) {
    width: 100%;
  }
`;

const DesktopView = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  @media (max-width: 480px) {
    display: none;
  }
`;

const MobileView = styled.div`
  display: none;

  @media (max-width: 480px) {
    display: block;
    width: 100%;
    height: auto;
  }

  .slick-slider {
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .slick-slide {
    display: flex !important;
    justify-content: center;
    align-items: center;
    height: auto;
  }
`;

const LeftArea = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 30px;
  width: 50%;
  padding-top: 60px;
  margin-bottom: 3rem;
  @media (max-width: 480px) {
    width: 100%;
  }
`;

const RightArea = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 30px;
  padding-top: 60px;
  width: 50%;
  margin-bottom: 3rem;

  @media (max-width: 480px) {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: 90%;
  }

  .slick-slide & {
    display: flex !important;
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
