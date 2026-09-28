import { fireEvent, render, screen } from "@testing-library/react";
import Explain from "./Explain";

// 설치된 testing-library와 React 18.3의 act API를 맞춘다.
jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"),
  act: require("react").act,
}));

const originalMatchMedia = window.matchMedia;
const setMobile = (matches) => {
  window.matchMedia = (query) => ({ matches, media: query, addEventListener() {}, removeEventListener() {} });
};
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

test("모바일에서는 접힌 채로 시작하지만 문구는 지우지 않고 펼칠 수 있다", () => {
  setMobile(true);
  render(<Explain label="지표 설명"><p>참여 등록은 사람 수가 아닙니다.</p></Explain>);

  const toggle = screen.getByRole("button", { name: "지표 설명" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  const text = screen.getByText("참여 등록은 사람 수가 아닙니다.");
  expect(text).not.toBeVisible();

  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(text).toBeVisible();
});

test("PC에서는 펼친 채로 시작한다", () => {
  setMobile(false);
  render(<Explain label="지표 설명"><p>참여 등록은 사람 수가 아닙니다.</p></Explain>);
  expect(screen.getByRole("button", { name: "지표 설명" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("참여 등록은 사람 수가 아닙니다.")).toBeVisible();
});
