import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { FiLock } from "react-icons/fi";
import t from "./tokens";
import { Card, CardTitle, CardSubtitle, Tag } from "./ui";
import { fetchLandingStats } from "../../api/stats";
import { LANDING_COUNT } from "../start/mauStats";

/**
 * 대시보드 "랜딩 신뢰 표시" 카드(2026-10-04 사람 지시 1번). 랜딩 첫 화면의 "최근 30일 동안 N+명"이 지금 무엇을 보여 주는지
 * 매니저에서 바로 본다. 2026-10-19부터 랜딩 숫자는 사람이 정한 고정값(mauStats LANDING_COUNT, 공유 미리보기 이미지와 같은 숫자)이다.
 * 숫자를 바꿀지 판단하도록 공개 집계(GET /api/stats/landing, 어제까지 30일 참여 등록 건수)를 참고로 함께 보여 준다.
 * 대시보드 "참여 등록 건수"(오늘 포함 30일)와 숫자가 다를 수 있다.
 */
const REASONS = {
  missing: "BE에 집계 경로가 없습니다(배포 전).",
  timeout: "2.5초 안에 응답이 없습니다.",
  invalid: "응답 모양이 계약과 다릅니다.",
  error: "응답을 못 받았습니다.",
};

/** "2026-09-04" → "9월 4일" */
const monthDay = (key) => {
  const [, m, d] = String(key).split("-").map(Number);
  return `${m}월 ${d}일`;
};

/** 탭을 오갈 때마다 다시 묻지 않게 한 번 받은 결과를 페이지가 살아 있는 동안 들고 있는다(값은 하루에 한 번 바뀐다). */
let cached = null;
let inflight = null;
export const resetLandingStatsCache = () => {
  cached = null;
  inflight = null;
};

export default function LandingStatsCard() {
  const [result, setResult] = useState(cached);

  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    inflight = inflight || fetchLandingStats();
    inflight.then((value) => {
      if (value.ok) cached = value;
      inflight = null;
      if (alive) setResult(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card aria-labelledby="landing-stats-title" aria-busy={result === null}>
      <Head>
        <div>
          <CardTitle id="landing-stats-title">랜딩 신뢰 표시</CardTitle>
          <CardSubtitle>첫 화면의 "최근 30일 동안 N+명 타임테이블로 시간을 아꼈어요"가 지금 보여 주는 값</CardSubtitle>
        </div>
        <Tag>
          <FiLock size={13} aria-hidden="true" />
          고정값
        </Tag>
      </Head>
      <Value>{`${LANDING_COUNT.toLocaleString()}+명`}</Value>
      <Caption>사람이 정한 숫자입니다. 공유 미리보기 이미지와 같은 숫자이고 집계가 바뀌어도 그대로입니다.</Caption>
      {/* 참고 집계는 읽기 도구에도 바뀐 결과가 전해지게 상태 영역으로 둔다. */}
      <Live role="status" aria-live="polite">
        {result === null && <Caption>참고 집계 불러오는 중</Caption>}
        {result?.ok && (
          <Caption>
            참고 집계 {result.count.toLocaleString()}건 · {monthDay(result.startDate)}~{monthDay(result.asOf)}(어제까지 {result.days}일) · 한국시간
            자정에 갱신
          </Caption>
        )}
        {result && !result.ok && <Caption>참고 집계를 못 받았습니다. {REASONS[result.reason] || REASONS.error}</Caption>}
      </Live>
      <Caption>
        대시보드 "참여 등록 건수"는 오늘을 포함한 30일이라 참고 집계와 다를 수 있습니다. 같은 사람이 여러 표에 참여하면 여러 번 셉니다.
      </Caption>
    </Card>
  );
}

const Live = styled.div``;

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${t.space(3)};
`;

const Value = styled.p`
  margin-top: ${t.space(3)};
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${t.color.ink};
`;

const Caption = styled.p`
  margin-top: ${t.space(2)};
  font-size: 0.75rem;
  line-height: 1.6;
  color: ${t.color.muted};
`;
