import { render, screen } from "@testing-library/react";
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
const originalSearch = window.location.search;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  window.clarity = jest.fn();
});

const sentNames = () => sendEvent.mock.calls.map(([e]) => e.name);

afterEach(() => {
  delete window.clarity;
  window.history.replaceState(null, "", `/${originalSearch}`);
});

test("v1 배정이면 지금 랜딩을 그리고 방문·landing_view·Clarity v1을 한 번 남긴다", () => {
  localStorage.setItem(VISITOR_KEY, V1_ID);
  render(<LandingRoute />);
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
  render(<LandingRoute />);
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
  window.history.replaceState(null, "", "/?landing=v2");
  render(<LandingRoute />);
  expect(await screen.findByText("v2 랜딩")).toBeInTheDocument();
  expect(window.clarity).not.toHaveBeenCalled();
  expect(sendEvent).not.toHaveBeenCalled();
});
