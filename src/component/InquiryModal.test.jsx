import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import InquiryModal from "./InquiryModal";
import Header from "./Header";
import { sendInquiry } from "../api/inquiry";

jest.mock("../api/inquiry", () => ({ sendInquiry: jest.fn() }));
jest.mock("../utils/analytics", () => ({ trackEvent: jest.fn(), EVENTS: {} }));
// sweetalert2는 불러올 때 jsdom이 못 읽는 CSS를 넣는다. 헤더의 도움말 팝업만 쓰므로 막아 둔다.
jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
// 설치된 testing-library와 React 18.3의 act API를 맞춘다.
jest.mock("react-dom/test-utils", () => ({
  ...jest.requireActual("react-dom/test-utils"),
  act: require("react").act,
}));

const EMAIL = "timetable2official@gmail.com";

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  document.body.style.overflow = "";
});

describe("InquiryModal", () => {
  const openModal = (onClose = jest.fn()) => {
    render(<InquiryModal contactEmail={EMAIL} fromPath="/guide" onClose={onClose} />);
    return onClose;
  };

  test("양식을 모달 안에 바로 보여 주고, 응답 시간·보관 기간·함께 보내는 정보는 쓰지 않는다", () => {
    openModal();
    const dialog = screen.getByRole("dialog", { name: "문의하기" });
    expect(within(dialog).getByRole("form", { name: "문의 양식" })).toBeInTheDocument();
    expect(dialog).toHaveFocus();
    expect(dialog).not.toHaveTextContent("응답 시간");
    expect(dialog).not.toHaveTextContent("10년");
    expect(dialog).not.toHaveTextContent("함께 보내는 정보");
  });

  test("열려 있는 동안 뒤 페이지 스크롤을 막고, 닫으면 되돌린다", () => {
    const { unmount } = render(<InquiryModal contactEmail={EMAIL} fromPath="/" onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  test("Esc와 닫기 버튼으로 닫는다", () => {
    const onClose = openModal();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test("메일 주소를 복사할 수 있다", async () => {
    const writeText = jest.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    openModal();
    fireEvent.click(screen.getByRole("button", { name: "주소 복사" }));
    expect(await screen.findByRole("button", { name: "복사됨" })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(EMAIL);
  });
});

describe("Header 문의", () => {
  const renderHeaderAt = (path) =>
    render(
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Header />
      </MemoryRouter>,
    );

  test("헤더의 문의를 누르면 페이지 이동 없이 모달에서 보내고, 누른 페이지를 함께 보낸다", async () => {
    sendInquiry.mockResolvedValue({ ok: true, skipped: false });
    renderHeaderAt("/table/table-1");

    fireEvent.click(screen.getByRole("button", { name: "문의" }));
    const dialog = screen.getByRole("dialog", { name: "문의하기" });

    fireEvent.click(within(dialog).getByLabelText("버그"));
    fireEvent.change(within(dialog).getByLabelText(/답장 받을 이메일/), { target: { value: "user@example.com" } });
    fireEvent.change(within(dialog).getByLabelText("① 어떤 문의인가요?"), { target: { value: "저장이 안 돼요" } });
    fireEvent.change(within(dialog).getByLabelText("② 자세한 내용"), {
      target: { value: "저장을 눌렀는데 반영되지 않습니다." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "문의 보내기" }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(sendInquiry.mock.calls[0][0].context.fromPath).toBe("/table/table-1");
    expect(within(dialog).getByText("문의가 접수되었습니다")).toBeInTheDocument();

    fireEvent.click(within(dialog).getAllByRole("button", { name: "닫기" })[1]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
