import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled/macro";
import { css, keyframes } from "@emotion/react";
import theme from "../../../theme";

// 2026-10-02 사람 지시 "전 문구로 바꿔줘": 2회차 설계 때 대칭 문구("다른 화면으로 볼 수 있어요")로 바꿨다가
// "기존 화면"·"새 화면" 이름과 A에서 새 화면을 권하는 채운 버튼으로 되돌렸다(실험 중 변경, 하네스 specs/table-ab-2.md에 시각 기록).
const COPY = {
  A: { text: "을 먼저 써 볼 수 있어요", button: "새 화면 써 보기" },
  B: { text: "을 쓰는 중이에요", button: "기존 화면으로" },
};
// 바꾼 뒤 화면 기준의 알림
const NOTICE = {
  A: "기존 화면으로 바꿨어요.",
  B: "새 화면으로 바꿨어요. 언제든 기존 화면으로 돌아갈 수 있어요.",
};
const NOTICE_MS = 2500;
// 띠 하트 투표(2026-10-02 사람 결정 2안): 설명 글 없이 하트 하나. 어느 쪽에 투표하든(처음·옮김) 같은 문구.
const NAME = { A: "기존 화면", B: "새 화면" };
const VOTED = (version) => `${NAME[version]} 쪽에 투표했어요!`;
const UNVOTED = "투표를 취소했어요.";

/**
 * 테이블 A/B 전환 띠(1안, 2026-09-29 사람 선택). 사이트 헤더 밑 표 화면 맨 위에 두고, 스크롤하면 함께 올라간다.
 * 표 화면과 함께 그려 나중에 끼어들며 내용을 밀지 않는다(0회차 지표에서 CLS가 나빴다).
 * 명세: 하네스 specs/table-ab-2.md(2회차). version은 지금 화면, onSwitch(다음 화면)을 부른다.
 * vote는 이 브라우저가 하트를 누른 화면("A"·"B"·null), onVote()는 지금 화면에 투표하거나(이미 그 화면이면) 취소한다.
 */
export default function TableUiBand({ version, onSwitch, vote = null, onVote }) {
  // 글은 사라지는 동안에도 남겨 두어 흐려지는 도중에 상자가 줄지 않게 한다.
  const [notice, setNotice] = useState({ text: "", visible: false });
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = (text) => {
    setNotice({ text, visible: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice((prev) => ({ ...prev, visible: false })), NOTICE_MS);
  };

  const handleClick = () => {
    const next = version === "A" ? "B" : "A";
    onSwitch(next);
    show(NOTICE[next]);
  };

  const voted = vote === version;
  const [pop, setPop] = useState(0);
  const handleVote = () => {
    onVote?.();
    show(voted ? UNVOTED : VOTED(version));
    if (!voted) setPop((n) => n + 1);
  };

  return (
    <BandWrap>
      <Band role="region" aria-label="화면 바꾸기">
        <BandInner>
          <BandText>
            <strong>새 화면</strong>
            {COPY[version].text}
          </BandText>
          {onVote && (
            <HeartButton
              type="button"
              aria-pressed={voted}
              aria-label={voted ? `${NAME[version]} 투표 취소` : `${NAME[version]} 쪽에 투표`}
              $pop={pop > 0 && voted}
              onClick={handleVote}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />
              </svg>
            </HeartButton>
          )}
          <SwitchButton type="button" $filled={version === "A"} onClick={handleClick}>
            {COPY[version].button}
          </SwitchButton>
        </BandInner>
      </Band>
      {/* 알림 영역은 늘 두어야 화면 낭독기가 바뀐 글을 읽는다. */}
      <Notice role="status" aria-live="polite" $visible={notice.visible}>
        {notice.text}
      </Notice>
    </BandWrap>
  );
}

const BandWrap = styled.div`
  position: relative;
`;

const Band = styled.div`
  background-color: ${theme.color.primarySurface};
  border-bottom: 1px solid ${theme.color.primarySurfaceHover};
  padding: ${theme.space[2]} ${theme.space[6]};
  box-sizing: border-box;
  @media (max-width: 480px) {
    padding: ${theme.space[2]} ${theme.space[4]};
  }
`;

// 아래 표 화면 내용 폭(휴대폰·태블릿 800px, PC 1200px)에 맞춘다.
const BandInner = styled.div`
  max-width: 800px;
  margin: 0 auto;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: ${theme.space[3]};
  @media (min-width: ${theme.breakpoint.lg}) {
    max-width: 1200px;
  }
`;

const BandText = styled.p`
  flex: 1;
  min-width: 0;
  margin: 0;
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.label};
  line-height: ${theme.font.lineHeight.snug};
  color: ${theme.text.gamma[200]};
  word-break: keep-all;

  strong {
    font-family: ${theme.font.family.bold};
    font-weight: normal;
    color: ${theme.color.primaryText};
  }
`;

const SwitchButton = styled.button`
  flex-shrink: 0;
  min-height: 44px;
  padding: 0 ${theme.space[4]};
  border-radius: ${theme.radius.pill};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.label};
  white-space: nowrap;
  cursor: pointer;
  background-color: ${({ $filled }) => ($filled ? theme.color.primaryText : theme.color.surface)};
  color: ${({ $filled }) => ($filled ? theme.color.surface : theme.text.gamma[200])};
  border: 1px solid ${({ $filled }) => ($filled ? theme.color.primaryText : theme.text.gamma[600])};

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }
`;

const heartPop = keyframes`
  0% { transform: scale(1); }
  45% { transform: scale(1.3); }
  100% { transform: scale(1); }
`;

// 띠 하트(투표). 누르지 않아도 아무 일 없고, 화면을 가리지 않는다. 터치 영역 44px.
const HeartButton = styled.button`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  padding: 0;
  display: grid;
  place-items: center;
  border-radius: ${theme.radius.pill};
  background-color: ${theme.color.surface};
  border: 1px solid ${({ "aria-pressed": pressed }) => (pressed ? theme.color.primaryText : theme.text.gamma[800])};
  cursor: pointer;

  svg {
    width: 20px;
    height: 20px;
    fill: ${({ "aria-pressed": pressed }) => (pressed ? theme.color.primary : "none")};
    stroke: ${({ "aria-pressed": pressed }) => (pressed ? theme.color.primaryText : theme.text.gamma[500])};
    stroke-width: 2;
    animation: ${({ $pop }) => ($pop ? css`${heartPop} 0.3s ease-out` : "none")};
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    svg {
      animation: none;
    }
  }
`;

// 누른 띠 바로 아래에 잠깐 뜬다. 내용 위에 겹치므로 누름을 막지 않는다.
const Notice = styled.div`
  position: absolute;
  top: calc(100% + ${theme.space[3]});
  left: 50%;
  z-index: 5;
  width: max-content;
  max-width: calc(100% - ${theme.space[8]});
  transform: translateX(-50%);
  padding: ${theme.space[3]} ${theme.space[4]};
  border-radius: ${theme.radius.md};
  background-color: ${theme.text.gamma[100]};
  color: ${theme.color.surface};
  box-shadow: ${theme.shadow.toast};
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.label};
  line-height: ${theme.font.lineHeight.snug};
  text-align: center;
  word-break: keep-all;
  box-sizing: border-box;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  // 다 흐려진 뒤에는 숨겨 지난 알림이 화면 낭독기에 남지 않게 한다.
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
  transition: opacity ${theme.duration.base} ${theme.easing.standard},
    visibility 0s linear ${({ $visible }) => ($visible ? "0s" : theme.duration.base)};
`;
