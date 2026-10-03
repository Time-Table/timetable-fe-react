import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { css, keyframes } from "@emotion/react";
import theme from "../../theme";
import { MAU_MIN, MAU_COUNT_MS, fetchMauMock, floorTens } from "./mauStats";

/**
 * 랜딩 신뢰 표시(MAU) — MAU가 주인공(2026-10-02 사람 지시).
 * 세 줄을 한 문장으로 읽히게 쌓는다: "최근 30일 동안 / 450+명 / 타임테이블로 시간을 아꼈어요".
 * 숫자는 십 단위로 내리고 +를 붙인다(2026-10-04 사람 확정. 정확한 수 451명과 비교해 450+명을 골랐다).
 * 등장은 "마지막에"(2026-10-02 시안 5개 중 사람이 고른 5번): 페이지가 introDone을 참으로 넘기면 세 줄이 위에서부터
 * 조금씩 늦게 떠오르고 숫자가 0부터 올라간 뒤 +가 붙는다. 그 전에는 투명한 채 자리만 차지해 아래 내용이 밀리지 않는다.
 * - 휴대폰·A 넓은 화면: 첫 진입 소개가 끝났을 때
 * - B 넓은 화면: 스크롤 이야기의 제목이 거의 다 사라졌을 때
 *
 * 지금 숫자는 가짜 API(목데이터)다. 운영에 내보내기 전에 BE 공개 API로 바꾼다.
 * 글자 크기(36·48px, 20·24px)는 크기 목록(font.size) 밖의 값이다. 확정하면 디자인 시스템에 올린다.
 * 숫자는 이벤트를 남긴 서로 다른 방문자 수다(관리자 audience의 totalVisitors. 관리자·봇 요청은 기록 단계에서 빠진다).
 * 정렬은 놓는 자리가 정한다(`--mau-align`: center | flex-start).
 */
const PERIOD = "최근 30일 동안";
const CAPTION = "타임테이블로 시간을 아꼈어요";
/**
 * 줄이 차례로 떠오를 때 한 줄과 다음 줄 사이(ms). 한 줄은 duration.slow(300ms) 동안 떠오르므로 세 줄이 다 멈추는 때는
 * 500ms다(디자인 시스템 규칙: 누적 지연 250ms 이하, 시퀀스 전체 550ms 이하). 숫자 올라가기(MAU_COUNT_MS)는 따로 센다.
 */
const LINE_STAGGER_MS = 100;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function MauHero({ introDone = true }) {
  const [data, setData] = useState(null);
  const [shown, setShown] = useState(0);
  const [isCounted, setCounted] = useState(false);
  const target = data ? floorTens(data.mau) : 0;
  const isHidden = Boolean(data) && data.mau < MAU_MIN;

  useEffect(() => {
    let alive = true;
    fetchMauMock().then((value) => {
      if (alive) setData(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!data || !introDone || isHidden) return undefined;
    if (prefersReducedMotion() || typeof window.requestAnimationFrame !== "function") {
      setShown(target);
      setCounted(true);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    // 프레임이 넘겨주는 시각 대신 매번 performance.now()로 잰다. 첫 프레임 시각은 start보다 앞설 수 있다.
    const step = () => {
      const t = Math.min((performance.now() - start) / MAU_COUNT_MS, 1);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(target * eased));
      if (t < 1) frame = window.requestAnimationFrame(step);
      else setCounted(true);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [data, introDone, isHidden, target]);

  if (isHidden) return null;
  const total = target.toLocaleString("ko-KR");

  return (
    <Hero data-nosnippet aria-busy={!data}>
      <Line aria-hidden="true" $on={introDone}>
        {PERIOD}
      </Line>
      <Big aria-hidden="true" $on={introDone} $delay={LINE_STAGGER_MS}>
        {data ? (
          <>
            <Odometer>
              <Ghost>{total}</Ghost>
              <Current>{shown.toLocaleString("ko-KR")}</Current>
            </Odometer>
            <Plus $on={isCounted}>+</Plus>
            <Unit>명</Unit>
          </>
        ) : (
          <BigSkeleton />
        )}
      </Big>
      <Line aria-hidden="true" $on={introDone} $delay={LINE_STAGGER_MS * 2}>
        {CAPTION}
      </Line>
      {data && <SrOnly>{`${PERIOD} ${total}명 넘게 ${CAPTION}`}</SrOnly>}
    </Hero>
  );
}

const lineIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(${theme.motion.riseY}px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

/* 줄 하나의 보이기. 차례가 되면 떠오르며 나타나고, 그 전에는 투명한 채 자리만 차지한다. */
const appear = ({ $on, $delay = 0 }) =>
  $on
    ? css`
        animation: ${lineIn} ${theme.duration.slow} ${theme.easing.out} ${$delay}ms both;

        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
      `
    : css`
        opacity: 0;
      `;

/* 숫자 블록. 세 줄을 세로로 쌓는다. */
const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: var(--mau-align, center);
  gap: ${theme.space[1]};
  margin: 0;
`;

/* 숫자 위아래 줄("최근 30일 동안", "타임테이블로 시간을 아꼈어요"). 굵은 검정 20px, 넓은 화면 24px. */
const Line = styled.p`
  ${appear}
  margin: 0;
  font-family: ${theme.font.family.bold};
  font-size: 20px;
  line-height: ${theme.font.lineHeight.snug};
  color: ${theme.text.gamma[100]};

  @media (min-width: ${theme.breakpoint.lg}) {
    font-size: 24px;
  }
`;

/* 숫자 줄. 브랜드 빨강(글자용 단계) 36px, 넓은 화면 48px. 숫자 폭이 흔들리지 않게 고정폭 숫자를 쓴다.
   받기 전 자리(BigSkeleton)도 같은 높이(1.15em)를 차지해 받은 뒤 아래 내용이 밀리지 않는다. */
const Big = styled.p`
  ${appear}
  display: flex;
  align-items: baseline;
  min-height: 1.15em;
  margin: 0;
  font-family: ${theme.font.family.extraBold};
  font-size: 36px;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: ${theme.color.primaryText};

  @media (min-width: ${theme.breakpoint.lg}) {
    font-size: 48px;
  }
`;

/* 숫자가 0부터 올라가는 동안 폭이 변해 옆의 "명"이 밀리지 않게, 최종값(Ghost)을 투명하게 깔아 자리를 잡고
   지금 값(Current)을 그 위에 오른쪽 맞춤으로 겹친다. */
const Odometer = styled.span`
  display: inline-grid;
`;

const Ghost = styled.span`
  grid-area: 1 / 1;
  visibility: hidden;
`;

const Current = styled.span`
  grid-area: 1 / 1;
  justify-self: end;
`;

/* "450+"의 +. 자리는 처음부터 잡아 두고 숫자가 다 올라간 뒤에 나타난다(올라가는 중의 "123+"는 뜻이 없다). */
const Plus = styled.span`
  opacity: ${({ $on }) => ($on ? 1 : 0)};
  transition: opacity ${theme.duration.base} ${theme.easing.out};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Unit = styled.span`
  margin-left: 2px;
  font-family: ${theme.font.family.bold};
  font-size: 0.55em;
  letter-spacing: 0;
`;

const BigSkeleton = styled.span`
  display: inline-block;
  width: 3em;
  height: 0.8em;
  border-radius: ${theme.radius.sm};
  background: ${theme.text.gamma[900]};
`;

const SrOnly = styled.span`
  ${theme.styles.srOnly}
`;
