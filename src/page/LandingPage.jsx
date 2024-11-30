import axios from "axios";

export default function LandingPage() {
  const fetchData = async () => {
    try {
      const test = await axios.get("http://localhost:3001/hi");

      console.log(test.data);
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
          window.location.href = `/table/${"999906cc-815f-47d3-bc66-7806445b7ad4"}`;
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
