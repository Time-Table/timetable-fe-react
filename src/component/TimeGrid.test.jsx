/* 붙이는 스타일은 날짜 글자가 아니라 그 부모 칸에 걸린다. 칸에는 역할·이름이 없어 부모로 올라가 확인한다. */
/* eslint-disable testing-library/no-node-access */
import { render, screen } from "@testing-library/react";
import TimeGrid from "./TimeGrid";

jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"), act: require("react").act,
}));
jest.mock("framer-motion", () => {
  const React = require("react");
  const components = {};
  return {
    AnimatePresence: ({ children }) => children,
    motion: new Proxy({}, { get: (_, tag) => {
      if (!components[tag]) components[tag] = React.forwardRef(({
        initial, animate, exit, transition, ...props
      }, ref) => React.createElement(tag, { ...props, ref }));
      return components[tag];
    } }),
  };
});

// 2026-09-28(월)이 있는 한 주. 날짜 줄에는 28 ~ 4가 한 번씩 나온다.
const renderGrid = (props) => render(
  <TimeGrid
    dates={["2026-09-28", "2026-09-29"]}
    startHour="09:00"
    endHour="12:00"
    selectedCells={[]}
    setSelectedCells={() => {}}
    {...props}
  />,
);

const headerCellOf = (day) => screen.getByText(day).parentElement;

test("stickyHeaderTop을 주면 요일·날짜 칸과 왼쪽 빈 칸이 그 위치에 붙는다", () => {
  renderGrid({ stickyHeaderTop: "72px" });
  const dayCell = headerCellOf("28");
  const corner = dayCell.parentElement.firstElementChild;

  expect(dayCell).toHaveStyle({ position: "sticky", top: "72px" });
  expect(corner).toHaveStyle({ position: "sticky", top: "72px" });
  // 후보가 아닌 날(10월 1일)도 같은 줄이라 함께 붙는다.
  expect(headerCellOf("1")).toHaveStyle({ position: "sticky", top: "72px" });
});

test("stickyHeaderTop이 없으면 붙이지 않는다(랜딩·빠른 생성 화면은 그대로)", () => {
  renderGrid();
  const dayCell = headerCellOf("28");

  expect(dayCell).not.toHaveStyle({ position: "sticky" });
  expect(dayCell.parentElement.firstElementChild).not.toHaveStyle({ position: "sticky" });
});
