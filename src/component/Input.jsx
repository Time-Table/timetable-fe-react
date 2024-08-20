export default function Input({ width = 423, height = 39, placeholder, fontSize = 22 }) {
  return (
    <div style={{ borderBottom: "1px solid black" }}>
      <input
        placeholder={placeholder}
        style={{
          width: width,
          height: height,
          border: "none",
          outline: "none",
          fontFamily: "pretendard-light",
          fontSize: fontSize,
        }}
      ></input>
    </div>
  );
}
