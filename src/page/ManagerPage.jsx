import image from "../assets/ogImage.png";
export default function ManagerPage() {
  return (
    <div
      style={{
        background: "aqua",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "100px",
        flexDirection: "column",
      }}
    >
      <button
        onClick={() => {
          window.location.href = "/create";
        }}
      >
        create 이동
      </button>
      <button
        onClick={() => {
          window.location.href = "/table/7c2d11f8-d0e2-4f6a-b54d-7499276c6aa8";
        }}
      >
        긴 use 이동
      </button>
      <button
        onClick={() => {
          window.location.href = "/table/753991b4-369d-4a3d-a744-56430c2c1235";
        }}
      >
        짧은 use 이동
      </button>
      <button
        onClick={() => {
          window.location.href = `/about`;
        }}
      >
        About 이동
      </button>
      <img src={image} />
    </div>
  );
}
