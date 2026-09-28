import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import Swal from "sweetalert2";
import { FiExternalLink, FiMail, FiTrash2 } from "react-icons/fi";
import { getInquiries, updateInquiryStatus, deleteInquiry } from "../../api/admin";
import { INQUIRY_CATEGORIES } from "../contact/inquiry";
import t from "./tokens";
import { Card, Empty, Loading, Spinner, Tag, Select, Button } from "./ui";
import Pagination, { usePaged, Anchor } from "./Pagination";

const CATEGORY_LABELS = Object.fromEntries(INQUIRY_CATEGORIES.map((item) => [item.value, item.label]));

/**
 * 처리 상태. BE utils/constants.js의 VALIDATION_RULES.INQUIRY.STATUSES와 짝이다(2026-09-28 사용자 결정).
 * 상태가 없는 옛 문의는 BE가 "new"로 채워 준다.
 */
export const INQUIRY_STATUSES = [
  { value: "new", label: "새 문의" },
  { value: "planned", label: "예정" },
  { value: "done", label: "완료" },
  { value: "onHold", label: "보류" },
  { value: "ignored", label: "무시" },
];

const WRITE_ERRORS = {
  notDeployed: "상태·삭제 API가 아직 배포되지 않았습니다. 백엔드부터 배포하세요.",
  notFound: "이미 삭제된 문의입니다. 목록을 새로 불러오세요.",
  failed: "저장하지 못했습니다. 잠시 후 다시 시도하세요.",
};

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));

/**
 * 문의함. 문의하기 양식으로 들어온 문의를 최신순으로 보여 준다.
 * 답장은 여기서 보내지 않고 메일 앱을 연다(받는 곳이 DB라 발송 기능이 없다).
 */
export default function InquiryFeed({ onOpenTable }) {
  const [state, setState] = useState({ loading: true, data: null });
  const paged = usePaged(state.data?.inquiries || [], 10);

  const patchRow = (id, fields) =>
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, inquiries: prev.data.inquiries.map((row) => (row.id === id ? { ...row, ...fields } : row)) },
    }));

  // 화면을 먼저 바꾸고, 저장에 실패하면 이전 상태로 되돌린다.
  const changeStatus = async (inquiry, status) => {
    const previous = inquiry.status || "new";
    patchRow(inquiry.id, { status, writeError: null });
    const res = await updateInquiryStatus(inquiry.id, status);
    if (res?.error) patchRow(inquiry.id, { status: previous, writeError: WRITE_ERRORS[res.error] });
  };

  const remove = async (inquiry) => {
    const answer = await Swal.fire({
      icon: "warning",
      title: "문의를 삭제할까요?",
      // 사용자가 쓴 글이라 html이 아니라 text로 넣는다.
      text: `「${inquiry.summary}」 삭제 후에는 복구할 수 없습니다.`,
      showCancelButton: true,
      confirmButtonText: "문의 삭제",
      cancelButtonText: "취소",
      confirmButtonColor: t.color.critical,
    });
    if (!answer?.isConfirmed) return;

    const res = await deleteInquiry(inquiry.id);
    if (res?.error && res.error !== "notFound") {
      patchRow(inquiry.id, { writeError: WRITE_ERRORS[res.error] });
      return;
    }
    // 이미 지워진 문의(notFound)도 목록에서 뺀다.
    setState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        total: Math.max(prev.data.total - 1, 0),
        inquiries: prev.data.inquiries.filter((row) => row.id !== inquiry.id),
      },
    }));
  };

  useEffect(() => {
    let cancelled = false;
    getInquiries(200).then((data) => {
      if (!cancelled) setState({ loading: false, data });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <Loading>
        <Spinner />
        문의를 불러오는 중입니다
      </Loading>
    );
  }

  const { data } = state;
  if (!data || data.error) {
    return (
      <Card>
        <Empty>
          {data?.error === "notDeployed"
            ? "문의함 API가 아직 배포되지 않았습니다. 백엔드부터 배포하세요."
            : "문의를 불러오지 못했습니다. 잠시 후 다시 시도하세요."}
        </Empty>
      </Card>
    );
  }

  return (
    <Stack>
      {data.total > data.inquiries.length && (
        <Meta>
          최근 {data.inquiries.length.toLocaleString()}건만 표시합니다. 전체 {data.total.toLocaleString()}건.
        </Meta>
      )}
      <Anchor ref={paged.anchor}>
        <Card style={{ padding: 0 }}>
          {data.inquiries.length === 0 ? (
            <Empty>아직 들어온 문의가 없습니다.</Empty>
          ) : (
            paged.rows.map((inquiry) => (
              <InquiryRow
                key={inquiry.id}
                inquiry={inquiry}
                onOpenTable={onOpenTable}
                onStatus={(status) => changeStatus(inquiry, status)}
                onDelete={() => remove(inquiry)}
              />
            ))
          )}
        </Card>
      </Anchor>
      <Pagination paged={paged} label="문의 쪽" />
    </Stack>
  );
}

function InquiryRow({ inquiry, onOpenTable, onStatus, onDelete }) {
  const { category, email, summary, detail, hope, context = {}, createdAt, writeError } = inquiry;
  const status = inquiry.status || "new";
  const replySubject = encodeURIComponent(`Re: [타임테이블 문의] ${summary}`);
  // 답장 받을 이메일은 선택이라 없을 수 있다.

  return (
    <Row>
      <Head>
        <Tag>{CATEGORY_LABELS[category] || category}</Tag>
        <Summary>{summary}</Summary>
        <Time>{formatDateTime(createdAt)}</Time>
      </Head>

      <Manage>
        <StatusSelect
          aria-label={`처리 상태: ${summary}`}
          value={status}
          $status={status}
          onChange={(event) => onStatus(event.target.value)}
        >
          {INQUIRY_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </StatusSelect>
        <DeleteButton type="button" onClick={onDelete} aria-label={`문의 삭제: ${summary}`}>
          <FiTrash2 size={13} aria-hidden="true" />
          삭제
        </DeleteButton>
      </Manage>
      {writeError && <WriteError role="alert">{writeError}</WriteError>}

      <Reply>
        {email ? (
          <>
            <span>{email}</span>
            <ReplyLink href={`mailto:${encodeURIComponent(email)}?subject=${replySubject}`}>
              <FiMail size={12} />
              메일 쓰기
            </ReplyLink>
          </>
        ) : (
          <NoEmail>이메일 없음 · 답장 불가</NoEmail>
        )}
      </Reply>

      <Block>
        <BlockLabel>자세한 내용</BlockLabel>
        <Body>{detail}</Body>
      </Block>
      {hope && (
        <Block>
          <BlockLabel>바라는 점</BlockLabel>
          <Body>{hope}</Body>
        </Block>
      )}

      <ContextList>
        <dt>참여 이름</dt>
        <dd>
          {context.name ? (
            <>
              {context.name}
              {context.tableId && (
                <InlineButton type="button" onClick={() => onOpenTable?.(context.tableId)}>
                  그 표 보기
                </InlineButton>
              )}
            </>
          ) : (
            "없음"
          )}
        </dd>
        <dt>누른 페이지</dt>
        <dd>
          {context.fromPath ? (
            <a href={context.fromPath} target="_blank" rel="noopener noreferrer">
              {context.fromPath} <FiExternalLink size={11} />
            </a>
          ) : (
            "없음"
          )}
        </dd>
        <dt>화면 · 시간대</dt>
        <dd>
          {context.viewport ? context.viewport.replace("x", " × ") : "-"} · {context.timeZone || "-"}
        </dd>
        <dt>브라우저</dt>
        <dd>{context.userAgent || "-"}</dd>
        <dt>방문자 ID</dt>
        <dd>{context.visitorId || "-"}</dd>
      </ContextList>
    </Row>
  );
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.space(3)};
`;

const Meta = styled.p`
  font-size: 0.8125rem;
  color: ${t.color.ink2};
`;

const Row = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${t.space(3)};
  padding: ${t.space(5)};

  @media ${t.media.mobile} {
    padding: ${t.space(4)};
  }
  border-bottom: 1px solid ${t.color.grid};

  &:last-child {
    border-bottom: none;
  }
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${t.space(2)};
`;

const Summary = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${t.color.ink};
  word-break: break-word;
`;

const Time = styled.span`
  margin-left: auto;
  font-size: 0.75rem;
  color: ${t.color.ink2};
  font-variant-numeric: tabular-nums;
`;

const Manage = styled.div`
  display: flex;
  align-items: center;
  gap: ${t.space(2)};
`;

// 새 문의만 굵게·진하게 보여 눈에 띄게 한다. 상태 이름이 글자로 보이므로 색만으로 구분하지 않는다.
const StatusSelect = styled(Select)`
  min-width: 112px;
  font-weight: ${(p) => (p.$status === "new" ? 600 : 500)};
  color: ${(p) => (p.$status === "done" || p.$status === "ignored" ? t.color.ink2 : t.color.ink)};
  border-color: ${(p) => (p.$status === "new" ? t.color.ink2 : t.color.border)};
`;

const DeleteButton = styled(Button)`
  color: ${t.color.critical};
  border-color: ${t.color.critical}40;

  &:hover:not(:disabled) {
    background: ${t.color.critical};
    border-color: ${t.color.critical};
    color: ${t.color.onDark};
    filter: none;
  }
`;

const WriteError = styled.p`
  font-size: 0.8125rem;
  color: ${t.color.critical};
`;

const Reply = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${t.space(3)};
  font-size: 0.8125rem;
  color: ${t.color.ink};
  word-break: break-all;
`;

const ReplyLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${t.space(1)};
  padding: ${t.space(1)} ${t.space(2)};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.sm};
  font-size: 0.75rem;
  color: ${t.color.ink};
  text-decoration: none;

  &:hover {
    background: ${t.color.surfaceSunken};
  }

  @media ${t.media.mobile} {
    min-height: 40px;
    padding: 0 ${t.space(3)};
  }
`;

const NoEmail = styled.span`
  color: ${t.color.ink2};
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.space(1)};
`;

const BlockLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.color.ink2};
`;

const Body = styled.p`
  font-size: 0.8125rem;
  line-height: 1.7;
  color: ${t.color.ink};
  white-space: pre-wrap;
  word-break: break-word;
`;

const ContextList = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${t.space(1)} ${t.space(4)};
  margin: 0;
  padding: ${t.space(3)};
  border-radius: ${t.radius.md};
  background: ${t.color.surfaceSunken};
  font-size: 0.75rem;

  dt {
    color: ${t.color.ink2};
    white-space: nowrap;
  }

  dd {
    margin: 0;
    color: ${t.color.ink};
    word-break: break-all;
  }

  a {
    color: ${t.color.ink};
    text-decoration: underline;
  }
`;

const InlineButton = styled.button`
  margin-left: ${t.space(2)};
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: ${t.color.ink};
  text-decoration: underline;
  cursor: pointer;
`;
