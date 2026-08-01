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
    muted: "#898781",
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

    // 상태 (계열색과 겹치지 않음. 항상 아이콘/라벨과 함께 쓸 것)
    good: "#0ca30c",
    goodText: "#006300",
    warning: "#fab219",
    critical: "#d03b3b",
  },

  radius: { sm: "6px", md: "10px", lg: "14px" },

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
