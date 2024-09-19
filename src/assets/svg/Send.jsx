export default function ({ width = 30, height = 30, color = "black" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 30 31"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="30" height="30" transform="translate(0 0.5)" fill="white" fill-opacity="0.01" />
      <path
        d="M25.75 3.625L2 12.4614L14.5 14.8802L17.6282 27.375L25.75 3.625Z"
        stroke="black"
        stroke-linejoin="round"
      />
      <path
        d="M14.5052 14.8802L18.0407 11.3447"
        stroke="black"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
