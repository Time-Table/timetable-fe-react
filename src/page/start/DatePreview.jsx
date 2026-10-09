import { useMemo, useState } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import theme from "../../theme";
import BIcon from "../timetable/b/BIcon";
import { buildDateMock, MOCK_MEMBERS } from "./mockPreview";

/**
 * 랜딩(v1·v2) 미리보기의 날짜 투표 모양(2026-10-09 사람 결정, 시안 하네스 캔버스 Main·PCLandingV1·V2).
 * 시간 범위 스위치를 끄면(날짜만) 시간표 대신 이 달력을 보여 준다. 실제 날짜 투표 표(새 화면 B 달력)와 같은 규칙이다.
 * - 칸 진하기는 그날 되는 사람 ÷ 참여자 수(0.12 + 0.88 × 비율). 비율 숫자는 쓰지 않는다.
 * - 가장 많이 모이는 날에 불꽃 동그라미와 반짝임, 처음에는 "눌러서 명단 보기" 안내.
 * - 그 달이 아닌 칸은 연한 회색으로 비우고, 후보가 아닌 날은 회색 칸·연한 날짜(누를 수 없음).
 * - 넓은 화면(1280px 이상)은 오른쪽에 새 화면식 옆 칸(기간·제목·1위 날·참여자)을 둔다.
 * 후보가 여러 달이면 1위 날이 있는 달 한 장만 그린다(미리보기 상자 높이를 지킨다). 칸을 누르면 달력 아래에 명단이 나온다.
 */

const WEEK = ["월", "화", "수", "목", "금", "토", "일"];
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDay = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`;
const dot = (d) => `${d.getMonth() + 1}.${d.getDate()}`;
const fillOf = (count, total) => (count ? 0.12 + 0.88 * (count / total) : 0);

/** 그 달의 모든 주(월요일 시작). [{ key, date, inMonth }] × 7 */
const monthCells = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const last = new Date(year, month + 1, 0);
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)));
  const cells = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    cells.push({ key: keyOf(d), date: new Date(d), inMonth: d.getMonth() === month });
  }
  return cells;
};

export default function DatePreview({ days, title, headingId, summaryId, onOpen }) {
  const mock = useMemo(() => buildDateMock(days), [days]);
  const [openKey, setOpenKey] = useState(null);
  const [tipDismissed, setTipDismissed] = useState(false);

  if (!mock) {
    return (
      <>
        <Empty id={summaryId}>후보 날짜를 고르면 날짜 투표 미리보기가 보여요.</Empty>
        <Sr as="h3" id={headingId}>
          미리보기
        </Sr>
      </>
    );
  }

  const { counts, total, maxCount, hero } = mock;
  const cells = monthCells(hero.date.getFullYear(), hero.date.getMonth());
  const isGold = (key) => maxCount >= 2 && (counts[key] || []).length === maxCount;
  const open = openKey && counts[openKey] ? openKey : null;
  const openDay = open ? days.find((d) => d.key === open) : null;
  const can = open ? counts[open] : [];
  const cannot = open ? MOCK_MEMBERS.filter((m) => !can.includes(m)) : [];
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const range = days.length === 1 ? dot(first) : `${dot(first)} – ${dot(last)}`;

  const toggle = (key) => {
    setTipDismissed(true);
    if (openKey !== key) onOpen?.();
    setOpenKey((v) => (v === key ? null : key));
  };

  return (
    <Layout>
      <Pane>
        <Heading id={headingId} data-clarity-mask="true">
          <TabClearance aria-hidden="true" />
          {title} <em>타임테이블</em>
        </Heading>
        <MonthName>{`${hero.date.getFullYear()}년 ${hero.date.getMonth() + 1}월`}</MonthName>
        <Grid role="group" aria-label="예시 날짜 투표 — 날짜를 누르면 그날 되는 사람이 나옵니다">
          {WEEK.map((w, i) => (
            <Head key={w} aria-hidden="true" $tone={i === 5 ? "sat" : i === 6 ? "sun" : null}>
              {w}
            </Head>
          ))}
          {cells.map((c) => {
            if (!c.inMonth) return <Cell key={c.key} $kind="out" aria-hidden="true" />;
            const members = counts[c.key];
            if (!members) {
              return (
                <Cell key={c.key} $kind="off" aria-hidden="true">
                  <Num>{c.date.getDate()}</Num>
                </Cell>
              );
            }
            const gold = isGold(c.key);
            return (
              <Cell
                key={c.key}
                as="button"
                type="button"
                $kind="on"
                $open={open === c.key}
                aria-expanded={open === c.key}
                aria-label={`${fmtDay(c.date)} · ${members.length}명 가능${gold ? ", 가장 많이 모여요" : ""}`}
                onClick={() => toggle(c.key)}
              >
                <Fill style={{ opacity: fillOf(members.length, total).toFixed(2) }} />
                {gold && <Shine aria-hidden="true" />}
                <Num>{c.date.getDate()}</Num>
                {gold && (
                  <Flame aria-hidden="true">
                    <BIcon name="gold" size={11} />
                  </Flame>
                )}
                {gold && !tipDismissed && !open && <Tip aria-hidden="true">눌러서 명단 보기</Tip>}
              </Cell>
            );
          })}
        </Grid>
        <Legend aria-hidden="true">
          <BIcon name="user" size={14} />
          <Gauge />
          <BIcon name="users" size={14} />
        </Legend>
        {openDay && (
          <Names role="status" aria-live="polite">
            <NamesDay>
              <BIcon name="cal" size={13} />
              {fmtDay(openDay.date)}
            </NamesDay>
            <NamesRow>
              <Mark $can>
                <BIcon name="check" size={13} />
                <b>{can.length}</b>
                <Sr>명 돼요</Sr>
              </Mark>
              {can.map((m) => (
                <Name key={m}>{m}</Name>
              ))}
            </NamesRow>
            <NamesRow>
              <Mark>
                <BIcon name="x" size={13} />
                <b>{cannot.length}</b>
                <Sr>명 안 돼요</Sr>
              </Mark>
              {cannot.length ? cannot.map((m) => <Name key={m} $no>{m}</Name>) : <Name $no>없음</Name>}
            </NamesRow>
          </Names>
        )}
        <Sr as="p" id={summaryId}>
          {`예시 데이터입니다. 날짜만 고르는 표예요. 가장 많이 모이는 날은 ${fmtDay(hero.date)}, ${total}명 중 ${maxCount}명 가능이에요.`}
        </Sr>
      </Pane>

      <Side aria-hidden="true">
        <Fact>
          <BIcon name="cal" size={13} />
          {range}
        </Fact>
        <SideTitle data-clarity-mask="true">{title}</SideTitle>
        <Best>
          <BestIcon>
            <BIcon name="gold" size={16} />
          </BestIcon>
          <b>{fmtDay(hero.date)}</b>
          <BIcon name="right" size={15} />
        </Best>
        <SideLabel>참여자</SideLabel>
        <Chips>
          <Chip $on>
            <BIcon name="users" size={13} />
            {`전체 ${total}`}
          </Chip>
          {MOCK_MEMBERS.map((m) => (
            <Chip key={m}>
              <BIcon name="user" size={13} />
              {m}
            </Chip>
          ))}
        </Chips>
      </Side>
    </Layout>
  );
}

const XL = `@media (min-width: ${theme.breakpoint.xl})`;
const LG = `@media (min-width: ${theme.breakpoint.lg})`;
const shineMove = keyframes`
  0% { opacity: 0; transform: translateX(-100%) skewX(-20deg); }
  50% { opacity: 0.45; }
  100% { opacity: 0; transform: translateX(300%) skewX(-20deg); }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: ${theme.space[4]};
  padding: ${theme.space[3]};

  @media (min-width: ${theme.breakpoint.sm}) {
    padding: ${theme.space[5]};
  }
  ${LG} {
    flex: 1 1 auto;
    align-items: stretch;
  }
  ${XL} {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  }
`;

const Pane = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  ${LG} {
    justify-content: center;
    gap: 8px;
  }
`;

const TabClearance = styled.span`
  float: left;
  width: 42px;
  height: 10px;
`;

const Heading = styled.p`
  margin: 0;
  padding: 0 ${theme.space[8]};
  text-align: center;
  font-family: "Pretendard-SemiBold";
  font-size: ${theme.font.size.body};
  color: ${theme.text.primary};

  em {
    font-style: normal;
    color: ${theme.color.primary};
  }
`;

const MonthName = styled.p`
  margin: 2px 0 0;
  padding: 0 2px;
  font-family: ${theme.font.family.extraBold};
  font-size: 13px;
  color: ${theme.text.gamma[100]};

  ${LG} {
    font-size: 14px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
`;

const Head = styled.span`
  padding: 2px 0 4px;
  border-bottom: 1px solid ${theme.text.gamma[900]};
  text-align: center;
  font-family: ${theme.font.family.medium};
  font-size: 11px;
  color: ${({ $tone }) => ($tone === "sat" ? theme.color.weekdaySat : $tone === "sun" ? theme.color.primaryText : theme.text.gamma[400])};

  ${LG} {
    font-size: 12px;
  }
`;

const Cell = styled.span`
  position: relative;
  z-index: ${({ $open }) => ($open ? 3 : "auto")};
  height: 32px;
  margin: 0;
  padding: 0;
  border: 0;
  border-right: 1px solid ${theme.text.gamma[900]};
  border-bottom: 1px solid ${theme.text.gamma[900]};
  background: ${({ $kind }) => ($kind === "off" ? theme.text.gamma[900] : $kind === "out" ? "#F7F7F7" : "#fff")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ $kind }) => ($kind === "off" ? theme.font.family.medium : theme.font.family.bold)};
  font-size: 12px;
  color: ${({ $kind }) => ($kind === "off" ? theme.text.gamma[700] : theme.text.gamma[100])};
  box-shadow: ${({ $open }) => ($open ? `inset 0 0 0 2px ${theme.text.gamma[100]}` : "none")};
  cursor: ${({ $kind }) => ($kind === "on" ? "pointer" : "default")};
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: -2px;
  }

  ${LG} {
    height: 44px;
    font-size: 14px;
  }
`;

const Fill = styled.span`
  position: absolute;
  inset: 0;
  background: ${theme.color.primary};
  pointer-events: none;
`;

const Shine = styled.span`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 100%;
    opacity: 0;
    background: rgba(255, 255, 255, 0.6);
    animation: ${shineMove} 1.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
    }
  }
`;

const Num = styled.span`
  position: relative;
`;

const Flame = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
  color: ${theme.color.primaryText};
  display: flex;
  align-items: center;
  justify-content: center;

  ${LG} {
    top: 3px;
    right: 3px;
    width: 16px;
    height: 16px;
  }
`;

const Tip = styled.span`
  position: absolute;
  bottom: 100%;
  left: 50%;
  z-index: 4;
  transform: translateX(-50%);
  margin-bottom: 5px;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${theme.text.gamma[100]};
  color: #fff;
  font-family: ${theme.font.family.semiBold};
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;

  ${LG} {
    margin-bottom: 6px;
    padding: 5px 9px;
    font-size: 12px;
  }
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 2px;
  color: ${theme.text.gamma[500]};
`;

const Gauge = styled.span`
  width: 84px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, #fff, ${theme.color.primary});
  box-shadow: inset 0 0 0 1px #e4e4e4;
`;

const Names = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
  padding: 10px 12px;
  border-radius: 12px;
  background: ${theme.text.gamma[950]};
`;

const NamesDay = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-family: ${theme.font.family.bold};
  font-size: 13px;
  color: ${theme.text.gamma[100]};
`;

const NamesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
`;

const Mark = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 2px;
  font-size: 13px;
  color: ${({ $can }) => ($can ? theme.color.primaryText : theme.text.gamma[500])};

  b {
    font-family: ${theme.font.family.bold};
    font-weight: normal;
    color: ${theme.text.gamma[200]};
  }
`;

const Name = styled.span`
  padding: 2px 9px;
  border-radius: 999px;
  background: #fff;
  font-family: ${theme.font.family.semiBold};
  font-size: 12px;
  color: ${({ $no }) => ($no ? theme.text.gamma[400] : theme.text.gamma[200])};
`;

/* 오른쪽 칸은 1280px부터만 보인다(시간 미리보기 PreviewPane $side와 같다). */
const Side = styled.div`
  display: none;

  ${XL} {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-left: ${theme.space[4]};
    border-left: 1px solid ${theme.text.gamma[900]};
  }
`;

const Fact = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: ${theme.font.family.medium};
  font-size: 13px;
  color: ${theme.text.gamma[400]};
`;

const SideTitle = styled.p`
  margin: 0;
  font-family: ${theme.font.family.bold};
  font-size: 16px;
  line-height: 1.35;
  color: ${theme.text.gamma[100]};
  overflow-wrap: anywhere;
`;

const Best = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 12px;
  border-radius: 12px;
  background: ${theme.color.primarySurface};
  color: ${theme.text.gamma[500]};

  b {
    flex: 1;
    min-width: 0;
    font-family: ${theme.font.family.extraBold};
    font-weight: normal;
    font-size: 15px;
    color: ${theme.text.gamma[100]};
  }
`;

const BestIcon = styled.span`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  color: ${theme.color.primaryText};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1.5px #ffc2c2;
`;

const SideLabel = styled.p`
  margin: 2px 0 -4px;
  font-family: ${theme.font.family.bold};
  font-size: 13px;
  color: ${theme.text.gamma[300]};
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: ${({ $on }) => ($on ? theme.color.primary : "#f1f2f4")};
  font-family: ${theme.font.family.semiBold};
  font-size: 12px;
  color: ${({ $on }) => ($on ? "#fff" : theme.text.gamma[300])};
`;

const Empty = styled.p`
  margin: 0;
  padding: ${theme.space[8]} ${theme.space[4]};
  text-align: center;
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
`;

const Sr = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
