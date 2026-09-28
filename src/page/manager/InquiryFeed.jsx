import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { FiExternalLink, FiMail } from "react-icons/fi";
import { getInquiries } from "../../api/admin";
import { INQUIRY_CATEGORIES } from "../contact/inquiry";
import t from "./tokens";
import { Card, Empty, Loading, Spinner, Tag } from "./ui";

const CATEGORY_LABELS = Object.fromEntries(INQUIRY_CATEGORIES.map((item) => [item.value, item.label]));

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
      <Card style={{ padding: 0 }}>
        {data.inquiries.length === 0 ? (
          <Empty>아직 들어온 문의가 없습니다.</Empty>
        ) : (
          data.inquiries.map((inquiry) => (
            <InquiryRow key={inquiry.id} inquiry={inquiry} onOpenTable={onOpenTable} />
          ))
        )}
      </Card>
    </Stack>
  );
}

function InquiryRow({ inquiry, onOpenTable }) {
  const { category, email, summary, detail, hope, context = {}, createdAt } = inquiry;
  const replySubject = encodeURIComponent(`Re: [타임테이블 문의] ${summary}`);
  // 답장 받을 이메일은 선택이라 없을 수 있다.

  return (
    <Row>
      <Head>
        <Tag>{CATEGORY_LABELS[category] || category}</Tag>
        <Summary>{summary}</Summary>
        <Time>{formatDateTime(createdAt)}</Time>
      </Head>

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
