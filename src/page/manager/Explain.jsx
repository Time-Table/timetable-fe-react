import { useId, useState } from "react";
import styled from "@emotion/styled";
import { FiInfo, FiChevronDown } from "react-icons/fi";
import t from "./tokens";

const isMobile = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(t.media.mobile).matches;

/**
 * 늘 같은 설명문을 접었다 폈다 한다. 모바일은 접은 채로, PC는 편 채로 시작한다.
 * 접혀도 내용은 DOM에 남긴다(hidden). 문구를 지우거나 줄이지 않는다는 2026-09-28 결정.
 * 실패·미배포·보관 기간 같은 상태 경고는 여기에 넣지 않는다. 판단에 필요해서 늘 보여야 한다.
 */
export default function Explain({ label = "설명", children }) {
  const [open, setOpen] = useState(() => !isMobile());
  const id = useId();

  return (
    <div>
      <Toggle type="button" data-explain aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        <FiInfo size={13} aria-hidden="true" />
        {label}
        <Chevron aria-hidden="true" $open={open}>
          <FiChevronDown size={13} />
        </Chevron>
      </Toggle>
      <Body id={id} hidden={!open}>
        {children}
      </Body>
    </div>
  );
}

const Toggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${t.space(1)};
  padding: ${t.space(1)} 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${t.color.ink2};
  cursor: pointer;

  &:hover {
    color: ${t.color.ink};
  }
  &:focus-visible {
    outline: 2px solid ${t.color.series1};
    outline-offset: 2px;
    border-radius: ${t.radius.sm};
  }

  @media ${t.media.mobile} {
    min-height: 40px;
  }
`;

// react-icons는 받은 속성을 svg에 그대로 넘기므로 $open을 감싼 span에 둔다.
const Chevron = styled.span`
  display: inline-flex;
  transition: transform 0.2s ease;
  transform: ${(p) => (p.$open ? "rotate(180deg)" : "none")};
`;

const Body = styled.div`
  margin-top: ${t.space(1)};
`;
