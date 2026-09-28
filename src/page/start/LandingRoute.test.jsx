import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import LandingRoute from "./LandingRoute";
import { ADMIN_KEY, VISITOR_KEY } from "../../utils/storage";
import { sendEvent } from "../../api/event";
import { trackVisit } from "../../api/visit";

jest.mock("../../api/event", () => ({ sendEvent: jest.fn() }));
jest.mock("../../api/blogView", () => ({ sendBlogView: jest.fn() }));
jest.mock("../../api/visit", () => ({ trackVisit: jest.fn() }));
jest.mock("./StartPage", () => () => <p>v1 랜딩</p>);
jest.mock("./LandingV2Page", () => () => <p>v2 랜딩</p>);

// utils/landingExperiment.test.js와 같은 방문자 ID(칸 68 → v1, 칸 18 → v2)
const V1_ID = "00000000-0000-4000-8000-000000000000";
const V2_ID = "11111111-1111-4111-8111-111111111111";

const Where = () => {
  const { pathname, search } = useLocation();
  return <output data-testid="where">{pathname + search}</output>;
};

const mount = (entry = "/") =>
  render(
    <MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LandingRoute />
      <Where />
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  window.clarity = jest.fn();
});

const sentNames = () => sendEvent.mock.calls.map(([e]) => e.name);

afterEach(() => {
  delete window.clarity;
});

test("v1 배정이면 지금 랜딩을 그리고 방문·landing_view·Clarity v1을 한 번 남긴다", () => {
  localStorage.setItem(VISITOR_KEY, V1_ID);
  mount();
  expect(screen.getByText("v1 랜딩")).toBeInTheDocument();
  expect(trackVisit).toHaveBeenCalledTimes(1);
  expect(trackVisit).toHaveBeenCalledWith("landing");
  expect(sentNames()).toEqual(["landing_view"]);
  expect(window.clarity.mock.calls).toEqual([
    ["event", "tt_landing_view"],
    ["set", "tt_landing_variant", "v1"],
    ["event", "tt_landing_view_v1"],
  ]);
});

test("v2 배정이면 조각을 받기 전에 방문·landing_view를 먼저 남기고, 받은 뒤 v2를 그린다", async () => {
  localStorage.setItem(VISITOR_KEY, V2_ID);
  mount();
  expect(screen.queryByText("v2 랜딩")).not.toBeInTheDocument();
  expect(trackVisit).toHaveBeenCalledWith("landing");
  expect(sentNames()).toEqual(["landing_view"]);
  expect(window.clarity.mock.calls).toEqual([
    ["event", "tt_landing_view"],
    ["set", "tt_landing_variant", "v2"],
    ["event", "tt_landing_view_v2"],
  ]);
  expect(await screen.findByText("v2 랜딩")).toBeInTheDocument();
  expect(sentNames()).toEqual(["landing_view"]);
});

test("관리자는 `?landing=v2`로 v2를 보되 Clarity에 남기지 않는다", async () => {
  localStorage.setItem(ADMIN_KEY, "token");
  mount("/?landing=v2");
  expect(await screen.findByText("v2 랜딩")).toBeInTheDocument();
  expect(window.clarity).not.toHaveBeenCalled();
  expect(sendEvent).not.toHaveBeenCalled();
});

describe("관리자 A·B 전환 버튼", () => {
  const switcher = () => screen.queryByRole("group", { name: "관리자 랜딩 전환" });

  test("관리자가 아니면 보이지 않는다", () => {
    localStorage.setItem(VISITOR_KEY, V2_ID);
    mount();
    expect(switcher()).not.toBeInTheDocument();
  });

  test("관리자는 A·B를 오가며 볼 수 있고, 주소에 남아 새로고침해도 같은 쪽이며, 기록은 남지 않는다", async () => {
    localStorage.setItem(ADMIN_KEY, "token");
    localStorage.setItem(VISITOR_KEY, V2_ID);
    mount();
    expect(screen.getByText("v1 랜딩")).toBeInTheDocument();
    const group = switcher();
    expect(within(group).getByRole("button", { name: "A 지금 랜딩" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(within(group).getByRole("button", { name: "B 스크롤 이야기" }));
    expect(await screen.findByText("v2 랜딩")).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent("/?landing=v2");
    expect(within(switcher()).getByRole("button", { name: "B 스크롤 이야기" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(within(switcher()).getByRole("button", { name: "A 지금 랜딩" }));
    expect(screen.getByText("v1 랜딩")).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/$/);

    expect(sendEvent).not.toHaveBeenCalled();
    expect(window.clarity).not.toHaveBeenCalled();
  });
});
