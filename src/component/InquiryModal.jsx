import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import { IoClose } from "react-icons/io5";
import theme from "../theme";
import InquiryForm from "../page/contact/InquiryForm";

// 모달 안에서 Tab이 도는 대상. 숨은 칸(tabIndex -1)은 빠진다.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 헤더의 "문의"를 누르면 뜨는 문의 모달. 페이지로 넘어가지 않고 여기서 바로 보낸다(2026-09-28 사용자 지시).
 *
 * 헤더에 backdrop-filter가 있어 그 안의 position: fixed가 화면이 아니라 헤더 기준으로 잡힌다.
 * 그래서 body로 포털을 연다.
 * 바깥(어두운 막)을 눌러도 닫지 않는다. 적던 문의가 실수 한 번에 사라지면 안 되기 때문이다.
 */
export default function InquiryModal({ contactEmail, fromPath, onClose }) {
  const dialogRef = useRef(null);
  // null | "done" | "failed"
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;

    const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const copyEmail = () => {
    navigator.clipboard
      .writeText(contactEmail)
      .then(() => setCopied("done"))
      .catch(() => setCopied("failed"));
  };

  return createPortal(
    <Scrim>
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <Head>
          <Title id="inquiry-modal-title">문의하기</Title>
          <CloseButton type="button" onClick={onClose} aria-label="닫기">
            <IoClose aria-hidden="true" />
          </CloseButton>
        </Head>
        <Lead>사용 중 불편을 드렸다면 죄송합니다. 이메일을 남겨 주시면 답변드리겠습니다.</Lead>

        <InquiryForm contactEmail={contactEmail} fromPath={fromPath} onClose={onClose} />

        <EmailRow>
          <span>메일로 직접 보내셔도 됩니다</span>
          <EmailLine>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            <CopyButton type="button" onClick={copyEmail}>
              {copied === "done" ? "복사됨" : "주소 복사"}
            </CopyButton>
          </EmailLine>
          <CopyStatus aria-live="polite">
            {copied === "failed" && "복사하지 못했습니다. 주소를 직접 복사해 주세요."}
          </CopyStatus>
        </EmailRow>
      </Dialog>
    </Scrim>,
    document.body,
  );
}

const focusRing = `
  outline: 2px solid ${theme.color.focusRing};
  outline-offset: 2px;
`;

// 헤더(z-index 1000) 위에 뜬다.
const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.space[4]};
  background: ${theme.color.scrim};
`;

const Dialog = styled.div`
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-sizing: border-box;
  padding: ${theme.space[6]};
  border-radius: ${theme.radius.lg};
  background: ${theme.color.surface};
  box-shadow: ${theme.shadow.popover};

  &:focus {
    outline: none;
  }

  @media (max-width: ${theme.breakpoint.sm}) {
    padding: ${theme.space[5]} ${theme.space[4]};
  }
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.space[3]};
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.title3};
  color: ${theme.text.gamma[100]};
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-right: -${theme.space[2]};
  border: none;
  border-radius: ${theme.radius.pill};
  background: none;
  font-size: ${theme.font.size.title2};
  color: ${theme.text.gamma[300]};
  cursor: pointer;

  &:hover {
    background: ${theme.text.gamma[900]};
  }

  &:focus-visible {
    ${focusRing}
  }
`;

const Lead = styled.div`
  margin: ${theme.space[2]} 0 ${theme.space[6]};
  font-size: ${theme.font.size.body};
  line-height: ${theme.font.lineHeight.normal};
  color: ${theme.text.gamma[400]};
`;

const EmailRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[1]};
  margin-top: ${theme.space[6]};
  padding-top: ${theme.space[5]};
  border-top: 1px solid ${theme.text.gamma[900]};
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};
`;

const EmailLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.space[2]} ${theme.space[3]};

  a {
    font-family: ${theme.font.family.semiBold};
    font-size: ${theme.font.size.label};
    color: ${theme.text.gamma[200]};
    text-decoration: underline;
    overflow-wrap: anywhere;
  }
`;

const CopyButton = styled.button`
  min-height: 32px;
  padding: 0 ${theme.space[3]};
  border: 1px solid ${theme.text.gamma[600]};
  border-radius: ${theme.radius.pill};
  background: ${theme.color.surface};
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[300]};
  cursor: pointer;

  &:focus-visible {
    ${focusRing}
  }
`;

const CopyStatus = styled.span`
  color: ${theme.color.primaryText};

  &:empty {
    display: none;
  }
`;
