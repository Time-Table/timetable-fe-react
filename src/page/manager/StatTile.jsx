import styled from "@emotion/styled";
import { FiArrowUpRight, FiArrowDownRight, FiMinus } from "react-icons/fi";
import t from "./tokens";

const compact = (value) => {
  if (value === null || value === undefined) return "—";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

/**
 * 지표 타일. label · value · delta 구조를 따른다.
 *
 * delta는 색만으로 방향을 말하지 않는다. 적록색각에서 초록/빨강은 구분되지 않으므로
 * 화살표 아이콘과 부호를 항상 함께 붙인다.
 */
const StatTile = ({ label, value, delta, deltaLabel, higherIsBetter = true, hint }) => {
  const hasDelta = typeof delta === "number";
  const flat = hasDelta && delta === 0;
  const positive = hasDelta && delta > 0;
  const good = positive === higherIsBetter;

  const Icon = flat ? FiMinus : positive ? FiArrowUpRight : FiArrowDownRight;

  return (
    <Tile>
      <Label>{label}</Label>
      <Value>{compact(value)}</Value>
      <Foot>
        {hasDelta ? (
          <Delta $tone={flat ? "flat" : good ? "good" : "bad"}>
            <Icon size={13} />
            {flat ? "변화 없음" : `${positive ? "+" : ""}${delta}%`}
          </Delta>
        ) : (
          <Delta $tone="flat">
            <FiMinus size={13} />
            비교 불가
          </Delta>
        )}
        {deltaLabel && <Compare>{deltaLabel}</Compare>}
      </Foot>
      {hint && <Hint>{hint}</Hint>}
    </Tile>
  );
};

const Tile = styled.div`
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.lg};
  box-shadow: ${t.shadow.card};
  padding: ${t.space(5)};
`;

const Label = styled.p`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${t.color.ink2};
`;

/* 큰 숫자는 비례 자간(기본값)을 쓴다. tabular-nums는 표에서만. */
const Value = styled.p`
  margin-top: ${t.space(2)};
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: ${t.color.ink};
`;

const Foot = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${t.space(2)};
  margin-top: ${t.space(3)};
`;

const Delta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${(p) =>
    p.$tone === "good" ? t.color.goodText : p.$tone === "bad" ? t.color.critical : t.color.muted};
`;

const Compare = styled.span`
  font-size: 0.6875rem;
  color: ${t.color.muted};
`;

const Hint = styled.p`
  margin-top: ${t.space(2)};
  font-size: 0.6875rem;
  line-height: 1.5;
  color: ${t.color.muted};
`;

export default StatTile;
