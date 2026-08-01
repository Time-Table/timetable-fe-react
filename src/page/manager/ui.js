import styled from "@emotion/styled";
import t from "./tokens";

/** 콘솔 전반에서 재사용하는 표면·타이포 프리미티브 */

export const Card = styled.section`
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.lg};
  box-shadow: ${t.shadow.card};
  padding: ${t.space(6)};

  @media (max-width: 640px) {
    padding: ${t.space(4)};
  }
`;

export const CardTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${t.color.ink};
  letter-spacing: -0.01em;
`;

export const CardSubtitle = styled.p`
  margin-top: ${t.space(1)};
  font-size: 0.75rem;
  line-height: 1.6;
  color: ${t.color.muted};
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${t.space(3)};
  margin-bottom: ${t.space(5)};
`;

export const SectionTitle = styled.h2`
  font-size: 1.0625rem;
  font-weight: 600;
  color: ${t.color.ink};
  letter-spacing: -0.02em;
`;

export const SectionCaption = styled.p`
  margin-top: ${t.space(1)};
  font-size: 0.8125rem;
  color: ${t.color.ink2};
`;

export const Grid = styled.div`
  display: grid;
  gap: ${t.space(4)};
  grid-template-columns: repeat(auto-fit, minmax(${(p) => p.$min || "260px"}, 1fr));
`;

/** 기간 선택 등 세그먼트 컨트롤. 차트 위 한 줄에만 둔다. */
export const Segmented = styled.div`
  display: inline-flex;
  gap: ${t.space(1)};
  padding: ${t.space(1)};
  background: ${t.color.surfaceSunken};
  border-radius: ${t.radius.md};
`;

export const SegmentedItem = styled.button`
  padding: ${t.space(2)} ${t.space(4)};
  border: none;
  border-radius: ${t.radius.sm};
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  color: ${(p) => (p.$active ? t.color.ink : t.color.ink2)};
  background: ${(p) => (p.$active ? t.color.surface : "transparent")};
  box-shadow: ${(p) => (p.$active ? t.shadow.card : "none")};
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    color: ${t.color.ink};
  }
`;

export const Field = styled.input`
  width: 100%;
  padding: ${t.space(2)} ${t.space(3)};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.md};
  background: ${t.color.surface};
  font-family: inherit;
  font-size: 0.8125rem;
  color: ${t.color.ink};
  box-sizing: border-box;

  &::placeholder {
    color: ${t.color.muted};
  }
  &:focus {
    outline: 2px solid ${t.color.series1}40;
    outline-offset: 1px;
    border-color: ${t.color.series1};
  }
`;

export const Select = styled.select`
  padding: ${t.space(2)} ${t.space(3)};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.md};
  background: ${t.color.surface};
  font-family: inherit;
  font-size: 0.8125rem;
  color: ${t.color.ink};
  cursor: pointer;

  &:focus {
    outline: 2px solid ${t.color.series1}40;
    outline-offset: 1px;
  }
`;

export const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${t.space(1)};
  padding: ${t.space(1)} ${t.space(2)};
  border: 1px solid ${t.color.border};
  border-radius: 999px;
  background: ${t.color.surfaceSunken};
  font-size: 0.6875rem;
  font-weight: 500;
  color: ${t.color.ink2};
  white-space: nowrap;
`;

export const Empty = styled.div`
  padding: ${t.space(12)} ${t.space(4)};
  text-align: center;
  font-size: 0.8125rem;
  color: ${t.color.muted};
`;

export const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border: 2px solid ${t.color.grid};
  border-top-color: ${t.color.series1};
  border-radius: 50%;
  animation: adminspin 0.7s linear infinite;

  @keyframes adminspin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const Loading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${t.space(3)};
  padding: ${t.space(16)} 0;
  font-size: 0.8125rem;
  color: ${t.color.muted};
`;

/** 표 안의 숫자는 세로로 자릿수가 맞아야 읽힌다. */
export const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  /* 좁은 화면에서 칸을 욱여넣는 대신 감싼 카드 안에서 가로로 스크롤시킨다. */
  min-width: 660px;

  th {
    padding: ${t.space(3)} ${t.space(4)};
    text-align: left;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${t.color.muted};
    border-bottom: 1px solid ${t.color.border};
    white-space: nowrap;
  }

  td {
    padding: ${t.space(3)} ${t.space(4)};
    border-bottom: 1px solid ${t.color.grid};
    color: ${t.color.ink2};
    vertical-align: middle;
  }

  td.num {
    font-variant-numeric: tabular-nums;
  }
  td.strong {
    font-weight: 600;
    color: ${t.color.ink};
  }
  td.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.75rem;
    color: ${t.color.muted};
  }

  tbody tr:hover td {
    background: ${t.color.surfaceSunken};
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.sm};
  background: ${t.color.surface};
  color: ${(p) => p.$color || t.color.ink2};
  cursor: pointer;
  transition: 0.15s ease;

  &:hover {
    background: ${(p) => p.$color || t.color.ink2};
    border-color: ${(p) => p.$color || t.color.ink2};
    color: ${t.color.onDark};
  }
`;

export const Button = styled.button`
  padding: ${t.space(2)} ${t.space(4)};
  border-radius: ${t.radius.md};
  border: 1px solid ${(p) => (p.$variant === "primary" ? t.color.series1 : t.color.border)};
  background: ${(p) => (p.$variant === "primary" ? t.color.series1 : t.color.surface)};
  color: ${(p) => (p.$variant === "primary" ? t.color.onDark : t.color.ink2)};
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: 0.15s ease;

  &:hover:not(:disabled) {
    filter: brightness(0.97);
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
