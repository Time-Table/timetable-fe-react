/**
 * 후보 날짜로 고를 수 있는 마지막 날. 이번 달부터 12개월 뒤 달의 말일이다.
 * 랜딩(`/`)과 빠른 생성(`/quick-create`) 달력이 같은 날까지 열리도록 두 곳이 이 함수를 쓴다
 * (2026-09-28 사람 결정).
 *
 * 날짜에 개월을 더하지 않고 달 번호로 센다. 예전 빠른 생성 달력은 오늘에 11개월을 더했는데,
 * 29~31일에는 없는 날(예: 9월 31일)이 다음 달로 넘어가 한 달이 더 열렸다.
 */
export const getLastSelectableDate = (today = new Date()) =>
  new Date(today.getFullYear(), today.getMonth() + 13, 0);

/** 달 번호(연도×12 + 월). 두 날짜가 같은 달인지, 어느 달이 뒤인지 비교할 때 쓴다. */
export const monthIndex = (date) => date.getFullYear() * 12 + date.getMonth();
