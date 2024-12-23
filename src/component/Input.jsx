import theme from "../theme";

export default function Input({
  height = 39,
  placeholder,
  fontSize = 21,
  onChange = () => {},
  onKeyDown = () => {},
  value,
  maxLength,
  type,
}) {
  return (
    <div style={{ width: "100%", borderBottom: `1px solid ${theme.text.gamma[500]}` }}>
      <input
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        style={{
          width: "100%",
          height: height,
          border: "none",
          outline: "none",
          fontFamily: "pretendard-light",
          fontSize: fontSize,
        }}
        type={type}
      ></input>
    </div>
  );
}
