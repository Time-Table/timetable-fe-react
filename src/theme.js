const color = {
  primary: "#FE6F6F",
  button: {
    blue: "#4E87E9",
    primary: "#FE6F6F",
    neutral: {
      100: "#EEF1F3",
      300: "#B6BDC6",
    },
  },
  timeGrid: {
    20: "#FAE7C4",
    40: "#FFDA95",
    60: "#FFB062",
    80: "#FF6F6F",
    100: "#FD2734",
    blur: "#D7D7D7",
    line: "#868686",
    selected: "#FE6F6F",
    select: "#FFA29D",
  },
};
const text = {
  primary: "#0D0D0D",
  gamma: {
    900: "#F2F2F2",
    800: "#D7D7D7",
    500: "#868686",
  },
};
const styles = {
  flexCenterRow: `
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    `,
  flexCenterColumn: `
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    `,
};

const theme = {
  color,
  styles,
  text,
};

export default theme;
