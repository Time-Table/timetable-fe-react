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
          window.location.href = "/table/ef2f2bb8-79a7-4c94-971e-3992c02ba55a";
        }}
      >
        긴 use 이동
      </button>
      <button
        onClick={() => {
          window.location.href = "/table/f919f443-5b24-4c4a-bd63-ced54c6edefe";
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
    </div>
  );
}
