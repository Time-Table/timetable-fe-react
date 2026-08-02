const color = {
     primary: "#FE6F6F",
     primaryTint: "#FFA29D",

     // 브랜드색을 글자·경계로 쓰면 흰 배경에서 2.72:1 이다(AA 미달).
     // 2026-08-01 사람이 브랜드 톤을 우선해 그대로 쓰기로 결정했다.
     // 근거와 실측값은 specs/design-system.md 의 예외 절에 있다.
     primarySurface: "#FFF1F1", // 선택·활성 칩/셀의 옅은 배경
     primarySurfaceHover: "#FFE6E6", // primarySurface 위 hover 한 단계
     appSurface: "#F8F9FA", // 화면 바탕 (/table 의 PageWrapper 와 같은 값)
     surface: "#FFFFFF", // 카드·입력의 기본 표면. 리터럴 white 대신 이 토큰을 쓴다.

     // 토요일 색. 색만으로 주말을 말하지 않는다 — 헤더에 '토' 글자가 이미 있고
     // 색은 그 위에 얹는 보강 채널이다. 일요일은 브랜드색을 쓴다.
     weekdaySat: "#2563C9", // 흰 배경 5.66:1

     // 미리보기 목업의 브라우저 창 신호등. 실제 UI 색이 아니라 그림의 일부다.
     mockWindow: {
          close: "#FF5F57",
          minimize: "#FEBC2E",
          zoom: "#28C840",
     },

     // 포커스 링은 어떤 표면 위에서도 통과하고, 어떤 선택 상태 색과도 겹치지 않아야 한다.
     // 브랜드 계열을 쓰면 "선택됨"과 "포커스됨"이 같은 빨강으로 보인다.
     focusRing: "#1A1A1A", // 흰 배경 17.4:1 · gamma[900] 위 15.6:1

     button: {
          blue: "#4E87E9",
          primary: "#FE6F6F",
          neutral: {
               100: "#EEF1F3",
               300: "#B6BDC6",
          },
     },
     timeGrid: {
          20: "#FAE7C4",
          40: "#FFDA95",
          60: "#FFB062",
          80: "#FF6F6F",
          100: "#FD2734",
          blur: "#D7D7D7",
          line: "#868686",
          selected: "#FE6F6F",
          select: "#FFA29D",
          hasSchedule: "rgba(240, 201, 130, 0.2)",
     },
};

/**
 * 중립 램프. 숫자가 클수록 밝다(100 = 가장 어두움, 950 = 거의 흰색).
 *
 * 900/800/500 은 원래부터 있던 값이라 고정한다. 바꾸면 전 화면이 흔들린다.
 * 나머지 단계는 코드가 이미 참조하고 있었는데 정의가 없어 `undefined` 로 나갔고,
 * emotion 이 그 선언을 통째로 버려서 색이 조용히 상속값(검정)으로 떨어져 있었다.
 * 여기서 그 구멍을 메운다. 대비 측정값은 specs/design-system.md 표에 있다.
 *
 * 용도 구분:
 *   100~400  글자. 400 이 본문 하한(6.39:1)
 *   500,600  아이콘·비활성·장식. 본문 글자로 쓰지 않는다(3.64:1 / 3.03:1)
 *   700~950  경계선·표면
 */
const gamma = {
     100: "#1A1A1A", // 17.4:1  제목
     200: "#333333", // 12.6:1  강한 본문·소제목
     300: "#454545", //  9.59:1 본문 강조
     400: "#5F5F5F", //  6.39:1 본문 기본
     500: "#868686", //  3.64:1 (고정) 보조 아이콘. 본문 금지
     600: "#949494", //  3.03:1 UI 아이콘 하한. 본문 금지
     700: "#B6B6B6", //  2.03:1 비활성 채움
     800: "#D7D7D7", //  1.44:1 (고정) 장식용 헤어라인
     900: "#F2F2F2", //  1.12:1 (고정) 구분선·옅은 표면
     950: "#FAFAFA", //  1.04:1 가장 옅은 표면
};

const text = {
     primary: "#0D0D0D",
     gamma,
};

/** 4px 배수. 새 컴포넌트는 이 밖의 값을 쓰지 않는다. */
const space = {
     0: "0",
     1: "4px",
     2: "8px",
     3: "12px",
     4: "16px",
     5: "20px",
     6: "24px",
     8: "32px",
     10: "40px",
};

const radius = {
     sm: "8px",
     md: "12px",
     lg: "16px",
     xl: "24px",
     pill: "999px",
};

const font = {
     family: {
          black: '"Pretendard-Black"',
          extraBold: '"Pretendard-ExtraBold"',
          bold: '"Pretendard-Bold"',
          semiBold: '"Pretendard-SemiBold"',
          medium: '"Pretendard-Medium"',
          regular: '"Pretendard-Regular"',
     },
     size: {
          // micro·caption 은 미리보기 목업 전용이다.
          // 같은 정보가 읽을 수 있는 크기로 다른 곳에 또 있을 때만 쓴다.
          micro: "10px",
          caption: "11px",
          footnote: "12px",
          small: "13px",
          label: "14px",
          body: "15px",
          bodyLg: "17px",
          title3: "20px",
          title2: "24px",
          title1: "28px",
          display: "40px",
     },
     lineHeight: {
          tight: 1.2,
          snug: 1.4,
          normal: 1.6,
          relaxed: 1.75,
     },
};

/**
 * 개별 트랜지션 하나는 slow(300ms)를 넘기지 않는다.
 * `sec` 는 같은 값의 초 단위 숫자다. framer-motion 은 초를 받고 CSS 는 문자열을 받는데,
 * 양쪽을 따로 적으면 값이 조용히 어긋난다. 한 곳에서 같이 관리한다.
 */
const duration = {
     fast: "150ms",
     base: "220ms",
     slow: "300ms",
     sec: {
          fast: 0.15,
          base: 0.22,
          slow: 0.3,
     },
};

const easing = {
     standard: "cubic-bezier(0.2, 0, 0, 1)",
     out: "cubic-bezier(0, 0, 0.2, 1)",
     /** 위 문자열과 같은 곡선. framer-motion 의 `ease` 는 배열을 받는다. */
     arr: {
          standard: [0.2, 0, 0, 1],
          out: [0, 0, 0.2, 1],
     },
};

/**
 * 순차 등장·스크롤 진입처럼 "지속 시간"이 아니라 "타이밍"인 값들.
 *
 * 규칙: 개별 트랜지션 ≤ duration.slow(300ms), 누적 지연 창 ≤ staggerMax(250ms),
 * 시퀀스 전체(마지막 요소가 멈추는 시각) ≤ 550ms(specs/design-system.md).
 * framer-motion 에 그대로 넘길 수 있도록 전부 초 단위 숫자다.
 */
const motion = {
     stagger: 0.05, // 항목당 지연 50ms
     staggerMax: 0.25, // 누적 지연 상한 250ms
     riseY: 8, // 진입 시 올라오는 거리(px). reduced-motion 에서는 0
     riseYLarge: 12, // 블록 단위 진입
     /** 선택 원처럼 "붙는" 느낌이 필요한 곳. 안정까지 약 267ms. */
     select: { type: "spring", stiffness: 500, damping: 30 },
     /** whileInView 공통값. once 로 두어 위아래 스크롤에 다시 튀지 않게 한다. */
     viewport: { once: true, amount: 0.2, margin: "0px 0px -8% 0px" },
};

/**
 * 미디어쿼리 경계. 모바일 우선으로 min-width 를 쓴다.
 *
 * sm  1열 → 여백·열 수 조정
 * md  미리보기 카드가 좌우 2열로 갈라지는 지점 (그 아래는 시간표가 위, 패널이 아래)
 * lg  참고용 데스크탑 하한
 * xl  페이지가 좌(폼) / 우(미리보기) 2열로 갈라지는 지점
 */
const breakpoint = {
     sm: "640px",
     md: "880px",
     lg: "1024px",
     xl: "1280px",
};

const shadow = {
     card: "0 6px 24px rgba(0, 0, 0, 0.07)",
     popover: "0 8px 28px rgba(0, 0, 0, 0.14)",
     toast: "0 8px 24px rgba(0, 0, 0, 0.22)",
     raised: "0 10px 28px rgba(0, 0, 0, 0.10)", // 버튼 hover 처럼 살짝 떠오르는 표면
};

const styles = {
     flexCenterRow: `
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    `,
     flexCenterColumn: `
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    `,
     // 화면에서 감추되 스크린리더에는 남긴다. display:none 과 다르다.
     srOnly: `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    `,
     // 시각적으로 작은 컨트롤의 히트 영역을 44px 로 넓힌다.
     // 부모에 position:relative 가 필요하고, 형제 간격이 확장분의 2배 이상이어야 겹치지 않는다.
     hitArea: (insetY, insetX) => `
        position: relative;
        &::before {
            content: "";
            position: absolute;
            top: -${insetY};
            bottom: -${insetY};
            left: -${insetX};
            right: -${insetX};
        }
    `,
};

const theme = {
     color,
     styles,
     text,
     space,
     radius,
     font,
     duration,
     easing,
     motion,
     breakpoint,
     shadow,
};

export default theme;
