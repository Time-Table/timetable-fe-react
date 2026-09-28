import { useRef, useState } from "react";
import styled from "@emotion/styled";
import t from "./tokens";
import { Button } from "./ui";

/**
 * 이미 받아 둔 목록을 쪽으로 나눠 그린다. 서버 요청은 그대로다(2026-09-28, 화면만 짧게).
 * resetKey(검색어·정렬·필터를 이은 문자열)가 바뀌면 1쪽으로 돌아간다.
 * 그래도 목록이 줄어 쪽 수가 모자라면 마지막 쪽으로 자른다(삭제 직후 등).
 * 쪽을 넘기면 목록 맨 위(anchor)로 올려 보낸다.
 */
export const usePaged = (items, perPage, resetKey = "") => {
  const [page, setPage] = useState(1);
  const [key, setKey] = useState(resetKey);
  const anchor = useRef(null);
  if (key !== resetKey) {
    setKey(resetKey);
    setPage(1);
  }
  const pages = Math.max(Math.ceil(items.length / perPage), 1);
  const current = Math.min(page, pages);

  return {
    page: current,
    pages,
    rows: items.slice((current - 1) * perPage, current * perPage),
    anchor,
    go: (next) => {
      setPage(next);
      anchor.current?.scrollIntoView?.({ block: "start" });
    },
  };
};

export default function Pagination({ paged, label }) {
  if (paged.pages <= 1) return null;

  return (
    <Bar aria-label={label}>
      <Button disabled={paged.page === 1} onClick={() => paged.go(paged.page - 1)}>
        이전
      </Button>
      <span>
        {paged.page} / {paged.pages}
      </span>
      <Button disabled={paged.page === paged.pages} onClick={() => paged.go(paged.page + 1)}>
        다음
      </Button>
    </Bar>
  );
}

const Bar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${t.space(4)};
  font-size: 0.8125rem;
  color: ${t.color.ink2};
  font-variant-numeric: tabular-nums;
`;

/** 쪽을 넘길 때 스크롤이 멈출 자리. 위쪽 탭 줄에 가리지 않게 여백을 둔다. */
export const Anchor = styled.div`
  scroll-margin-top: 64px;
`;
