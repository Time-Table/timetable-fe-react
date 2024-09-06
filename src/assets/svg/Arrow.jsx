import theme from "../../theme";

export default function ({ width = 10, height = 10, color = "black", isLeft = false }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 12 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: isLeft ? "rotate(180deg)" : "none" }}
    >
      <path
        d="M1.27177 21.3679L10.5437 11.184L1.27177 1.00003"
        stroke={color}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
