import theme from "../theme";

export default function Button({
  title = "다음",
  onClick = () => {},
  width = "100%",
  fontSize,
  background = theme.color.button.primary,
  color = "white",
  height = "100%",
  fontFamily = "Pretendard-Bold",
  StyleDiv = {},
  StyleButton = {},
  disabled,
}) {
  return (
    <div style={{ display: "flex", width: width, ...StyleDiv }} onClick={onClick}>
      <button
        disabled={disabled}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: disabled ? theme.color.button.neutral[300] : color,
          width: "100%",
          height: height,
          background: disabled ? theme.color.button.neutral[100] : background,
          fontSize: fontSize,
          fontFamily: fontFamily,
          border: 0,
          borderRadius: 10,
          cursor: disabled ? "not-allowed" : "pointer",
          pointerEvents: disabled ? "none" : "auto",
          ...StyleButton,
        }}
      >
        {title}
      </button>
    </div>
  );
}
