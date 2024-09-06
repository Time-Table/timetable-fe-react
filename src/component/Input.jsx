export default function Input({
  height = 39,
  placeholder,
  fontSize = 22,
  onChange = () => {},
  value,
  maxLength,
}) {
  return (
    <div style={{ borderBottom: "1px solid black" }}>
      <input
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
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
