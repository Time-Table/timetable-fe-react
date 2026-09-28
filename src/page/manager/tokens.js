/**
 * 관리자 콘솔 전용 디자인 토큰.
 * 서비스 본체(theme.js)와 분리한 이유: 콘솔은 데이터 밀도가 높고 중립적인 표면이
 * 필요해서, 브랜드 컬러를 그대로 쓰면 수치가 묻힌다.
 *
 * 색상은 데이터 시각화 검증기(대비/색각/명도대역)를 통과한 값만 사용한다.
 * 특히 good(초록)과 critical(빨강)은 적록색각에서 ΔE 4.6으로 구분되지 않으므로
 * 증감 표시는 반드시 화살표 같은 2차 인코딩을 함께 써야 한다.
 */
const tokens = {
  color: {
    // 표면
    bg: "#f9f9f7",
    surface: "#fcfcfb",
    surfaceSunken: "#f2f1ee",
    sidebar: "#141413",
    sidebarHover: "rgba(255,255,255,0.06)",

    // 잉크
    ink: "#0b0b0b",
    ink2: "#52514e",
    // 보조 글자. 2026-09-28 #898781(surface 3.50:1)에서 AA를 넘는 값으로 낮췄다.
    // surface 5.03 · bg 4.90 · surfaceSunken 4.58:1.
    muted: "#6f6d68",
    onDark: "#ffffff",
    onDarkMuted: "#c3c2b7",

    // 선
    border: "rgba(11,11,11,0.10)",
    grid: "#e1e0d9",
    axis: "#c3c2b7",

    // 데이터 계열 (검증된 순서: 파랑 → 주황 → 아쿠아)
    series1: "#2a78d6",
    series2: "#eb6834",
    series3: "#1baf7a",

    // 주 버튼 바탕. series1에 흰 글자는 4.42:1이라 AA 미달이어서 한 단계 어둡게 둔다(흰 글자 4.92:1).
    accent: "#2470cc",

    // 상태 (계열색과 겹치지 않음. 항상 아이콘/라벨과 함께 쓸 것)
    good: "#0ca30c",
    goodText: "#006300",
    warning: "#fab219",
    critical: "#d03b3b",
  },

  radius: { sm: "6px", md: "10px", lg: "14px" },

  // 화면 폭 기준. compact는 사이드바 대신 위쪽 탭 줄, mobile은 표를 카드로 바꾸고 설명을 접는다.
  media: {
    compact: "(max-width: 1023px)",
    mobile: "(max-width: 640px)",
  },

  // 모바일 터치 최소 크기
  touch: "44px",

  // 4px 리듬
  space: (n) => `${n * 4}px`,

  shadow: {
    card: "0 1px 2px rgba(11,11,11,0.04)",
    raised: "0 4px 16px rgba(11,11,11,0.08)",
    modal: "0 24px 48px rgba(11,11,11,0.18)",
  },

  font: {
    sans: `system-ui, -apple-system, "Segoe UI", "Pretendard-Regular", sans-serif`,
  },
};

export default tokens;
