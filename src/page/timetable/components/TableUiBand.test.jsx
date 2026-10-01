import { act, fireEvent, render, screen } from "@testing-library/react";
import TableUiBand from "./TableUiBand";

jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"), act: require("react").act,
}));

afterEach(() => {
  jest.useRealTimers();
});

test("기존 화면(A)에서는 새 화면 써 보기를 권하고, 누르면 B로 바꾸라고 알린다", () => {
  jest.useFakeTimers();
  const onSwitch = jest.fn();
  render(<TableUiBand version="A" onSwitch={onSwitch} />);

  expect(screen.getByRole("region", { name: "화면 바꾸기" })).toHaveTextContent("새 화면을 먼저 써 볼 수 있어요");
  fireEvent.click(screen.getByRole("button", { name: "새 화면 써 보기" }));

  expect(onSwitch).toHaveBeenCalledWith("B");
  const notice = screen.getByRole("status");
  expect(notice).toHaveTextContent("새 화면으로 바꿨어요. 언제든 기존 화면으로 돌아갈 수 있어요.");
  expect(notice).toHaveStyle({ opacity: "1" });

  // 2.5초 뒤 흐려진다. 글은 남아 흐려지는 동안 상자가 줄지 않는다.
  act(() => jest.advanceTimersByTime(2500));
  expect(notice).toHaveStyle({ opacity: "0" });
  expect(notice).toHaveTextContent("새 화면으로 바꿨어요.");
});

test("새 화면(B)에서는 기존 화면으로 돌아가는 버튼을 준다", () => {
  const onSwitch = jest.fn();
  render(<TableUiBand version="B" onSwitch={onSwitch} />);

  expect(screen.getByRole("region", { name: "화면 바꾸기" })).toHaveTextContent("새 화면을 쓰는 중이에요");
  fireEvent.click(screen.getByRole("button", { name: "기존 화면으로" }));
  expect(onSwitch).toHaveBeenCalledWith("A");
  expect(screen.getByRole("status")).toHaveTextContent("기존 화면으로 바꿨어요.");
});

test("알림 영역은 처음부터 있어 화면 낭독기가 바뀐 글을 읽는다", () => {
  render(<TableUiBand version="A" onSwitch={jest.fn()} />);
  const notice = screen.getByRole("status", { hidden: true });
  expect(notice).toHaveAttribute("aria-live", "polite");
  expect(notice).toBeEmptyDOMElement();
});
