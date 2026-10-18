/**
 * 랜딩 신뢰 표시 숫자의 규칙.
 * 2026-10-19 사람 지시("랜딩페이지에 집계도 300+로 통일해")로 집계 API(최근 30일 참여 등록 건수) 대신 사람이 정한 고정값을 쓴다.
 * 공유 미리보기 이미지(public/index.html og:image, og-image-300.png)와 같은 숫자다. 바꿀 때는 둘 다 바꾼다.
 */

/** 랜딩에 "N+명"으로 보이는 숫자. */
export const LANDING_COUNT = 300;

/** 숫자가 0에서 끝 값까지 올라가는 시간(ms). */
export const MAU_COUNT_MS = 900;
