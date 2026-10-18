import { useEffect, useLayoutEffect, useState } from "react";
import styled from "@emotion/styled";
import { css, keyframes } from "@emotion/react";
import theme from "../../theme";
import { LANDING_COUNT, MAU_COUNT_MS } from "./mauStats";

/**
 * 랜딩 신뢰 표시 — 숫자가 주인공(2026-10-02 사람 지시).
 * 세 줄을 한 문장으로 읽히게 쌓는다: "최근 30일 동안 / 300+명 / 타임테이블로 시간을 아꼈어요".
 * 숫자는 사람이 정한 고정값이다(mauStats LANDING_COUNT. 2026-10-19 사람 지시로 집계 API 대신 300+ 고정,
 * 공유 미리보기 이미지와 같은 숫자).
 * 등장은 "마지막에"(2026-10-02 시안 5개 중 사람이 고른 5번): 페이지가 introDone을 참으로 넘기면 세 줄이 위에서부터
 * 조금씩 늦게 떠오르고 숫자가 0부터 올라간 뒤 +가 붙는다. 그 전에는 투명한 채 자리만 차지해 아래 내용이 밀리지 않는다.
 * - 휴대폰·A 넓은 화면: 첫 진입 소개가 끝났을 때
 * - B 넓은 화면: 스크롤 이야기의 제목이 거의 다 사라졌을 때
 *
 * 처음 그린 뒤 onSettled를 한 번 불러 페이지가 자리 높이를 재게 한다(두 랜딩의 placeIntro).
 * 글자 크기(36·48px, 20·24px)는 크기 목록(font.size) 밖의 값이다. 확정하면 디자인 시스템에 올린다.
 * 정렬은 놓는 자리가 정한다(`--mau-align`: center | flex-start).
 * compact: 넓은 화면(lg 이상)에서 두 줄로 줄인다("최근 30일 동안 300+명" / "타임테이블로 시간을 아꼈어요", 숫자 32px).
 * A 넓은 화면의 제목 아래 78px 안에 들어가야 폼·미리보기가 밀리지 않는다(2026-10-04 사람 선택: 다른 요소를 밀지 않는 1번).
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

export default function MauHero({ introDone = true, onSettled, compact = false }) {
  const [shown, setShown] = useState(0);
  const [isCounted, setCounted] = useState(false);

  // 세 줄은 페이지 신호(introDone)가 오면 떠오르고 숫자가 0부터 올라간다. 그 전에는 투명하다.
  useEffect(() => {
    if (!introDone) return undefined;
    if (prefersReducedMotion() || typeof window.requestAnimationFrame !== "function") {
      setShown(LANDING_COUNT);
      setCounted(true);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    // 프레임이 넘겨주는 시각 대신 매번 performance.now()로 잰다. 첫 프레임 시각은 start보다 앞설 수 있다.
    const step = () => {
      const t = Math.min((performance.now() - start) / MAU_COUNT_MS, 1);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(LANDING_COUNT * eased));
      if (t < 1) frame = window.requestAnimationFrame(step);
      else setCounted(true);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [introDone]);

  // 그린 다음에 알린다. 페이지는 이때 MAU 자리 높이를 잰다.
  useLayoutEffect(() => {
    onSettled?.();
  }, [onSettled]);

  const total = LANDING_COUNT.toLocaleString("ko-KR");

  return (
    <Hero data-nosnippet $compact={compact}>
      <Line aria-hidden="true" $on={introDone} $compact={compact} $area="period">
        {PERIOD}
      </Line>
      <Big aria-hidden="true" $on={introDone} $delay={LINE_STAGGER_MS} $compact={compact}>
        <Odometer>
          <Ghost>{total}</Ghost>
          <Current>{shown.toLocaleString("ko-KR")}</Current>
        </Odometer>
        <Plus $on={isCounted}>+</Plus>
        <Unit>명</Unit>
      </Big>
      <Line aria-hidden="true" $on={introDone} $delay={LINE_STAGGER_MS * 2} $compact={compact} $area="caption">
        {CAPTION}
      </Line>
      <SrOnly>{`${PERIOD} ${total}명 넘게 ${CAPTION}`}</SrOnly>
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

/* 숫자 블록. 세 줄을 세로로 쌓는다. compact는 넓은 화면에서 기간과 숫자를 한 줄에 놓는다. */
const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: var(--mau-align, center);
  gap: ${theme.space[1]};
  margin: 0;

  ${({ $compact }) =>
    $compact &&
    css`
      @media (min-width: ${theme.breakpoint.lg}) {
        display: grid;
        grid-template-columns: auto auto;
        grid-template-areas:
          "period big"
          "caption caption";
        justify-content: var(--mau-align, center);
        align-items: baseline;
        column-gap: ${theme.space[2]};
        row-gap: 0;
      }
    `}
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
    font-size: ${({ $compact }) => ($compact ? theme.font.size.bodyLg : "24px")};
    grid-area: ${({ $area }) => $area || "auto"};
  }
`;

/* 숫자 줄. 브랜드 빨강(primary, 2026-10-04 사람 지시. 글자용 단계 primaryText에서 바꿈. 흰 배경 2.72:1이라 AA 미달이지만
   /start는 2026-08-01 사람 결정으로 브랜드 톤을 우선한다) 36px, 넓은 화면 48px. 숫자 폭이 흔들리지 않게 고정폭 숫자를 쓴다. */
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
  color: ${theme.color.primary};

  @media (min-width: ${theme.breakpoint.lg}) {
    font-size: ${({ $compact }) => ($compact ? "32px" : "48px")};
    grid-area: big;
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

/* "300+"의 +. 자리는 처음부터 잡아 두고 숫자가 다 올라간 뒤에 나타난다(올라가는 중의 "123+"는 뜻이 없다). */
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

const SrOnly = styled.span`
  ${theme.styles.srOnly}
`;
