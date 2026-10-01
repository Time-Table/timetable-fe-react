import { act, fireEvent, render, screen } from "@testing-library/react";
import TableUiBand from "./TableUiBand";

// 표 화면 A/B 2회차(2026-10-01, 하네스 specs/table-ab-2.md): 두 화면 같은 글·같은 모양. "새"·"기존"이라는 말은 쓰지 않는다.
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

test("띠는 어느 화면에서나 같은 글과 단추를 보이고, 누르면 바꾸라고 알린 뒤 2.5초 알림을 띄운다", () => {
  const onSwitch = jest.fn();
  render(<TableUiBand onSwitch={onSwitch} />);
  const band = screen.getByRole("region", { name: "화면 바꾸기" });
  expect(band).toHaveTextContent("다른 화면으로 볼 수 있어요");
  expect(band).not.toHaveTextContent(/새 화면|기존 화면/);
  fireEvent.click(screen.getByRole("button", { name: "다른 화면 보기" }));
  expect(onSwitch).toHaveBeenCalledTimes(1);
  const notice = screen.getByRole("status");
  expect(notice).toHaveTextContent("화면을 바꿨어요. 언제든 다시 바꿀 수 있어요.");
  act(() => {
    jest.advanceTimersByTime(2500);
  });
  // 글은 남겨 두고 흐리게만 한다(상자가 줄지 않게).
  expect(notice).toHaveTextContent("화면을 바꿨어요.");
});
