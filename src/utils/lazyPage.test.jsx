import { Suspense } from "react";
import { render, screen } from "@testing-library/react";
import { lazyPage, LazyPageBoundary } from "./lazyPage";

// 현재 testing-library 버전과 React 18.3의 act API를 맞춘다.
jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"), act: require("react").act,
}));

const originalLocation = window.location;
let reload;

beforeEach(() => {
  sessionStorage.clear();
  reload = jest.fn();
  delete window.location;
  window.location = { ...originalLocation, reload };
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  window.location = originalLocation;
  console.error.mockRestore();
});

const mount = (Page, resetKey = "/a") => (
  <LazyPageBoundary resetKey={resetKey}>
    <Suspense fallback={<p>불러오는 중</p>}>
      <Page />
    </Suspense>
  </LazyPageBoundary>
);

test("받아지면 그대로 그린다", async () => {
  const Page = lazyPage(() => Promise.resolve({ default: () => <p>소개</p> }));
  render(mount(Page));
  expect(await screen.findByText("소개")).toBeInTheDocument();
  expect(reload).not.toHaveBeenCalled();
});

test("처음 못 받으면 한 번만 새로고침한다", async () => {
  const Page = lazyPage(() => Promise.reject(new Error("ChunkLoadError")));
  render(mount(Page));
  await Promise.resolve();
  await new Promise((done) => setTimeout(done, 0));
  expect(reload).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem("lazy-page-reload-at")).not.toBeNull();
  expect(screen.getByText("불러오는 중")).toBeInTheDocument();
});

test("방금 새로고침했는데도 못 받으면 새로고침을 반복하지 않고 안내를 띄운다. 주소가 바뀌면 거둔다", async () => {
  sessionStorage.setItem("lazy-page-reload-at", String(Date.now()));
  const Page = lazyPage(() => Promise.reject(new Error("ChunkLoadError")));
  const { rerender } = render(mount(Page));
  expect(await screen.findByRole("alert")).toHaveTextContent("페이지를 불러오지 못했습니다");
  expect(reload).not.toHaveBeenCalled();

  const Other = () => <p>다른 페이지</p>;
  rerender(mount(Other, "/b"));
  expect(await screen.findByText("다른 페이지")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
