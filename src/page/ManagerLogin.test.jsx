import { render, screen, waitFor } from "@testing-library/react";
import Swal from "sweetalert2";
import ManagerPage from "./ManagerPage";
import { adminLogin } from "../api/admin";
import { grantAdmin } from "../utils/admin";

// 관리자 로그인: 토큰을 저장하지 못하면(사이트 저장소 쓰기 차단) 인증 완료로 넘어가지 않는다(Codex 2026-10-02).
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }));
jest.mock("../Seo", () => () => null);
jest.mock("./manager/charts", () => ({ TrendChart: () => null, MonthlyBarChart: () => null, BarList: () => null }));
jest.mock("../api/event", () => ({ getFunnels: jest.fn() }));
jest.mock("../api/admin", () => ({ adminLogin: jest.fn(), adminVerify: jest.fn(), getTrends: jest.fn(), getBlogStats: jest.fn() }));
jest.mock("../api/visit", () => ({ getTrackVisit: jest.fn() }));
jest.mock("../api/table", () => ({ getAllTables: jest.fn(), updateTable: jest.fn(), deleteTable: jest.fn() }));
jest.mock("../utils/admin", () => ({ isAdmin: () => false, grantAdmin: jest.fn(), revokeAdmin: jest.fn() }));
jest.mock("sweetalert2", () => ({ fire: jest.fn(), mixin: () => ({ fire: jest.fn() }) }));
jest.mock("react-dom/test-utils", () => ({ ...jest.requireActual("react-dom/test-utils"), act: require("react").act }));

beforeEach(() => {
  jest.clearAllMocks();
  Swal.fire.mockResolvedValueOnce({ value: "pw", isDismissed: false }).mockResolvedValue({});
  adminLogin.mockResolvedValue({ success: true, data: { token: "t" } });
});

test("토큰 저장에 실패하면 인증 완료로 넘어가지 않고 저장소 안내 뒤 홈으로", async () => {
  grantAdmin.mockReturnValue(false);
  render(<ManagerPage />);
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
  expect(Swal.fire).toHaveBeenCalledWith("인증 정보를 저장하지 못했습니다", expect.any(String), "error");
  expect(screen.queryByText("Admin Console")).not.toBeInTheDocument();
});
