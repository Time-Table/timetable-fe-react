import { act, fireEvent, render, screen } from "@testing-library/react";
import InquiryForm from "./InquiryForm";
import { sendInquiry } from "../../api/inquiry";

jest.mock("../../api/inquiry", () => ({ sendInquiry: jest.fn() }));
// 설치된 testing-library와 React 18.3의 act API를 맞춘다.
jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"),
  act: require("react").act,
}));

const EMAIL = "timetable2official@gmail.com";

const renderForm = (props = {}) =>
  render(<InquiryForm contactEmail={EMAIL} fromPath="/table/table-1" onClose={jest.fn()} {...props} />);

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillValid = () => {
  fireEvent.click(screen.getByLabelText("버그"));
  type(/답장 받을 이메일/, " user@example.com ");
  type("① 어떤 문의인가요?", "시간 저장이 안 돼요");
  type("② 자세한 내용", "저장을 눌렀는데 반영되지 않습니다.");
};

const submit = async () => {
  fireEvent.click(screen.getByRole("button", { name: "문의 보내기" }));
  // 보내기 결과(Promise)를 반영한 뒤 확인한다.
  await act(async () => {
    await Promise.resolve();
  });
};

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
});

test("함께 보내는 정보(참여 이름·누른 페이지)는 화면에 보여 주지 않는다", () => {
  localStorage.setItem("name", "철수");
  localStorage.setItem("tableId", "table-1");
  renderForm();
  expect(screen.queryByText("함께 보내는 정보")).not.toBeInTheDocument();
  expect(screen.queryByText("철수")).not.toBeInTheDocument();
  expect(screen.queryByText("/table/table-1")).not.toBeInTheDocument();
});

test("빈 양식은 보내지 않고 첫 번째 틀린 칸(유형)으로 포커스를 옮긴다", async () => {
  renderForm();
  await submit();
  expect(sendInquiry).not.toHaveBeenCalled();
  expect(screen.getByText("문의 유형을 선택해 주세요.")).toBeInTheDocument();
  expect(screen.getByText("어떤 문의인지 한 줄로 적어 주세요.")).toBeInTheDocument();
  expect(screen.getByLabelText("버그")).toHaveFocus();
});

test("유형을 고르면 칸 안의 예시 문구가 그 유형에 맞게 바뀐다", () => {
  renderForm();
  fireEvent.click(screen.getByLabelText("제휴"));
  expect(screen.getByLabelText("① 어떤 문의인가요?")).toHaveAttribute("placeholder", "예: 광고 제휴 제안");
});

test("올바른 양식은 다듬은 값과 함께 보내는 정보를 서버로 보내고 접수 화면을 보여 준다", async () => {
  localStorage.setItem("name", "철수");
  localStorage.setItem("tableId", "table-1");
  sendInquiry.mockResolvedValue({ ok: true, skipped: false });
  renderForm();
  fillValid();
  await submit();

  expect(sendInquiry).toHaveBeenCalledTimes(1);
  const payload = sendInquiry.mock.calls[0][0];
  expect(payload).toMatchObject({
    category: "bug",
    email: "user@example.com",
    summary: "시간 저장이 안 돼요",
    detail: "저장을 눌렀는데 반영되지 않습니다.",
    hope: undefined,
    website: "",
    context: { name: "철수", tableId: "table-1", fromPath: "/table/table-1" },
  });
  expect(screen.getByText("문의가 접수되었습니다")).toHaveFocus();
  expect(screen.getByText("user@example.com")).toBeInTheDocument();
});

test("관리자 모드 브라우저면 저장하지 않았다고 알려 준다", async () => {
  sendInquiry.mockResolvedValue({ ok: true, skipped: true });
  renderForm();
  fillValid();
  await submit();
  expect(screen.getByText("관리자 모드 브라우저라 문의함에 저장하지 않았습니다.")).toBeInTheDocument();
});

test("IP 한도에 걸리면 서버 문구를 양식 안에 보여 주고 입력은 남긴다", async () => {
  sendInquiry.mockResolvedValue({
    ok: false,
    reason: "rateLimited",
    message: "문의는 10분에 3건까지 보낼 수 있습니다. 잠시 후 다시 시도해 주세요.",
  });
  renderForm();
  fillValid();
  await submit();
  expect(screen.getByRole("alert")).toHaveTextContent("10분에 3건까지");
  expect(screen.getByLabelText("① 어떤 문의인가요?")).toHaveValue("시간 저장이 안 돼요");
});

test("서버에 닿지 못하면 메일 주소로 보내 달라고 안내한다", async () => {
  sendInquiry.mockResolvedValue({ ok: false, reason: "failed" });
  renderForm();
  fillValid();
  await submit();
  expect(screen.getByRole("alert")).toHaveTextContent(EMAIL);
});

test("답장 받을 이메일은 (선택)으로 표시하고, 비워도 보내며 답변을 따로 드리지 않는다고 알려 준다", async () => {
  sendInquiry.mockResolvedValue({ ok: true, skipped: false });
  renderForm();
  expect(screen.getByLabelText(/답장 받을 이메일/)).toHaveAccessibleName("답장 받을 이메일 (선택)");
  fillValid();
  type(/답장 받을 이메일/, "");
  await submit();
  expect(sendInquiry.mock.calls[0][0].email).toBeUndefined();
  expect(screen.getByText(/이메일을 남기지 않으셔서 따로 답변드리지는 않습니다/)).toBeInTheDocument();
});

test("접수 화면의 '닫기'는 모달을 닫는다(onClose)", async () => {
  const onClose = jest.fn();
  sendInquiry.mockResolvedValue({ ok: true, skipped: false });
  renderForm({ onClose });
  fillValid();
  await submit();
  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("누른 페이지가 없으면 fromPath 없이 보낸다", async () => {
  sendInquiry.mockResolvedValue({ ok: true, skipped: false });
  renderForm({ fromPath: null });
  fillValid();
  await submit();
  expect(sendInquiry.mock.calls[0][0].context.fromPath).toBeUndefined();
});
