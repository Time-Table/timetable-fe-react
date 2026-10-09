import styled from "@emotion/styled";
import theme from "../theme";

/**
 * 생성 화면의 시간 범위 스위치(2026-10-09 날짜 투표, 사람 결정). 랜딩 v1·v2와 빠른 생성이 같이 쓴다.
 * - 켬: 시간 범위까지 고른다(지금 표). 끔: 시간 없이 날짜만 고른다(날짜 투표 표). 기본은 켬.
 * - 끔일 때만 스위치 왼쪽에 회색 "날짜만"(13px)을 둔다. 칩이 아니라 글자로(2026-10-09 사람 지시 "칩으로 보여주니까 ai 같아").
 * 계측(끔으로 바꿈)은 화면마다 부른다(랜딩 v2 미리보기 주소는 기록하지 않는다).
 */
export default function TimeRangeSwitch({ on, onChange, disabled = false, id }) {
  return (
    <Row>
      {!on && <Keyword>날짜만</Keyword>}
      <Track
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="시간 범위 정하기"
        disabled={disabled}
        $on={on}
        onClick={() => onChange(!on)}
      >
        <Knob $on={on} aria-hidden="true" />
      </Track>
    </Row>
  );
}

const Row = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const Keyword = styled.span`
  font-family: ${theme.font.family.medium};
  font-size: 13px;
  color: ${theme.text.gamma[400]};
`;

const Track = styled.button`
  position: relative;
  flex-shrink: 0;
  width: 46px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ $on }) => ($on ? theme.color.primary : theme.text.gamma[700])};
  cursor: pointer;
  transition: background ${theme.duration.fast} ${theme.easing.standard};
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }

  /* 누르는 자리를 44px 높이로 넓힌다. */
  &::before {
    content: "";
    position: absolute;
    inset: -8px -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Knob = styled.span`
  position: absolute;
  top: 3px;
  left: ${({ $on }) => ($on ? "21px" : "3px")};
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: left ${theme.duration.fast} ${theme.easing.standard};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
