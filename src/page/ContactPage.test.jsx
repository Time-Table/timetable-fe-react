import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContactPage from "./ContactPage";

jest.mock("../Seo", () => () => null);
jest.mock("../api/inquiry", () => ({ sendInquiry: jest.fn() }));
// 설치된 testing-library와 React 18.3의 act API를 맞춘다.
jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"),
  act: require("react").act,
}));

test("페이지에는 양식이 없고, '문의 남기기'가 문의 모달을 연다", () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ContactPage />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("form", { name: "문의 양식" })).not.toBeInTheDocument();
  expect(screen.queryByText(/응답 시간/)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "문의 남기기" }));
  expect(screen.getByRole("dialog", { name: "문의하기" })).toBeInTheDocument();
  expect(screen.getByRole("form", { name: "문의 양식" })).toBeInTheDocument();
});
