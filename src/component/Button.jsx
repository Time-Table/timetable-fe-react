import theme from "../theme";

export default function Button({ title, onClick, width = "160", height = "56", fontSize = "1em" }) {
  return (
    <button
      onClick={onClick}
      style={{
        color: "white",
        width: `${width}px`,
        background: theme.color.button.primary,
        height: `${height}px`,
        fontSize: `${fontSize}px`,
        fontFamily: "Pretendard-Bold",
        border: 0,
        borderRadius: 10,
      }}
    >
      {title}
    </button>
  );
}
