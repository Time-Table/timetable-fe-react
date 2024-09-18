import theme from "../theme";

export default function Input({
  height = 39,
  placeholder,
  fontSize = 22,
  onChange = () => {},
  value,
  maxLength,
}) {
  return (
    <div style={{ width: "100%", borderBottom: `1px solid ${theme.text.gamma[500]}` }}>
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
