/**
 * 랜딩 신뢰 표시(MAU) 시안용 목데이터(2026-10-02 사람 지시: "일단 프론트로 시안, 데이터는 목데이터로").
 * 값은 2026-10-02 운영 조회값(매니저 "사용자" 탭 기준: 최근 30일 고유 방문 브라우저, 관리자·봇 제외)이다.
 * 실제로 쓸 때는 BE 공개 API에서 받는다. 확정 전이라 운영에 내보내지 않는다.
 */
export const MOCK_MAU = { mau: 451, asOf: "2026-10-02" };

/** 이보다 적으면 표시하지 않는다. 작은 숫자는 오히려 신뢰를 깎는다. */
export const MAU_MIN = 100;

/** API 응답을 흉내 낸다. 네트워크처럼 조금 늦게 온다. */
export const fetchMauMock = () =>
  new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_MAU), 400);
  });

/** 숫자가 0에서 끝 값까지 올라가는 시간(ms). */
export const MAU_COUNT_MS = 900;

/** "450+명" 시안: 십 단위로 내려 부풀리지 않는다. 451 → 450 (2026-10-04 사람 지시로 백 단위에서 바꿈) */
export const floorTens = (n) => Math.floor(n / 10) * 10;
