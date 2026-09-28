import { act, fireEvent, render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import Swal from "sweetalert2";
import InquiryFeed from "./InquiryFeed";
import { getInquiries, updateInquiryStatus, deleteInquiry } from "../../api/admin";

jest.mock("../../api/admin", () => ({
  getInquiries: jest.fn(),
  updateInquiryStatus: jest.fn(),
  deleteInquiry: jest.fn(),
}));
jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
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

const flush = () => act(async () => { await Promise.resolve(); });
const statusOf = (summary = inquiry.summary) => screen.getByRole("combobox", { name: `처리 상태: ${summary}` });

test("상태가 없는 옛 문의는 새 문의로 보이고, 고른 상태를 저장한다", async () => {
  getInquiries.mockResolvedValue({ total: 1, inquiries: [inquiry] });
  updateInquiryStatus.mockResolvedValue({ success: true, data: { id: "1", status: "planned" } });
  await renderFeed();

  expect(statusOf()).toHaveValue("new");
  expect([...statusOf().options].map((o) => o.textContent)).toEqual(["새 문의", "예정", "완료", "보류", "무시"]);
  fireEvent.change(statusOf(), { target: { value: "planned" } });
  await flush();
  expect(updateInquiryStatus).toHaveBeenCalledWith("1", "planned");
  expect(statusOf()).toHaveValue("planned");
});

test("상태 저장에 실패하면 이전 상태로 되돌리고 이유를 알린다", async () => {
  getInquiries.mockResolvedValue({ total: 1, inquiries: [{ ...inquiry, status: "onHold" }] });
  updateInquiryStatus.mockResolvedValue({ error: "notDeployed" });
  await renderFeed();

  fireEvent.change(statusOf(), { target: { value: "done" } });
  await flush();
  expect(statusOf()).toHaveValue("onHold");
  expect(screen.getByRole("alert")).toHaveTextContent("백엔드부터 배포하세요");
});

test("삭제는 확인한 뒤에만 요청하고, 성공하면 목록과 전체 건수에서 뺀다", async () => {
  const second = { ...inquiry, id: "2", summary: "다른 문의" };
  getInquiries.mockResolvedValue({ total: 300, inquiries: [inquiry, second] });
  deleteInquiry.mockResolvedValue({ success: true });
  await renderFeed();

  Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
  fireEvent.click(screen.getByRole("button", { name: `문의 삭제: ${inquiry.summary}` }));
  await flush();
  expect(Swal.fire.mock.calls[0][0].text).toContain("복구할 수 없습니다");
  expect(deleteInquiry).not.toHaveBeenCalled();

  Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
  fireEvent.click(screen.getByRole("button", { name: `문의 삭제: ${inquiry.summary}` }));
  await flush();
  expect(deleteInquiry).toHaveBeenCalledWith("1");
  expect(screen.queryByText(inquiry.summary)).not.toBeInTheDocument();
  expect(screen.getByText("다른 문의")).toBeInTheDocument();
  expect(screen.getByText(/전체 299건/)).toBeInTheDocument();
});

test("삭제에 실패하면 목록에 남기고 이유를 알린다", async () => {
  getInquiries.mockResolvedValue({ total: 1, inquiries: [inquiry] });
  deleteInquiry.mockResolvedValue({ error: "failed" });
  Swal.fire.mockResolvedValue({ isConfirmed: true });
  await renderFeed();

  fireEvent.click(screen.getByRole("button", { name: `문의 삭제: ${inquiry.summary}` }));
  await flush();
  expect(screen.getByText(inquiry.summary)).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("저장하지 못했습니다");
});

test("문의는 10건씩 나눠 보여 주고 다음 쪽으로 넘길 수 있다", async () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ ...inquiry, id: String(i), summary: `문의 ${i + 1}` }));
  getInquiries.mockResolvedValue({ total: 12, inquiries: many });
  await renderFeed();

  expect(screen.getByText("문의 10")).toBeInTheDocument();
  expect(screen.queryByText("문의 11")).not.toBeInTheDocument();
  expect(screen.getByText("1 / 2")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  expect(screen.getByText("문의 11")).toBeInTheDocument();
  expect(screen.queryByText("문의 1")).not.toBeInTheDocument();
});
