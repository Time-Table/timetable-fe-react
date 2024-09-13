export default function LandingPage() {
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
    </div>
  );
}
