import { useEffect, useId, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import theme from "../../theme";
import { sendInquiry } from "../../api/inquiry";
import {
  INQUIRY_CATEGORIES,
  LIMITS,
  collectContext,
  placeholdersFor,
  validateInquiry,
} from "./inquiry";

const EMPTY = { category: "", email: "", summary: "", detail: "", hope: "" };
// 보내기를 눌렀을 때 틀린 칸이 여럿이면 화면 위쪽 칸부터 포커스한다.
const FIELD_ORDER = ["category", "email", "summary", "detail", "hope"];

const FAILED_MESSAGE = (contactEmail) =>
  `문의를 보내지 못했습니다. 잠시 후 다시 시도하거나 ${contactEmail}로 메일을 보내 주세요.`;

/**
 * 문의 양식. 문의 모달(InquiryModal) 안에서만 쓴다(2026-09-28 사용자 지시로 페이지 양식은 없앴다).
 *
 * - fromPath: 문의를 누른 페이지. 화면에는 보여 주지 않고 문의와 함께 보낸다.
 * - onClose: 접수 화면의 "닫기" 버튼이 부른다.
 */
export default function InquiryForm({ contactEmail, fromPath, onClose }) {
  const context = useMemo(() => collectContext(fromPath), [fromPath]);
  // label·설명 연결용 id가 문서 안의 다른 요소와 겹치지 않게 양식마다 따로 만든다.
  const uid = useId();
  const id = (name) => `${uid}-${name}`;

  const formRef = useRef(null);
  const doneRef = useRef(null);
  const [values, setValues] = useState(EMPTY);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState({});
  // idle | sending | sent | error
  const [status, setStatus] = useState({ type: "idle" });

  const placeholders = placeholdersFor(values.category);
  const sending = status.type === "sending";

  useEffect(() => {
    if (status.type === "sent") doneRef.current?.focus();
  }, [status.type]);

  const update = (field) => (e) => {
    const { value } = e.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const found = validateInquiry(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      formRef.current?.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus({ type: "sending" });
    const email = values.email.trim();
    const result = await sendInquiry({
      category: values.category,
      email: email || undefined,
      summary: values.summary.trim(),
      detail: values.detail.trim(),
      hope: values.hope.trim() || undefined,
      website,
      context,
    });

    if (result.ok) {
      setStatus({ type: "sent", email, skipped: result.skipped });
    } else if (result.reason === "rateLimited") {
      setStatus({
        type: "error",
        message: result.message || "문의는 10분에 3건까지 보낼 수 있습니다. 잠시 후 다시 시도해 주세요.",
      });
    } else if (result.reason === "invalid") {
      setStatus({ type: "error", message: result.message || "입력한 내용을 다시 확인해 주세요." });
    } else {
      setStatus({ type: "error", message: FAILED_MESSAGE(contactEmail) });
    }
  };

  if (status.type === "sent") {
    return (
      <Done>
        <DoneTitle ref={doneRef} tabIndex={-1}>
          문의가 접수되었습니다
        </DoneTitle>
        {status.email ? (
          <DoneText>
            <strong>{status.email}</strong>로 답변드리겠습니다. 스크린샷이 있으면 답장 메일에 첨부해 주세요.
          </DoneText>
        ) : (
          <DoneText>
            이메일을 남기지 않으셔서 따로 답변드리지는 않습니다. 보내 주신 내용은 서비스 개선에 참고하겠습니다.
          </DoneText>
        )}
        {status.skipped && (
          <DoneText>관리자 모드 브라우저라 문의함에 저장하지 않았습니다.</DoneText>
        )}
        <SecondaryButton type="button" onClick={onClose}>
          닫기
        </SecondaryButton>
      </Done>
    );
  }

  const describe = (field, hint) =>
    [hint && id(`${field}-hint`), errors[field] && id(`${field}-error`)].filter(Boolean).join(" ") ||
    undefined;

  return (
    <Form ref={formRef} onSubmit={handleSubmit} noValidate aria-label="문의 양식">
      <Fieldset aria-describedby={errors.category ? id("category-error") : undefined}>
        <Legend>문의 유형</Legend>
        <Chips>
          {INQUIRY_CATEGORIES.map((item) => (
            <Chip key={item.value}>
              <input
                type="radio"
                name="category"
                value={item.value}
                checked={values.category === item.value}
                onChange={update("category")}
              />
              <span>{item.label}</span>
            </Chip>
          ))}
        </Chips>
        {errors.category && <ErrorText id={id("category-error")}>{errors.category}</ErrorText>}
      </Fieldset>

      <FieldBlock>
        <Label htmlFor={id("email")}>
          답장 받을 이메일 <Optional>(선택)</Optional>
        </Label>
        <TextInput
          id={id("email")}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={LIMITS.EMAIL}
          placeholder="name@example.com"
          value={values.email}
          onChange={update("email")}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describe("email", true)}
        />
        <Hint id={id("email-hint")}>답변을 받으시려면 적어 주세요. 답변을 보내는 데만 사용합니다.</Hint>
        {errors.email && <ErrorText id={id("email-error")}>{errors.email}</ErrorText>}
      </FieldBlock>

      <FieldBlock>
        <Label htmlFor={id("summary")}>① 어떤 문의인가요?</Label>
        <TextInput
          id={id("summary")}
          name="summary"
          maxLength={LIMITS.SUMMARY}
          placeholder={placeholders.summary}
          value={values.summary}
          onChange={update("summary")}
          aria-invalid={Boolean(errors.summary)}
          aria-describedby={describe("summary")}
        />
        {errors.summary && <ErrorText id={id("summary-error")}>{errors.summary}</ErrorText>}
      </FieldBlock>

      <FieldBlock>
        <Label htmlFor={id("detail")}>② 자세한 내용</Label>
        <TextArea
          id={id("detail")}
          name="detail"
          rows={6}
          maxLength={LIMITS.DETAIL}
          placeholder={placeholders.detail}
          value={values.detail}
          onChange={update("detail")}
          aria-invalid={Boolean(errors.detail)}
          aria-describedby={describe("detail", true)}
        />
        <HintRow>
          <Hint id={id("detail-hint")}>{LIMITS.DETAIL_MIN}자 이상</Hint>
          <Counter aria-hidden="true">
            {values.detail.length.toLocaleString()} / {LIMITS.DETAIL.toLocaleString()}
          </Counter>
        </HintRow>
        {errors.detail && <ErrorText id={id("detail-error")}>{errors.detail}</ErrorText>}
      </FieldBlock>

      <FieldBlock>
        <Label htmlFor={id("hope")}>
          ③ 바라는 점 <Optional>(선택)</Optional>
        </Label>
        <TextArea
          id={id("hope")}
          name="hope"
          rows={3}
          maxLength={LIMITS.HOPE}
          placeholder={placeholders.hope}
          value={values.hope}
          onChange={update("hope")}
          aria-invalid={Boolean(errors.hope)}
          aria-describedby={describe("hope")}
        />
        {errors.hope && <ErrorText id={id("hope-error")}>{errors.hope}</ErrorText>}
      </FieldBlock>

      {/* 사람에게는 보이지 않는 칸. 봇이 채우면 서버가 저장하지 않는다. */}
      <Honeypot aria-hidden="true">
        <label>
          웹사이트
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </Honeypot>

      {status.type === "error" && <FormError role="alert">{status.message}</FormError>}

      <SubmitButton type="submit" disabled={sending}>
        {sending ? "보내는 중…" : "문의 보내기"}
      </SubmitButton>
    </Form>
  );
}

const focusRing = `
  outline: 2px solid ${theme.color.focusRing};
  outline-offset: 2px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[6]};
`;

const Fieldset = styled.fieldset`
  border: none;
  margin: 0;
  padding: 0;
  min-width: 0;
`;

const Legend = styled.legend`
  padding: 0;
  margin-bottom: ${theme.space[2]};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.body};
  color: ${theme.text.gamma[200]};
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.space[2]};
`;

const Chip = styled.label`
  position: relative;
  cursor: pointer;

  input {
    ${theme.styles.srOnly}
  }

  span {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 ${theme.space[4]};
    border: 1px solid ${theme.text.gamma[600]};
    border-radius: ${theme.radius.pill};
    background: ${theme.color.surface};
    font-family: ${theme.font.family.medium};
    font-size: ${theme.font.size.label};
    color: ${theme.text.gamma[300]};
    transition: background-color ${theme.duration.fast} ${theme.easing.standard},
      border-color ${theme.duration.fast} ${theme.easing.standard};
  }

  input:checked + span {
    border-color: ${theme.color.primaryBorder};
    background: ${theme.color.primarySurface};
    font-family: ${theme.font.family.semiBold};
    color: ${theme.color.primaryText};
  }

  input:focus-visible + span {
    ${focusRing}
  }
`;

const FieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]};
`;

const Label = styled.label`
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.body};
  color: ${theme.text.gamma[200]};
`;

const Optional = styled.span`
  font-family: ${theme.font.family.regular};
  color: ${theme.text.gamma[400]};
`;

// 글자 크기는 16px 이상이어야 아이폰이 입력할 때 화면을 확대하지 않는다.
const fieldBase = `
  width: 100%;
  box-sizing: border-box;
  padding: ${theme.space[3]};
  border: 1px solid ${theme.text.gamma[600]};
  border-radius: ${theme.radius.sm};
  background: ${theme.color.surface};
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.bodyLg};
  line-height: ${theme.font.lineHeight.normal};
  color: ${theme.text.gamma[100]};

  &::placeholder {
    color: ${theme.text.gamma[400]};
  }

  &:focus-visible {
    ${focusRing}
  }

  &[aria-invalid="true"] {
    border-color: ${theme.color.primaryBorder};
  }
`;

const TextInput = styled.input`
  ${fieldBase}
`;

const TextArea = styled.textarea`
  ${fieldBase}
  resize: vertical;
`;

const HintRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${theme.space[3]};
`;

const Hint = styled.span`
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};
`;

const Counter = styled.span`
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};
  font-variant-numeric: tabular-nums;
`;

const ErrorText = styled.span`
  display: block;
  margin-top: ${theme.space[1]};
  font-size: ${theme.font.size.small};
  color: ${theme.color.primaryText};
`;

const Honeypot = styled.div`
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

const FormError = styled.div`
  margin: 0;
  font-size: ${theme.font.size.label};
  line-height: ${theme.font.lineHeight.normal};
  color: ${theme.color.primaryText};
`;

const SubmitButton = styled.button`
  min-height: 52px;
  border: none;
  border-radius: ${theme.radius.md};
  background: ${theme.color.primaryText};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.bodyLg};
  color: ${theme.color.surface};
  cursor: pointer;
  transition: box-shadow ${theme.duration.fast} ${theme.easing.standard};

  &:hover:not(:disabled) {
    box-shadow: ${theme.shadow.raised};
  }

  &:focus-visible {
    ${focusRing}
  }

  &:disabled {
    background: ${theme.text.gamma[400]};
    cursor: default;
  }
`;

const Done = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${theme.space[3]};
  padding: ${theme.space[6]};
  border-radius: ${theme.radius.md};
  background: ${theme.text.gamma[950]};
`;

const DoneTitle = styled.h3`
  margin: 0;
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.title3};
  color: ${theme.text.gamma[100]};

  &:focus-visible {
    ${focusRing}
  }
`;

const DoneText = styled.div`
  margin: 0;
  font-size: ${theme.font.size.body};
  line-height: ${theme.font.lineHeight.normal};
  color: ${theme.text.gamma[300]};
  overflow-wrap: anywhere;
`;

const SecondaryButton = styled.button`
  min-height: 44px;
  padding: 0 ${theme.space[5]};
  border: 1px solid ${theme.text.gamma[600]};
  border-radius: ${theme.radius.md};
  background: ${theme.color.surface};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.label};
  color: ${theme.text.gamma[200]};
  cursor: pointer;

  &:focus-visible {
    ${focusRing}
  }
`;
