import { fireEvent, render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import InquiryFeed from "./InquiryFeed";
import { getInquiries } from "../../api/admin";

jest.mock("../../api/admin", () => ({ getInquiries: jest.fn() }));
// 설치된 testing-library와 React 18.3의 act API를 맞춘다.
jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"),
  act: require("react").act,
}));

const inquiry = {
  id: "1",
  category: "bug",
  email: "user@example.com",
  summary: "시간 저장이 안 돼요",
  detail: "저장을 눌렀는데\n반영되지 않습니다.",
  context: {
    name: "철수",
    tableId: "table-1",
    fromPath: "/table/table-1",
    viewport: "390x844",
    timeZone: "Asia/Seoul",
    userAgent: "Mozilla/5.0 KAKAOTALK",
    visitorId: "visitor-1",
  },
  createdAt: "2026-09-28T05:32:00.000Z",
};

// 불러오기가 끝나 로딩 문구가 사라질 때까지 기다린다.
const renderFeed = async (props = {}) => {
  render(<InquiryFeed {...props} />);
  await waitForElementToBeRemoved(() => screen.queryByText("문의를 불러오는 중입니다"));
};

beforeEach(() => {
  jest.resetAllMocks();
});

test("문의와 함께 온 정보를 보여 주고, 그 표 보기는 표 상세를 연다", async () => {
  getInquiries.mockResolvedValue({ total: 1, inquiries: [inquiry] });
  const onOpenTable = jest.fn();
  await renderFeed({ onOpenTable });

  expect(screen.getByText("시간 저장이 안 돼요")).toBeInTheDocument();
  expect(screen.getByText("버그")).toBeInTheDocument();
  expect(screen.getByText("Mozilla/5.0 KAKAOTALK")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /\/table\/table-1/ })).toHaveAttribute("href", "/table/table-1");
  expect(screen.getByRole("link", { name: /메일 쓰기/ }).getAttribute("href")).toMatch(
    /^mailto:user%40example\.com\?subject=/,
  );

  fireEvent.click(screen.getByRole("button", { name: "그 표 보기" }));
  expect(onOpenTable).toHaveBeenCalledWith("table-1");
});

test("이메일 없이 온 문의는 답장 불가로 표시하고 메일 쓰기를 숨긴다", async () => {
  const { email, ...withoutEmail } = inquiry;
  getInquiries.mockResolvedValue({ total: 1, inquiries: [{ ...withoutEmail, id: "2" }] });
  await renderFeed();
  expect(screen.getByText("이메일 없음 · 답장 불가")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /메일 쓰기/ })).not.toBeInTheDocument();
});

test("문의가 없으면 빈 상태를 보여 준다", async () => {
  getInquiries.mockResolvedValue({ total: 0, inquiries: [] });
  await renderFeed();
  expect(screen.getByText("아직 들어온 문의가 없습니다.")).toBeInTheDocument();
});

test("백엔드가 아직 배포되지 않았으면 그렇게 알려 준다", async () => {
  getInquiries.mockResolvedValue({ error: "notDeployed" });
  await renderFeed();
  expect(screen.getByText(/백엔드부터 배포하세요/)).toBeInTheDocument();
});

test("전체보다 적게 불러왔으면 일부만 표시한다고 알려 준다", async () => {
  getInquiries.mockResolvedValue({ total: 250, inquiries: [inquiry] });
  await renderFeed();
  expect(screen.getByText(/최근 1건만 표시합니다/)).toBeInTheDocument();
});
