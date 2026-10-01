/* 붙이는 스타일은 날짜 글자가 아니라 그 부모 칸에 걸린다. 칸에는 역할·이름이 없어 부모로 올라가 확인한다. */
/* eslint-disable testing-library/no-node-access */
import { fireEvent, render, screen } from "@testing-library/react";
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

// 표 화면 A/B 공유 상태(2026-09-30): 보고 있는 주를 밖에서 정한다.
const threeWeeks = ["2026-09-28", "2026-10-05", "2026-10-12"];

test("weekKey를 주면 그 주를 보이고, 넘기면 onWeekChange로 알린다", () => {
  const onWeekChange = jest.fn();
  renderGrid({ dates: threeWeeks, weekKey: "2026-10-05", onWeekChange });
  expect(screen.getByText("2 / 3주")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "다음 주" }));
  expect(onWeekChange).toHaveBeenLastCalledWith("2026-10-12");
  fireEvent.click(screen.getByRole("button", { name: "이전 주" }));
  expect(onWeekChange).toHaveBeenLastCalledWith("2026-09-28");
});

test("weekKey가 없거나 이 표에 없는 주면 첫 주로 맞추고 알린다", () => {
  const onWeekChange = jest.fn();
  renderGrid({ dates: threeWeeks, weekKey: "2025-01-06", onWeekChange });
  expect(screen.getByText("1 / 3주")).toBeInTheDocument();
  expect(onWeekChange).toHaveBeenCalledWith("2026-09-28");
});

test("onWeekChange가 없으면 예전처럼 안에서 넘긴다", () => {
  renderGrid({ dates: threeWeeks });
  fireEvent.click(screen.getByRole("button", { name: "다음 주" }));
  expect(screen.getByText("2 / 3주")).toBeInTheDocument();
});

test("줄·열을 한꺼번에 골라도 막은 칸은 넣지 않는다", () => {
  // Codex 최종 검증(2026-09-30): 끌어 칠하기는 막은 칸을 못 누르지만 줄·열 고르기는 막은 칸까지 넣었다.
  const setSelectedCells = jest.fn();
  renderGrid({ banedCells: ["2026-09-29-09:00"], setSelectedCells });
  fireEvent.click(screen.getByText("09:00"));
  expect(setSelectedCells.mock.calls[0][0]([])).toEqual(["2026-09-28-09:00"]);
  fireEvent.click(headerCellOf("29"));
  expect(setSelectedCells.mock.calls[1][0]([])).toEqual([
    "2026-09-29-09:30", "2026-09-29-10:00", "2026-09-29-10:30", "2026-09-29-11:00", "2026-09-29-11:30",
  ]);
});

test("viewMaxCount를 주면 그 인원을 가장 진한 칸으로 본다(여러 명 골라 보기)", async () => {
  // 고른 두 명 중 한 명만 되는 칸이 가장 진한 칸(모두 되는 칸)처럼 보이지 않게 한다.
  render(
    <TimeGrid dates={["2026-09-28"]} startHour="09:00" endHour="10:00" readOnly
      timeInfo={[{ time: "2026-09-28-09:00", count: 1, members: ["서연"], _id: "a" }]} viewMaxCount={2} />,
  );
  await screen.findByText("09:00");
  // 칠한 층에는 역할·이름이 없어 style로 찾는다(파일 머리 eslint 예외와 같은 이유).
  const opacities = [...document.body.querySelectorAll("[style*='opacity']")].map((el) => Number(el.style.opacity));
  // 0.2 + (1 / 2) × 0.8. viewMaxCount가 없으면 이 칸이 가장 큰 값이라 1이 된다.
  expect(Math.max(...opacities)).toBeCloseTo(0.6);
});

test("showGolden이 거짓이면 가장 많은 인원 칸에도 반짝임을 그리지 않는다(사람을 골라 볼 때)", async () => {
  const info = [{ time: "2026-09-28-09:00", count: 1, members: ["서연"], _id: "a" }];
  // 반짝임 층은 이름·역할이 없어 칸 안의 층 수로 본다(보기 모드: 칠하기 층 + 반짝임 층).
  const layersOf = () => document.body.querySelector("[data-hoverdate='2026-09-28'][data-hovertime='09:00']").children.length;
  const { unmount } = render(<TimeGrid dates={["2026-09-28"]} startHour="09:00" endHour="10:00" readOnly timeInfo={info} />);
  await screen.findByText("09:00");
  expect(layersOf()).toBe(2);
  unmount();
  render(<TimeGrid dates={["2026-09-28"]} startHour="09:00" endHour="10:00" readOnly timeInfo={info} showGolden={false} />);
  await screen.findByText("09:00");
  expect(layersOf()).toBe(1);
});
