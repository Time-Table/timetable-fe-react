import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import image from "../assets/ogImage.png";
import { getTrackVisit } from "../api/visit";

export default function ManagerPage() {
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const trackVisitData = await getTrackVisit();
      
      if (trackVisitData?.data && Array.isArray(trackVisitData.data)) {
        const cleanedData = trackVisitData.data.map(({ _id, __v, ...rest }) => rest);
        setData(cleanedData);

        if (cleanedData.length > 0) {
          const today = new Date().toISOString().split("T")[0];
          const todayData = cleanedData.find((entry) => entry.date === today);
          setSelectedDate(todayData ? today : cleanedData[0].date);
        }
      } else {
        setData([]);
      }
    };
    fetchData();
  }, []);

  const filteredData = selectedDate ? data.find((entry) => entry.date === selectedDate) || {} : {};

  const keyMap = {
    date: "📅 날짜",
    todayVisitCreatePage: "🟢 오늘 생성 페이지 방문자 수",
    todayVisitAboutPage: "🔵 오늘 어바웃 페이지 방문자 수",
    todayVisitUsePage: "🟠 오늘 테이블 페이지 방문자 수",
    totalVisitCreatePage: "🟢 누적 생성 페이지 방문자 수",
    totalVisitAboutPage: "🔵 누적 어바웃 페이지 방문자 수",
    totalVisitUsePage: "🟠 누적 테이블 페이지 방문자 수",
    todaySignUp: "🟣 오늘 가입자 수",
    todayLogin: "🟡 오늘 접속 유저 수",
    totalSignUp: "🟣 누적 가입자 수",
    totalLogin: "🟡 누적 접속 유저 수",
    todayTableCreateCount: "🔴 오늘 생성된 테이블 수",
    totalTableCreateCount: "🔴 누적 생성된 테이블 수",
  };

  return (
    <Container>
      <Title>📊 방문자 통계</Title>

      <Select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
        {data.map((entry) => (
          <option key={entry.date} value={entry.date}>
            {entry.date}
          </option>
        ))}
      </Select>

      <DataCard>
        {selectedDate ? (
          Object.entries(filteredData).length > 0 ? (
            Object.entries(filteredData).map(([key, value], index) =>
              key !== "_id" && key !== "__v" ? (
                <DataRow key={key} index={index}>
                  <DataKey>{keyMap[key] || key}</DataKey>
                  <DataValue>{value}</DataValue>
                </DataRow>
              ) : null
            )
          ) : (
            <NoData>선택한 날짜의 데이터가 없습니다.</NoData>
          )
        ) : (
          <NoData>날짜를 선택해주세요.</NoData>
        )}
      </DataCard>

      <ButtonContainer>
        <Button onClick={() => (window.location.href = "/create")}>create 이동</Button>
        <Button
          onClick={() => (window.location.href = "/table/ad2edc6d-64ca-4027-af0a-acf975ea52eb")}
        >
          긴 use 이동
        </Button>
        <Button
          onClick={() => (window.location.href = "/table/463f18b5-fe5b-4b15-9fde-28f9261e27aa")}
        >
          짧은 use 이동
        </Button>
        <Button onClick={() => (window.location.href = "/about")}>About 이동</Button>
      </ButtonContainer>
      <br />
      <br />
      <img src={image} alt="OG Preview" />
    </Container>
  );
}

const Container = styled.div`
  background: #f4f4f9;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 20px;
  font-family: "Noto Sans KR", sans-serif;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
  font-size: 22px;
  text-align: center;
`;

const Select = styled.select`
  padding: 10px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
`;

const DataCard = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-top: 20px;
  width: 90%;
  max-width: 400px;
  text-align: left;
  transition: all 0.3s ease-in-out;
`;

const DataRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
  background: ${({ index }) => (index % 2 === 0 ? "#f8f9fa" : "#e9ecef")};
`;

const DataKey = styled.span`
  font-weight: bold;
  flex: 5;
`;

const DataValue = styled.span`
  flex: 1;
  text-align: right;
`;

const NoData = styled.span`
  font-size: 16px;
  color: #777;
  text-align: center;
`;

const ButtonContainer = styled.div`
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`;

const Button = styled.button`
  padding: 12px 15px;
  font-size: 14px;
  border-radius: 8px;
  border: none;
  background: #007bff;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
  width: 45%;
  min-width: 140px;
  text-align: center;

  &:hover {
    background: #0056b3;
  }
`;
