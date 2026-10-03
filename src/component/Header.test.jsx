import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";
import { setShellWidth } from "../utils/siteShell";

jest.mock("../api/event", () => ({ sendEvent: jest.fn() }));
jest.mock("./InquiryModal", () => () => null);
jest.mock("../page/contact/inquiry", () => ({ readFromPath: () => null }));
jest.mock("sweetalert2", () => ({ fire: jest.fn(), mixin: () => ({ fire: jest.fn() }) }));
jest.mock("../api/blogView", () => ({ sendBlogView: jest.fn() }));
jest.mock("react-dom/test-utils", () => ({ ...jest.requireActual("react-dom/test-utils"), act: require("react").act }));

// 새 표 화면(B)이 폭을 걸면 머리말이 좁힌 모양 표시(data-narrow)를 단다(2026-10-02 사람 지시). 바닥글과 다른 화면은 그대로.
test("새 화면이 폭을 걸면 좁힌 머리말, 해제하면 원래 머리말", () => {
  render(<MemoryRouter><Header /></MemoryRouter>);
  const header = screen.getByRole("banner");
  expect(header).not.toHaveAttribute("data-narrow");
  let off;
  act(() => {
    off = setShellWidth(480);
  });
  expect(header).toHaveAttribute("data-narrow", "true");
  expect(screen.getByRole("button", { name: "새 테이블" })).toBeInTheDocument();
  act(() => off());
  expect(header).not.toHaveAttribute("data-narrow");
});
