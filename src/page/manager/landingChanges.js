/**
 * 랜딩 A/B 1회차 기간 중 화면·계측 변경 기록(2026-10-04 사람 지시 3번: 변경 시각을 화면에서도 보이게).
 * 정본은 하네스 specs/product.md "랜딩 A/B 1회차" 절이다. 거기에 적을 때 여기에도 한 줄 더한다.
 * at은 운영 반영 시각(KST, 운영 번들을 처음 확인한 때). side는 어느 쪽이 바뀌었는지: "A" | "B" | "AB"(둘 다) | "계측".
 * 두 쪽이 같이 바뀐 변경은 A·B 비교에는 중립이지만 전환율 추이는 전후로 나눠 본다.
 */
export const LANDING_CHANGES = [
  { at: "2026-09-29T01:22:57+09:00", side: "AB", title: "A/B 1회차 시작(startAt)", detail: "FE 20d3e3f 운영 반영. 이 시각부터 집계" },
  { at: "2026-09-29T02:38:00+09:00", side: "B", title: "B PC 스크롤 안내 첫 등장 애니메이션·글자 21px", detail: "FE 40e031d" },
  { at: "2026-09-30T00:29:00+09:00", side: "계측", title: "봇 요청의 방문·이벤트 저장 안 함", detail: "BE 39f1fbb. 전후로 방문·랜딩 수가 줄 수 있음" },
  { at: "2026-10-02T00:01:47+09:00", side: "AB", title: "B 휴대폰 첫 화면 폼 끌어올리기·소개, A·B 새로고침 맨 위", detail: "FE dfce31f·67ffb01" },
  { at: "2026-10-02T00:54:01+09:00", side: "AB", title: "미리보기 기본 주(고른 날이 많은 주)", detail: "FE 82e9290" },
  { at: "2026-10-04T01:38:00+09:00", side: "AB", title: "신뢰 표시 세 줄, 휴대폰 만들기 버튼 폼 아래, A 문구 줄·흐림", detail: "FE 9ea772d·8715151" },
  { at: "2026-10-04T02:26:00+09:00", side: "AB", title: "신뢰 표시 숫자를 집계 API로(100명 이하 숨김)", detail: "FE aa9926a·42260a8·52f3013, BE 3debd10·6956990" },
  { at: "2026-10-04T02:42:44+09:00", side: "AB", title: "A PC 신뢰 표시 두 줄 배치, 숫자 색 primary", detail: "FE f7451e6·41d6f5a" },
];

const KST = "Asia/Seoul";

/**
 * 변경 시각을 한국시간 조각(년·월·일·시·분)으로 나눈다. 실행 환경 시간대와 로케일 표기에 기대지 않는다
 * (timeZone 고정, hourCycle h23이라 자정은 "24"가 아니라 "00").
 */
const kstParts = (at) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: KST,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(at))
      .map((part) => [part.type, part.value])
  );

/** 변경 시각의 한국시간 날짜(YYYY-MM-DD). */
export const changeDate = (change) => {
  const p = kstParts(change.at);
  return `${p.year}-${p.month}-${p.day}`;
};

/** 그날(YYYY-MM-DD, KST)에 반영된 변경 목록. 일별 추이 표에서 쓴다. */
export const changesOn = (date) => LANDING_CHANGES.filter((c) => changeDate(c) === date);

/** 변경 시각을 "10-04 02:42"처럼 짧게(KST). */
export const formatChangeTime = (change) => {
  const p = kstParts(change.at);
  return `${p.month}-${p.day} ${p.hour}:${p.minute}`;
};

export const SIDE_LABELS = { A: "A만", B: "B만", AB: "A·B 둘 다", 계측: "계측" };
