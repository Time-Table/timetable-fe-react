import styled from "@emotion/styled/macro";
import { keyframes } from "@emotion/react";
import theme from "../../../theme";

/**
 * 새 화면(표 화면 B) 모양. 확정 시안의 CSS 여러 겹(styles·v4·soft·ix·gx·hx·wx)을 최종값으로 펼쳐 옮겼다.
 * 창·명단 창·안내 문구도 이 안에서 그려 같은 규칙을 쓴다(fixed라 자리는 화면 기준이다).
 *
 * 글꼴: 앱의 Pretendard는 굵기마다 다른 이름이라 font-weight 대신 이름을 바꾼다(굵기를 주면 브라우저가 한 번 더 굵힌다).
 * 층: 사이트 헤더 1000 < 명단 창 1010 < 창 1040 < 안내 문구 1050 < 폭죽 1055(confetti.js) < sweetalert2 1060.
 */
const F = theme.font.family;
const w5 = `font-family: ${F.medium}; font-weight: normal;`;
const w6 = `font-family: ${F.semiBold}; font-weight: normal;`;
const w7 = `font-family: ${F.bold}; font-weight: normal;`;
const w8 = `font-family: ${F.extraBold}; font-weight: normal;`;

export const Z = { pop: 1010, sheet: 1040, toast: 1050 };

const shine = keyframes`
  0% { opacity: 0; transform: translateX(-100%) skewX(-20deg); }
  50% { opacity: 0.45; }
  100% { opacity: 0; transform: translateX(300%) skewX(-20deg); }
`;
const popIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const sheetIn = keyframes`from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; }`;
const centerIn = keyframes`from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: none; }`;
const slideLeft = keyframes`from { opacity: 0.25; transform: translateX(28px); } to { opacity: 1; transform: none; }`;
const slideRight = keyframes`from { opacity: 0.25; transform: translateX(-28px); } to { opacity: 1; transform: none; }`;
const coachFade = keyframes`0%, 85% { opacity: 1; } 100% { opacity: 0; }`;
const coachMove = keyframes`0%, 20% { transform: translateY(0); } 75%, 100% { transform: translateY(72px); }`;
const coachPress = keyframes`
  0%, 8% { transform: scale(0.4); opacity: 0; }
  20% { transform: scale(1); opacity: 1; }
  75% { transform: translateY(72px) scale(1); opacity: 1; }
  100% { transform: translateY(72px) scale(1); opacity: 0; }
`;
const nudgePen = keyframes`
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(-14deg) translateY(-1px); }
  40% { transform: rotate(9deg); }
  60% { transform: rotate(-8deg); }
  80% { transform: rotate(4deg); }
`;
const nudgeTip = keyframes`
  0% { opacity: 0; transform: translate(-50%, 6px); }
  8%, 88% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -2px); visibility: hidden; }
`;
const checkBounce = keyframes`
  0% { transform: scale(0); }
  45% { transform: scale(1.18); }
  65% { transform: scale(0.92); }
  82% { transform: scale(1.04); }
  100% { transform: scale(1); }
`;
const checkPop = keyframes`from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); }`;
const toastPop = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translateY(22px) scale(0.72); }
  55% { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1.05); }
  80% { transform: translateX(-50%) translateY(1px) scale(0.985); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
`;

export const BPage = styled.div`
  --primary: ${theme.color.primary};
  --primary-text: ${theme.color.primaryText};
  --primary-border: ${theme.color.primaryBorder};
  --primary-surface: ${theme.color.primarySurface};
  --primary-surface-hover: ${theme.color.primarySurfaceHover};
  --g100: ${theme.text.gamma[100]};
  --g200: ${theme.text.gamma[200]};
  --g300: ${theme.text.gamma[300]};
  --g400: ${theme.text.gamma[400]};
  --g500: ${theme.text.gamma[500]};
  --g600: ${theme.text.gamma[600]};
  --g700: ${theme.text.gamma[700]};
  --g800: ${theme.text.gamma[800]};
  --g900: ${theme.text.gamma[900]};
  --g950: ${theme.text.gamma[950]};
  --sat: ${theme.color.weekdaySat};
  --focus: ${theme.color.focusRing};
  --scrim: ${theme.color.scrim};
  --fill: #f1f2f4;
  --soft: #f6f7f8;
  --ease: ${theme.easing.standard};
  --header-h: 72px;

  background: ${theme.color.appSurface};
  color: var(--g100);
  font-family: ${F.regular};
  /* 앱 전체의 -0.8px 자간 대신 확정 시안과 같은 기본 자간 */
  letter-spacing: normal;
  word-break: keep-all;

  /* 확정 시안처럼 테두리까지 칸 크기에 넣는다(앱은 기본값이라 칸이 1px씩 커졌다) */
  &, & *, & *::before, & *::after { box-sizing: border-box; }
  button { font: inherit; color: inherit; }
  button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
  .tb-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  .tb-ic { display: inline-flex; flex-shrink: 0; }

  /* ---------- 열·카드 ---------- */
  .tb-col { position: relative; max-width: 480px; min-height: calc(100vh - var(--header-h)); margin: 0 auto; background: #fff; }
  .tb-body { display: flex; flex-direction: column; gap: 20px; padding: 12px 16px 0; }
  .tb-card { position: relative; display: flex; flex-direction: column; gap: 12px; padding: 6px 0 0; }

  /* ---------- 머리 ---------- */
  .tb-facts { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 0 0 -6px; font-size: 13px; ${w5} color: var(--g400); }
  .tb-fact { display: inline-flex; align-items: center; gap: 5px; }
  .tb-fact .tb-ic { color: var(--g500); }
  .tb-weeks { padding: 2px 8px; border-radius: 999px; background: var(--fill); font-size: 12px; ${w7} color: var(--g300); }
  .tb-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0; }
  .tb-title { flex: 1; min-width: 0; margin: 0; font-size: 22px; ${w7} line-height: 1.35; color: var(--g100); overflow-wrap: anywhere; }
  .tb-goldbtn { flex-shrink: 0; width: 44px; height: 44px; border: 0; border-radius: 50%; background: #fff; color: var(--primary-text);
    box-shadow: inset 0 0 0 1.5px #ffc2c2; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .tb-editing { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; margin: 0; padding: 5px 12px; border-radius: 999px;
    background: var(--primary-surface); color: var(--primary-text); font-size: 13px; ${w7} }
  .tb-empty { margin: 0; font-size: 14px; color: var(--g400); }

  /* ---------- 참여자 칩(여러 명 고르기) ---------- */
  .tb-chips { min-width: 0; display: flex; gap: 6px; overflow-x: auto; padding: 6px 4px 8px; scrollbar-width: none; }
  .tb-chips::-webkit-scrollbar { display: none; }
  .tb-chips.fade-r { -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); }
  .tb-chips.fade-l { -webkit-mask-image: linear-gradient(to right, transparent, #000 28px); mask-image: linear-gradient(to right, transparent, #000 28px); }
  .tb-chips.fade-l.fade-r { -webkit-mask-image: linear-gradient(to right, transparent, #000 28px, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(to right, transparent, #000 28px, #000 calc(100% - 28px), transparent); }
  .tb-chip { position: relative; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 13px; border: 0; border-radius: 999px;
    background: var(--fill); font-size: 13px; ${w6} color: var(--g300); cursor: pointer; -webkit-tap-highlight-color: transparent; white-space: nowrap; }
  .tb-chip::before { content: ""; position: absolute; inset: -4px 0; }
  .tb-chip[aria-pressed="true"] { background: var(--primary); color: #fff; }
  .tb-chip.todo { opacity: 0.55; }
  .tb-me { margin-left: 2px; font-size: 11px; ${w8} opacity: 0.75; }

  /* ---------- 여러 명: 모두 되는 시간 ---------- */
  .tb-common { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px 8px; padding: 6px 6px 6px 12px; border-radius: 14px; background: var(--primary-surface); }
  .tb-common-who { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; ${w7} color: var(--g200); }
  .tb-common-who .tb-ic { color: var(--primary-text); }
  .tb-common-best { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 10px 0 12px; border: 0; border-radius: 999px; background: #fff;
    font-size: 14px; ${w8} color: var(--g100); cursor: pointer; font-variant-numeric: tabular-nums; }
  .tb-common-best small { font-size: 12px; ${w6} color: var(--g400); }
  .tb-common-none { padding: 8px 6px; font-size: 13px; color: var(--g400); }
  .tb-chev { color: var(--g500); }

  /* ---------- 칠하기 안내 ---------- */
  .tb-hint { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px; margin: 2px 0; padding: 10px 12px; border-radius: 12px;
    background: var(--soft); font-size: 13px; ${w6} color: var(--g300); }
  .tb-hint .tb-ic { color: var(--primary-text); }
  .tb-dotsep { margin: 0 4px; color: var(--g600); }

  /* ---------- 주 넘기기 ---------- */
  .tb-weekbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .tb-navbtn { position: relative; flex-shrink: 0; width: 44px; height: 44px; border: 0; border-radius: 50%; background: var(--fill); color: var(--g200);
    display: inline-flex; align-items: center; justify-content: center; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .tb-navbtn:disabled { opacity: 0.35; cursor: default; }
  .tb-weeklabel { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .tb-weeklabel b { display: inline-flex; align-items: center; gap: 5px; font-size: 16px; ${w7} color: var(--g100); font-variant-numeric: tabular-nums; }
  .tb-weeklabel span { font-size: 12px; ${w5} color: var(--g400); }

  /* ---------- 격자(랜딩 시간표 모양, 30분 22px·입력 중 26px) ---------- */
  .tb-grid { position: relative; display: grid; grid-template-columns: 30px repeat(7, minmax(30px, 1fr)); width: 100%; max-width: 496px; margin: 0 auto; }
  .tb-grid.slide-left { animation: ${slideLeft} 220ms var(--ease) both; }
  .tb-grid.slide-right { animation: ${slideRight} 220ms var(--ease) both; }
  .tb-corner, .tb-day { position: sticky; top: var(--header-h); z-index: 6; background: #fff; }
  .tb-corner { display: flex; align-items: flex-end; justify-content: center; padding-bottom: 12px; color: var(--g500); }
  .tb-day { display: block; width: 100%; margin: 0; padding: 4px 0 5px; border: 0; text-align: center; font-size: 13px; color: var(--g400); }
  .tb-day em { display: block; font-style: normal; font-size: 18px; ${w7} line-height: 1.25; color: var(--g100); }
  .tb-day.sat { color: var(--sat); }
  .tb-day.sun { color: var(--primary-text); }
  .tb-day.off, .tb-day.off em { color: var(--g700); }
  .tb-day.hl em { color: var(--primary-text); }
  button.tb-day, button.tb-hour { cursor: pointer; -webkit-tap-highlight-color: transparent; }
  button.tb-day:focus-visible, button.tb-hour:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px; }
  /* 시간 글자는 그 시간 선(:00 칸 윗선)에 가운데로 걸친다(2026-10-01 사람 지시 "시간을 시간 선과 동일한 레벨로").
     전에는 한 시간(두 칸) 가운데라 "10"이 10:30 선에 붙어 보였다. 칸(단추)은 그 시간 두 줄 그대로이고 글자만 선 위로 올린다.
     첫 줄 숫자 윗부분은 날짜 줄 밑 틈(.tb-gridgap)에 걸리고 틈 아랫선이 첫 시간 선이다. 끝 시각은 마지막 선 밑 틈(.tb-hour.end)에 걸린다. */
  .tb-hour { grid-row: span 2; position: relative; display: block; margin: 0; padding: 0; border: 0; background: none;
    font-size: 12px; line-height: 1; ${w5} color: var(--g400); }
  .tb-hour-num { position: absolute; left: 0; right: 0; top: 0; transform: translateY(-50%); text-align: center; }
  .tb-hour.one { grid-row: span 1; }
  .tb-hour.end { grid-row: auto; grid-column: 1; height: 8px; }
  .tb-gridgap { grid-column: 1; height: 8px; }
  .tb-gridgap.line { grid-column: 2 / -1; border-bottom: 1px solid var(--g900); }
  .tb-hour.hl { color: var(--primary-text); ${w7} }
  .tb-cell { position: relative; display: block; width: 100%; height: 22px; margin: 0; padding: 0; border: 0; border-right: 1px solid var(--g900); background: #fff;
    -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent; }
  .tb-cell.top { border-bottom: 1px solid #f7f7f7; }
  .tb-cell.bot { border-bottom: 1px solid var(--g900); }
  .tb-cell.off { background: var(--g900); }
  .tb-cell.lock { background: repeating-linear-gradient(45deg, var(--g900), var(--g900) 3px, #fff 3px, #fff 6px); }
  .tb-cell.tap { cursor: pointer; }
  .tb-cell.tap:focus-visible { outline: 2px solid var(--primary-text); outline-offset: -2px; z-index: 5; }
  .tb-cell.has-tip { z-index: 4; }
  .tb-fill, .tb-under { position: absolute; inset: 0; background: var(--primary); pointer-events: none; transition: opacity 200ms var(--ease); }
  .tb-shine { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
  .tb-shine::before { content: ""; position: absolute; top: 0; left: 0; width: 40%; height: 100%; opacity: 0; background: rgba(255, 255, 255, 0.6); animation: ${shine} 1.6s ease-in-out infinite; }
  /* "눌러서 명단 보기": 말풍선은 칸 위(첫 줄이면 아래), 꼬리는 칸 가운데 안쪽 6px까지 들어가 그 칸을 짚는다(BGrid TapTip). */
  .tb-tip { position: absolute; bottom: 100%; left: 50%; z-index: 4; transform: translateX(-50%); padding: 5px 9px; border-radius: 7px;
    background: var(--g100); color: #fff; font-size: 12px; ${w6} line-height: 1.1; white-space: nowrap; }
  .tb-tip.start { left: 0; transform: none; }
  .tb-tip.end { left: auto; right: 0; transform: none; }
  .tb-tip.below { bottom: auto; top: 100%; }
  .tb-tip-arrow { position: absolute; top: 0; left: 50%; z-index: 4; margin-left: -6px; border: 6px solid transparent; border-bottom: 0; border-top-color: var(--g100);
    pointer-events: none; }
  .tb-tip-arrow.below { top: auto; bottom: 0; border-top: 0; border-bottom: 6px solid var(--g100); }

  /* 입력 중: 칸을 키우고 끌어서 칠한다. 칸 위를 세로로 밀면 화면이 내려간다(칠하기는 누르기·길게 누르기·옆으로 밀기). */
  .tb-grid.edit { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  .tb-grid.edit .tb-cell { height: 26px; touch-action: pan-y; cursor: pointer; }
  .tb-grid.edit .tb-cell.top { border-bottom: 1px solid #f4f4f5; }
  .tb-grid.edit .tb-cell.me::after { content: ""; position: absolute; inset: 0; background: var(--primary); }
  .tb-grid.edit .tb-cell.off, .tb-grid.edit .tb-cell.lock { cursor: not-allowed; }

  /* 칠하는 법 한 번 보여 주기 */
  /* top은 날짜 줄 밑 틈(8px)만큼 내려 둘째 칸(:30)을 누르는 자리를 그대로 둔다. */
  .tb-coach { position: absolute; left: 50%; top: 92px; z-index: 8; pointer-events: none; animation: ${coachFade} 3.4s ease forwards; }
  .tb-coach-hand { position: absolute; left: -8px; top: -4px; color: var(--g100); filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25)); animation: ${coachMove} 1.7s ease-in-out infinite; }
  .tb-coach-dot { position: absolute; left: -12px; top: -12px; width: 24px; height: 24px; border-radius: 50%; background: rgba(206, 46, 46, 0.28); animation: ${coachPress} 1.7s ease-in-out infinite; }

  /* ---------- 범례 ---------- */
  .tb-legend { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 6px; font-size: 12px; color: var(--g500); }
  .tb-scale { width: 88px; height: 8px; border-radius: 999px; background: linear-gradient(90deg, rgba(254, 111, 111, 0.2), var(--primary)); }
  .tb-sw { width: 16px; height: 8px; border-radius: 999px; background: var(--primary); }
  .tb-sw.light { opacity: 0.3; margin-left: 6px; }
  .tb-gap { width: 10px; }
  .tb-legend-name { font-size: 13px; ${w6} color: var(--g300); }

  /* ---------- 아래 막대: 보기 [공유 · 내 시간 · 대화], 입력 중 [더보기 · 취소 · 저장] ---------- */
  .tb-bar { position: sticky; bottom: 0; z-index: 40; margin: 0 -16px; padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, 0.94); box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.06); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
  .tb-bar-in { display: flex; gap: 6px; }
  .tb-dock { position: relative; flex: 1; min-height: 58px; border: 0; border-radius: 18px; background: none; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; color: var(--g300); cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .tb-lbl { font-size: 12px; ${w6} }
  .tb-dock.main { flex: 1.5; background: var(--primary); color: #fff; }
  .tb-dock.main .tb-lbl { font-size: 13px; ${w7} }
  .tb-dock.wide { flex: 3; flex-direction: row; gap: 8px; }
  .tb-dock.wide .tb-lbl { font-size: 16px; }
  .tb-badge { position: absolute; top: 4px; right: calc(50% - 24px); min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: var(--primary); color: #fff;
    font-size: 11px; ${w7} display: inline-flex; align-items: center; justify-content: center; }

  /* 참여 전 "내 시간 넣기" 안내(2026-10-01 사람 확정: 펜 끄적임 + 말풍선). 처음 그릴 때만 움직인다. */
  .tb-dock.main.nudge { isolation: isolate; }
  .tb-dock.main.nudge .tb-ic { display: inline-flex; transform-origin: 25% 80%; animation: ${nudgePen} 1.4s ease-in-out 0.8s 2; }
  .tb-nudge-tip { position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); white-space: nowrap; padding: 7px 12px; border-radius: 10px;
    background: #fff; color: var(--primary-text); font-size: 13px; ${w7} line-height: 1.3; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); pointer-events: none;
    animation: ${nudgeTip} 6.5s ease 0.6s both; }
  .tb-nudge-tip::after { content: ""; position: absolute; top: 100%; left: 50%; margin-left: -6px; border: 6px solid transparent; border-top-color: #fff; }
  &.sheet-open .tb-nudge-tip { display: none; }

  /* ---------- 명단 창(칸 옆, 칸을 향한 모서리만 뾰족) ---------- */
  .tb-pop { position: fixed; z-index: ${Z.pop}; width: 260px; max-height: min(60vh, 460px); overflow-y: auto; overscroll-behavior: contain; border-radius: 12px;
    background: #fff; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16); animation: ${popIn} 150ms ease-out both; }
  .tb-pop[data-corner="tl"] { border-top-left-radius: 0; }
  .tb-pop[data-corner="tr"] { border-top-right-radius: 0; }
  .tb-pop[data-corner="bl"] { border-bottom-left-radius: 0; }
  .tb-pop[data-corner="br"] { border-bottom-right-radius: 0; }
  .tb-pop-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 12px 16px 4px; }
  .tb-pop-time { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 14px; ${w7} color: var(--g100); }
  .tb-pop-gold { display: flex; align-items: center; gap: 6px; margin: 4px 0 0; font-size: 12px; ${w5} color: var(--g400); }
  .tb-pop-gold .tb-ic { color: var(--primary-text); }
  .tb-pop-x { position: relative; flex-shrink: 0; width: 28px; height: 28px; margin: -4px -6px 0 0; display: flex; align-items: center; justify-content: center;
    border: 0; border-radius: 999px; background: none; color: var(--g400); cursor: pointer; }
  .tb-pop-x::before { content: ""; position: absolute; inset: -8px; }
  .tb-pop-row { padding: 12px 16px; }
  .tb-pop-row + .tb-pop-row { padding-top: 4px; }
  .tb-pop-label { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 14px; color: var(--g200); }
  .tb-pop-label b { ${w7} }
  .tb-pop-label .can { color: var(--primary-text); }
  .tb-pop-label .no { color: var(--g500); }
  .tb-pop-names { display: flex; flex-wrap: wrap; gap: 6px; }
  .tb-pop-name { padding: 3px 10px; border-radius: 999px; background: var(--soft); font-size: 13px; ${w6} color: var(--g200); }
  .tb-pop-name.no { color: var(--g400); }
  .tb-noname { font-size: 12px; color: var(--g400); }

  /* ---------- 창(아래에서 올라옴·가운데) ---------- */
  .tb-sheet-back { position: fixed; inset: 0; z-index: ${Z.sheet}; display: flex; align-items: flex-end; justify-content: center; background: var(--scrim); }
  .tb-sheet-back.center { align-items: center; padding: 16px; }
  .tb-sheet { width: 100%; max-width: 480px; max-height: 88vh; overflow: auto; background: #fff; border-radius: 20px 20px 0 0;
    padding: 8px 16px calc(20px + env(safe-area-inset-bottom)); box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14); animation: ${sheetIn} 220ms var(--ease); }
  .tb-sheet.center { max-width: 360px; border-radius: 22px; padding: 26px 20px 20px; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18); animation: ${centerIn} 0.22s ease-out both; }
  .tb-sheet:focus { outline: none; }
  .tb-sheet-handle { width: 40px; height: 4px; border-radius: 2px; background: var(--g800); margin: 4px auto 8px; }
  .tb-sheet-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 12px; }
  .tb-sheet-head h2 { margin: 0; font-size: 18px; ${w7} }
  .tb-iconbtn { width: 44px; height: 44px; border-radius: 50%; border: 0; background: none; display: inline-flex; align-items: center; justify-content: center; color: var(--g300); cursor: pointer; }
  .tb-cta { flex: 1; width: 100%; min-height: 56px; padding: 0 16px; border: 1px solid transparent; border-radius: 12px; background: var(--primary); color: #fff;
    font-size: 17px; ${w7} cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; -webkit-tap-highlight-color: transparent; transition: background 120ms var(--ease); }
  .tb-cta:active:not(:disabled) { background: #f46565; }
  .tb-cta:disabled { background: var(--g950); border-color: var(--g800); color: var(--g500); cursor: not-allowed; }
  .tb-sub { flex-shrink: 0; min-height: 56px; padding: 0 18px; border: 0; border-radius: 12px; background: var(--fill); color: var(--g200); font-size: 15px; ${w6} cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .tb-sub.wide { width: 100%; margin-top: 8px; }
  .tb-cta:focus-visible, .tb-sub:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }
  .tb-row2 { display: flex; gap: 8px; }
  .tb-row2 > button { flex: 1; }
  .tb-desc { margin: 0 0 16px; font-size: 14px; line-height: 1.55; color: var(--g400); }

  /* 참여 창 */
  .tb-form { display: flex; flex-direction: column; }
  .tb-field { display: flex; align-items: center; gap: 10px; min-height: 54px; margin-bottom: 10px; padding: 0 14px; border-radius: 12px; background: var(--fill); color: var(--g400); }
  .tb-field:focus-within { box-shadow: 0 0 0 2px var(--focus); }
  .tb-input { width: 100%; min-height: 52px; padding: 0 16px; border: 0; border-radius: 12px; background: var(--fill); font-size: 17px; ${w6} color: var(--g100); }
  .tb-input::placeholder { color: var(--g500); font-family: ${F.regular}; }
  .tb-field .tb-input { min-height: 50px; padding: 0; background: transparent; }
  .tb-field .tb-input:focus-visible { outline: 0; }
  .tb-err { margin: 0 0 10px; font-size: 13px; ${w6} color: var(--primary-text); }
  .tb-err:empty { margin: 0; }
  .tb-terms { display: flex; justify-content: center; gap: 8px; margin: 14px 0 0; font-size: 12px; color: var(--g500); }
  .tb-terms a { color: var(--g400); text-decoration: none; padding: 6px 2px; }
  .tb-pfield { margin-bottom: 18px; }
  .tb-label { display: flex; align-items: center; margin: 0 0 10px; font-size: 15px; ${w7} color: var(--g100); }

  /* 더보기 */
  .tb-mine { display: flex; flex-direction: column; gap: 2px; }
  .tb-morerow { display: flex; align-items: flex-start; gap: 12px; width: 100%; min-height: 62px; padding: 10px 12px; border: 0; border-radius: 12px; background: none;
    text-align: left; font-size: 16px; color: var(--g100); cursor: pointer; }
  .tb-morerow:active { background: var(--soft); }
  .tb-morerow .tb-ic { margin-top: 1px; color: var(--g400); }
  .tb-morerow.danger, .tb-morerow.danger .tb-ic { color: var(--primary-text); }
  .tb-morerow-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .tb-morerow-txt b { font-size: 16px; ${w7} }
  .tb-morerow-txt small { font-size: 13px; ${w5} line-height: 1.45; color: var(--g400); }

  /* 가장 많이 모이는 시간(순위) */
  .tb-goldlist { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .tb-goldrow { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 0 14px; border: 0; border-radius: 14px; background: var(--soft);
    cursor: pointer; text-align: left; -webkit-tap-highlight-color: transparent; }
  .tb-goldrow.top { background: var(--primary-surface); }
  .tb-rank { flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; background: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; ${w8} color: var(--g300); }
  .tb-goldrow.top .tb-rank { background: var(--primary); color: #fff; }
  .tb-goldrow-main { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 8px; font-variant-numeric: tabular-nums; }
  .tb-goldrow-main b { font-size: 14px; ${w6} color: var(--g300); }
  .tb-goldrow-main span { font-size: 16px; ${w8} color: var(--g100); }
  .tb-count { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; ${w7} color: var(--primary-text); }

  /* 사용법 */
  .tb-helplist { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  .tb-help-row { display: flex; align-items: center; gap: 14px; min-height: 46px; font-size: 15px; color: var(--g200); }
  .tb-help-row .tb-ic, .tb-help-row .tb-gold { color: var(--primary-text); }
  .tb-help-tiles { display: inline-flex; gap: 2px; }
  .tb-help-tiles i { width: 6px; height: 18px; border-radius: 2px; background: var(--primary); }

  /* 대화(말풍선) */
  .tb-room { display: flex; flex-direction: column; gap: 10px; max-height: 52vh; overflow: auto; padding: 12px; border-radius: 12px; background: var(--g900); }
  .tb-room-empty { margin: 0; padding: 12px 0; text-align: center; font-size: 13px; color: var(--g400); }
  .tb-msg { display: flex; align-items: flex-start; gap: 8px; }
  .tb-msg.mine { justify-content: flex-end; }
  .tb-msg-body { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; max-width: 78%; }
  .tb-sender { font-size: 12px; color: var(--g300); }
  .tb-bubble { position: relative; margin-left: 7px; padding: 6px 12px; border-radius: 0 14px 14px 14px; background: #fff; color: var(--g100); font-size: 14px; line-height: 1.45; overflow-wrap: anywhere; }
  .tb-bubble::after { content: ""; position: absolute; top: 0; left: -7px; width: 9px; height: 11px; background: #fff; clip-path: polygon(0 0, 100% 0, 100% 100%); }
  .tb-bubble.mine { margin: 0 7px 0 0; max-width: 78%; border-radius: 14px 0 14px 14px; background: var(--primary-surface-hover); }
  .tb-bubble.mine::after { left: auto; right: -7px; background: var(--primary-surface-hover); clip-path: polygon(0 0, 100% 0, 0 100%); }
  .tb-chat-form { display: flex; gap: 8px; margin-top: 10px; }
  .tb-chat-input { flex: 1; min-width: 0; min-height: 48px; padding: 0 14px; border: 0; border-radius: 12px; font-size: 16px; background: var(--fill); color: var(--g100); }
  .tb-send { flex-shrink: 0; min-height: 48px; padding: 0 16px; border: 0; border-radius: 12px; background: var(--primary-surface); color: var(--primary-text); font-size: 15px; ${w7} cursor: pointer; }
  .tb-send:disabled { opacity: 0.45; cursor: default; }
  .tb-chat-count { margin: 6px 4px 0; font-size: 12px; line-height: 1.4; color: var(--g400); text-align: right; font-variant-numeric: tabular-nums; }
  .tb-chat-count.full { color: var(--primary-text); ${w7} }

  /* 처음 저장한 사람에게 링크 공유 권하기(2026-10-01 사람 확정: 가운데 모달 체크 카드, 체크 움직임 3) */
  .tb-sp { display: flex; flex-direction: column; align-items: stretch; gap: 10px; text-align: center; }
  .tb-sp-badge { position: relative; align-self: center; display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; margin-bottom: 4px;
    border-radius: 50%; background: var(--primary-surface); color: var(--primary-text); animation: ${checkBounce} 0.62s cubic-bezier(0.28, 0.84, 0.42, 1) 0.1s both; }
  .tb-sp-badge .tb-ic { animation: ${checkPop} 0.3s ease 0.32s both; }
  .tb-sp-title { margin: 0; font-size: 20px; ${w8} line-height: 1.35; color: var(--g100); letter-spacing: -0.2px; }
  .tb-sp-desc { margin: 0 0 6px; font-size: 15px; line-height: 1.55; color: var(--g300); }
  .tb-sp .tb-cta, .tb-sp .tb-sub { min-height: 52px; font-size: 16px; ${w7} }
  .tb-sp .tb-sub { color: var(--g300); }
  .tb-sp-row { display: flex; gap: 8px; }
  .tb-sp-row > button { flex: 1; min-width: 0; }

  /* ---------- 안내 문구. 저장 버튼 뒤 안내는 아래에서 톡 튀어 오른다(2026-10-01 사람 지시) ---------- */
  .tb-toast { position: fixed; left: 50%; bottom: calc(88px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: ${Z.toast}; width: max-content; max-width: calc(100% - 32px);
    padding: 12px 16px; border-radius: 12px; background: var(--g100); color: #fff; font-size: 14px; line-height: 1.4; text-align: center; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22); }
  .tb-toast.pop { transform-origin: 50% 100%; animation: ${toastPop} 0.46s ease-out both; }

  @media (prefers-reduced-motion: reduce) {
    .tb-shine::before, .tb-pop, .tb-sheet, .tb-sheet.center, .tb-grid.slide-left, .tb-grid.slide-right, .tb-coach, .tb-coach-hand, .tb-coach-dot,
    .tb-sp-badge, .tb-sp-badge .tb-ic, .tb-toast.pop { animation: none; }
    .tb-fill, .tb-under, .tb-cta { transition: none; }
    .tb-dock.main.nudge .tb-ic { animation: none; }
    .tb-nudge-tip { display: none; }
    .tb-dock.main.nudge::before { content: ""; position: absolute; inset: -4px; z-index: -1; border-radius: 22px; pointer-events: none; box-shadow: 0 0 0 1.5px rgba(255, 107, 107, 0.26); }
  }
`;
