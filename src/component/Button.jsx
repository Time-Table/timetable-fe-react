import theme from "../theme";

export default function Button({
  title = "다음",
  onClick,
  width,
  height,
  fontSize,
  background = theme.color.button.primary,
  color = "white",
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: color,
        width: `${width}px`,
        background: background,
        height: `${height}px`,
        fontSize: `${fontSize}px`,
        fontFamily: "Pretendard-Bold",
        border: 0,
        borderRadius: 10,
        cursor: "pointer",
        padding: "16px",
      }}
    >
      {title}
    </button>
  );
}
