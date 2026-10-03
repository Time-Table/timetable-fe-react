/**
 * 랜딩 신뢰 표시용 목데이터(2026-10-02 사람 지시: "일단 프론트로 시안, 데이터는 목데이터로").
 * 숫자는 최근 30일 참여 등록 건수다(2026-10-04 사람 지시로 방문자 수 451에서 바꿈. 매니저 대시보드 "참여 등록 건수",
 * BE Visiter.todaySignUp의 30일 합. 표에 처음 참여해 시간을 적은 사람 수이고 재로그인은 빼며, 관리자 모드는 세지 않는다).
 * 값은 2026-10-04 운영 조회값(2026-09-05~10-04)이다. 실제로 쓸 때는 BE 공개 API에서 받는다.
 */
export const MOCK_STATS = { count: 223, asOf: "2026-10-04" };

/** 이보다 적으면 표시하지 않는다. 작은 숫자는 오히려 신뢰를 깎는다. */
export const MAU_MIN = 100;

/** API 응답을 흉내 낸다. 네트워크처럼 조금 늦게 온다. */
export const fetchMauMock = () =>
  new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_STATS), 400);
  });

/** 숫자가 0에서 끝 값까지 올라가는 시간(ms). */
export const MAU_COUNT_MS = 900;

/** 십 단위로 내려 부풀리지 않는다. 223 → 220 (2026-10-04 사람 지시로 백 단위에서 바꿈) */
export const floorTens = (n) => Math.floor(n / 10) * 10;
