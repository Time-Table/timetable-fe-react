import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import BlogDetailPage from "./BlogDetailPage";

jest.mock("../../utils/analytics", () => ({ trackBlogView: jest.fn() }));
jest.mock("../../component/AdSense", () => () => null);
jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"), act: require("react").act,
}));

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

function openBlog(slug) {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/blog/${slug}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Location />
        <Routes>
          <Route path="/blog/:id" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

test.each(["constructor", "toString", "__proto__"])("미등록 주소 %s는 이동하지 않고 404를 표시한다", (slug) => {
  openBlog(slug);
  expect(screen.getByRole("heading", { name: "404 Error" })).toBeInTheDocument();
  expect(screen.getByTestId("location")).toHaveTextContent(`/blog/${slug}`);
});

test("등록된 옛 slug는 해당 글로 이동한다", () => {
  openBlog("stop-procrastination-time-management");
  expect(screen.getByTestId("location")).toHaveTextContent("/blog/club-meeting-date-scheduling");
  expect(screen.queryByRole("heading", { name: "404 Error" })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("동호회 모임 날짜 정하기");
});
