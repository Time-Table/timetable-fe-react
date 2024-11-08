import axios from "axios";
import { useEffect } from "react";

export default function LandingPage() {
  const fetchData = async () => {
    try {
      const a = await axios.post("http://localhost:3001/api/create", {
        title: "공학 설계 입문 12차 회의", // 수정된 부분
        meetingUrl: "https://www.naver.com", // 수정된 부분
        dates: ["2024-11-04", "2024-11-06", "2024-11-07", "2024-11-08", "2024-11-09", "2024-11-10"],
        timeRange: {
          // 수정된 부분
          startHour: "11:00",
          endHour: "17:00",
        },
        banedCells: [
          "2024-11-06-00:00",
          "2024-11-06-00:30",
          "2024-11-06-01:00",
          "2024-11-04-00:00",
          "2024-11-04-00:30",
          "2024-11-04-01:00",
          "2024-11-08-01:00",
        ],
      });

      console.log(a.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      style={{
        background: "aqua",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "100px",
      }}
    >
      <button
        onClick={() => {
          window.location.href = "/CreatePage";
        }}
      >
        createPage 이동
      </button>
      <button
        onClick={() => {
          window.location.href = "/use";
        }}
      >
        usePage 이동
      </button>

      <button
        onClick={() => {
          fetchData();
        }}
      >
        데이터 전송{" "}
      </button>
    </div>
  );
}
