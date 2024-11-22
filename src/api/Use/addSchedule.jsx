import axios from "axios";

export const addSchedule = async (tableId, name, availableTimes) => {
  try {
    const res = await axios.post("http://localhost:3001/api/addSchedule", {
      tableId,
      name,
      availableTimes,
    });
    if (res.data.success) {
      alert("스케줄이 성공적으로 추가되었습니다!");
      return res.data.data;
    }
  } catch (error) {
    console.error("Error adding schedule:", error.response || error);
    alert("스케줄 추가 중 오류가 발생했습니다.");
  }
};
