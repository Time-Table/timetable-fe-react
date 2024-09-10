export default function LandingPage() {
  return (
    <div style={{ background: "aqua" }}>
      hi
      <button
        onClick={() => {
          window.location.href = "/CreatePage";
        }}
      >
        createPage 이동
      </button>
    </div>
  );
}
