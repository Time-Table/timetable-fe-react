import styled from "@emotion/styled";
import t from "./tokens";

/** 콘솔 전반에서 재사용하는 표면·타이포 프리미티브 */

const mobile = `@media ${t.media.mobile}`;

export const Card = styled.section`
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.lg};
  box-shadow: ${t.shadow.card};
  padding: ${t.space(6)};

  ${mobile} {
    padding: ${t.space(4)};
  }
`;

export const CardTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${t.color.ink};
  letter-spacing: -0.01em;

  ${mobile} {
    font-size: 0.9375rem;
  }
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
  margin-bottom: ${t.space(3)};

  ${mobile} {
    align-items: center;
    gap: ${t.space(2)};
    margin-bottom: ${t.space(2)};
  }
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
  line-height: 1.6;
  color: ${t.color.ink2};
`;

/**
 * $mobileCols: 모바일에서 한 줄에 놓을 칸 수. 지표 타일처럼 짧은 카드는 2를 줘서
 * 한 줄에 하나씩 길게 쌓이지 않게 한다.
 */
export const Grid = styled.div`
  display: grid;
  gap: ${t.space(4)};
  grid-template-columns: repeat(auto-fit, minmax(${(p) => p.$min || "260px"}, 1fr));

  ${mobile} {
    gap: ${t.space(2)};
    ${(p) => (p.$mobileCols ? `grid-template-columns: repeat(${p.$mobileCols}, minmax(0, 1fr));` : "")}
  }
`;

/** 기간 선택 등 세그먼트 컨트롤. 차트 위 한 줄에만 둔다. 모바일에서는 폭을 꽉 채운다. */
export const Segmented = styled.div`
  display: inline-flex;
  gap: ${t.space(1)};
  padding: ${t.space(1)};
  background: ${t.color.surfaceSunken};
  border-radius: ${t.radius.md};

  ${mobile} {
    display: flex;
    width: 100%;
    box-sizing: border-box;

    & > * {
      flex: 1;
    }
  }
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
  white-space: nowrap;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    color: ${t.color.ink};
  }
  &:focus-visible {
    outline: 2px solid ${t.color.series1};
    outline-offset: 1px;
  }

  ${mobile} {
    min-height: 40px;
    padding: ${t.space(2)};
  }
`;

// 포커스 링은 경계용 3:1만 넘으면 되므로 series1(4.30:1)을 그대로 쓴다. 25% 알파는 거의 안 보였다.
const focusRing = `
  &:focus-visible {
    outline: 2px solid ${t.color.series1};
    outline-offset: 1px;
  }
`;

// 입력 칸은 모바일에서 16px 이상이어야 iOS가 포커스할 때 화면을 확대하지 않는다.
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
    border-color: ${t.color.series1};
  }
  ${focusRing}

  ${mobile} {
    min-height: ${t.touch};
    font-size: 1rem;
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

  ${focusRing}

  ${mobile} {
    min-height: ${t.touch};
    font-size: 1rem;
  }
`;

/**
 * $tone="critical": 0값·문제 행 표시. 배경을 surface로 두는 이유는 critical 글자가
 * surfaceSunken 위에서 4.25:1로 AA에 못 미치기 때문이다(surface 위 4.68:1).
 * 색이 유일한 단서가 되지 않도록 호출부에서 아이콘을 함께 넣는다.
 */
export const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${t.space(1)};
  padding: ${t.space(1)} ${t.space(2)};
  border: 1px solid ${(p) => (p.$tone === "critical" ? `${t.color.critical}40` : t.color.border)};
  border-radius: 999px;
  background: ${(p) => (p.$tone === "critical" ? t.color.surface : t.color.surfaceSunken)};
  font-size: 0.75rem;
  font-weight: 500;
  color: ${(p) => (p.$tone === "critical" ? t.color.critical : t.color.ink2)};
  white-space: nowrap;
`;

export const Empty = styled.div`
  padding: ${t.space(12)} ${t.space(4)};
  text-align: center;
  font-size: 0.8125rem;
  color: ${t.color.muted};

  ${mobile} {
    padding: ${t.space(8)} ${t.space(4)};
  }
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

/**
 * 표 안의 숫자는 세로로 자릿수가 맞아야 읽힌다.
 *
 * $stack: 모바일에서 행 하나를 카드 한 장으로 바꾼다(아래 stackRows). 가로 스크롤 안에
 * 관리 버튼이 숨어 있던 문제(2026-09-28)를 없애려는 것이다. 칸은 하나도 빼지 않는다.
 */
export const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  /* 좁은 화면에서 칸을 욱여넣는 대신 감싼 카드 안에서 가로로 스크롤시킨다.
     $compact는 카드 반쪽에 들어가는 2~5열 표용이다. */
  min-width: ${(p) => (p.$compact ? 0 : "660px")};

  th {
    padding: ${t.space(3)} ${t.space(4)};
    text-align: left;
    font-size: 0.75rem;
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
  td.nowrap {
    white-space: nowrap;
  }

  tbody tr:hover td {
    background: ${t.color.surfaceSunken};
  }
  tbody tr:last-child td {
    border-bottom: none;
  }

  /* $dense: 첫 화면에 여러 줄이 보여야 하는 일별 표. 줄 높이 45→37px. */
  ${(p) => (p.$dense ? `th, td { padding-top: ${t.space(2)}; padding-bottom: ${t.space(2)}; }` : "")}

  ${mobile} {
    th,
    td {
      padding: ${(p) => (p.$dense ? t.space(2) : t.space(3))} ${t.space(2)};
    }
    th:first-of-type,
    td:first-of-type {
      padding-left: ${t.space(4)};
    }
    th:last-of-type,
    td:last-of-type {
      padding-right: ${t.space(4)};
    }
  }

  ${(p) => (p.$stack ? stackRows : "")}
`;

/**
 * 모바일 카드: 첫 줄에 제목(td.title)과 버튼(td.actions), 그 아래에 나머지 칸을 글줄처럼 이어 쓴다.
 * 칸 이름이 필요한 칸만 data-label을 붙여 값 앞에 작게 보인다("생성일 2026-09-28 04:54").
 * 칸마다 한 줄씩 쓰면 카드가 길어져 표보다 스크롤이 늘었다(2026-09-28 실측 1.7→4.4화면).
 */
const stackRows = `
  ${mobile} {
    min-width: 0;

    thead {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    tbody {
      display: block;
    }
    tr {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: ${t.space(2)} ${t.space(3)};
      padding: ${t.space(3)} ${t.space(4)};
      border-bottom: 1px solid ${t.color.grid};
    }
    tbody tr:last-child {
      border-bottom: none;
    }
    td,
    td:first-of-type,
    td:last-of-type {
      display: block;
      order: 2;
      padding: 0;
      border: none;
    }
    td.title {
      order: 0;
      flex: 1 1 0;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    td.actions {
      order: 1;
      flex: none;
    }
    /* 제목 줄 다음부터 새 줄에서 시작하게 한다. */
    tr::after {
      content: "";
      order: 1;
      flex-basis: 100%;
      height: 0;
      margin-top: -${t.space(2)};
    }
    td[data-label]::before {
      content: attr(data-label);
      margin-right: ${t.space(1)};
      font-family: ${t.font.sans};
      font-size: 0.75rem;
      font-weight: 500;
      color: ${t.color.muted};
    }
    tbody tr:hover td {
      background: none;
    }
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
  ${focusRing}

  ${mobile} {
    width: ${t.touch};
    height: ${t.touch};
  }
`;

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${t.space(1)};
  padding: ${t.space(2)} ${t.space(4)};
  border-radius: ${t.radius.md};
  border: 1px solid ${(p) => (p.$variant === "primary" ? t.color.accent : t.color.border)};
  background: ${(p) => (p.$variant === "primary" ? t.color.accent : t.color.surface)};
  color: ${(p) => (p.$variant === "primary" ? t.color.onDark : t.color.ink2)};
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: 0.15s ease;

  &:hover:not(:disabled) {
    filter: brightness(0.97);
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  ${focusRing}

  ${mobile} {
    min-height: ${t.touch};
  }
`;
