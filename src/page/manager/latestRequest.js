/**
 * 비동기 응답 순서 가드. 순수 함수라 DOM 없이 테스트한다.
 *
 * 관리자 콘솔은 기간·탭을 바꿀 때마다 새 요청을 보내는데, 먼저 보낸 요청의 응답이 나중에 도착하면
 * 최신 화면을 덮거나 로딩 표시를 조기에 끈다. 요청마다 순번을 받고, 응답을 반영하기 전에
 * "내가 아직 최신인가"를 묻는다.
 */
export const createRequestSequence = () => {
  let current = 0;
  return {
    /** 새 요청을 시작한다. 돌려주는 함수는 그 요청이 아직 최신이면 true다. */
    next: () => {
      current += 1;
      const mine = current;
      return () => mine === current;
    },
  };
};
