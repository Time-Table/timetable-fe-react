import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import t from "./tokens";

/** 컨테이너 실제 폭을 읽어 SVG를 그린다. viewBox 늘리기로 처리하면 선 두께가 왜곡된다. */
const useWidth = (ref) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return width;
};

/** 축 눈금이 1, 2, 5의 배수로 떨어지게 만든다. */
const niceMax = (max) => {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
};

const PAD = { top: 16, right: 16, bottom: 26, left: 44 };
const PLOT_HEIGHT = 150;

/**
 * 일별 추이 선 그래프. 지표마다 자릿수가 달라서 한 그래프에 겹치지 않고
 * 지표당 하나씩(스몰 멀티플) 그린다. 축이 두 개인 그래프는 없는 상관관계를 지어낸다.
 */
export const TrendChart = ({ series, valueKey, color = t.color.series1, label }) => {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [hover, setHover] = useState(null);

  const values = series.map((row) => row[valueKey] || 0);
  const max = niceMax(Math.max(...values, 0));
  const innerW = Math.max(width - PAD.left - PAD.right, 10);
  const height = PLOT_HEIGHT + PAD.top + PAD.bottom;

  const x = (i) => PAD.left + (series.length <= 1 ? innerW / 2 : (innerW * i) / (series.length - 1));
  const y = (v) => PAD.top + PLOT_HEIGHT - (v / max) * PLOT_HEIGHT;

  const linePath = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const areaPath = values.length
    ? `${linePath} L${x(values.length - 1)},${PAD.top + PLOT_HEIGHT} L${x(0)},${
        PAD.top + PLOT_HEIGHT
      } Z`
    : "";

  const lastIndex = values.length - 1;
  const ticks = [0, max / 2, max];

  const handleMove = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - box.left - PAD.left;
    const ratio = innerW > 0 ? offset / innerW : 0;
    const index = Math.round(ratio * (series.length - 1));
    setHover(Math.min(Math.max(index, 0), lastIndex));
  };

  return (
    <ChartWrap ref={wrapRef}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`${label} 일별 추이`}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke={t.color.grid}
                strokeWidth="1"
              />
              <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" className="tick">
                {Math.round(tick).toLocaleString()}
              </text>
            </g>
          ))}

          <path d={areaPath} fill={color} opacity="0.1" />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 끝점만 직접 표시한다. 모든 점에 값을 달면 읽히지 않는다. */}
          {lastIndex >= 0 && (
            <circle
              cx={x(lastIndex)}
              cy={y(values[lastIndex])}
              r="4"
              fill={color}
              stroke={t.color.surface}
              strokeWidth="2"
            />
          )}

          {hover !== null && (
            <>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={PAD.top + PLOT_HEIGHT}
                stroke={t.color.axis}
                strokeWidth="1"
              />
              <circle
                cx={x(hover)}
                cy={y(values[hover])}
                r="4"
                fill={color}
                stroke={t.color.surface}
                strokeWidth="2"
              />
            </>
          )}

          {[0, Math.floor(lastIndex / 2), lastIndex]
            .filter((i, idx, arr) => i >= 0 && arr.indexOf(i) === idx)
            .map((i) => (
              <text
                key={i}
                x={x(i)}
                y={height - 8}
                textAnchor={i === 0 ? "start" : i === lastIndex ? "end" : "middle"}
                className="tick"
              >
                {series[i]?.date.slice(5)}
              </text>
            ))}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={PLOT_HEIGHT}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}

      {hover !== null && series[hover] && (
        <Tooltip style={{ left: Math.min(Math.max(x(hover), 60), width - 60) }}>
          <strong>{series[hover].date}</strong>
          <span>
            {label} {values[hover].toLocaleString()}
          </span>
        </Tooltip>
      )}
    </ChartWrap>
  );
};

/**
 * 가로 막대 목록. 한 계열이므로 색은 하나만 쓰고,
 * 값은 막대 끝에 직접 붙여 툴팁 없이도 읽히게 한다.
 */
export const BarList = ({ items, unit = "명", color = t.color.series1, emptyText }) => {
  if (!items?.length) return <BarEmpty>{emptyText || "데이터가 없습니다."}</BarEmpty>;

  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <BarRows>
      {items.map((item) => (
        <BarRow key={item.label}>
          <BarLabel title={item.label}>{item.label}</BarLabel>
          <BarTrack>
            <BarFill style={{ width: `${Math.max((item.count / max) * 100, 1.5)}%`, background: color }} />
          </BarTrack>
          <BarValue>
            {item.count.toLocaleString()}
            {unit}
            {typeof item.percent === "number" && <small>{item.percent}%</small>}
          </BarValue>
        </BarRow>
      ))}
    </BarRows>
  );
};

const ChartWrap = styled.div`
  position: relative;
  width: 100%;

  svg {
    display: block;
  }
  .tick {
    fill: ${t.color.muted};
    font-size: 10px;
    font-variant-numeric: tabular-nums;
  }
  rect {
    cursor: crosshair;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  border-radius: ${t.radius.sm};
  background: ${t.color.sidebar};
  color: ${t.color.onDark};
  font-size: 0.6875rem;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: ${t.shadow.raised};

  strong {
    font-weight: 600;
  }
  span {
    color: ${t.color.onDarkMuted};
    font-variant-numeric: tabular-nums;
  }
`;

const BarRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.space(3)};
`;

const BarRow = styled.div`
  display: grid;
  grid-template-columns: minmax(70px, 22%) 1fr auto;
  align-items: center;
  gap: ${t.space(3)};
`;

const BarLabel = styled.span`
  font-size: 0.75rem;
  color: ${t.color.ink2};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BarTrack = styled.div`
  height: 10px;
  border-radius: 999px;
  background: ${t.color.surfaceSunken};
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
`;

const BarValue = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.color.ink};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  small {
    margin-left: ${t.space(2)};
    font-weight: 400;
    color: ${t.color.muted};
  }
`;

const BarEmpty = styled.p`
  padding: ${t.space(6)} 0;
  text-align: center;
  font-size: 0.8125rem;
  color: ${t.color.muted};
`;
