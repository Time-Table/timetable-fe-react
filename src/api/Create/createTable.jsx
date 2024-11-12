import axios from "axios";

export const createTable = async ({ title, dates, startHour, endHour, banedCells }) => {
  try {
    const res = await axios.post("http://localhost:3001/api/create", {
      title: title,
      // meetingUrl: "https://www.naver.com", // 수정된 부분
      dates: dates,
      timeRange: {
        startHour: startHour,
        endHour: endHour,
      },
      banedCells: banedCells,
    });

    console.log("createTable: ", res.data);
  } catch (error) {
    console.error("createTable: ", error);
  }
};
