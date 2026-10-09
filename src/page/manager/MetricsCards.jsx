import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { FiAlertCircle } from "react-icons/fi";
import t from "./tokens";
import { Card, CardTitle, CardSubtitle, Grid, Tag, DataTable, Button } from "./ui";
import StatTile from "./StatTile";
import Explain from "./Explain";
import { getMetricsOverview } from "../../api/admin";

/**
 * 핵심 유저 지표 카드(2026-10-09 사람 지시 "중요한 유저 지표 모아서 백오피스 … 업데이트", 하네스 specs/metrics.md).
 * 서버 GET /api/admin/metrics/overview 하나를 세 탭이 나눠 보여 준다.
 * - 대시보드: 핵심 지표 7칸(방문자·만든 표·초대 도달·3인 달성·입력 완료·공통 시간·실패율), 직전 같은 기간 대비.
 * - 3인 참여 달성률: 표 유형별 달성, 3명 모이는 데 걸린 시간, 입력 완료·공통 시간.
 * - 사용자 분석: 출처별 생성 전환, 7일·28일 재방문, 다시 만드는 사람.
 * 수치는 서버 기록 기준이라 GA·Clarity와 다를 수 있다. 응답에는 이름·브라우저 ID·표 ID가 없다.
 */

const pct = (value) => (value === null || value === undefined ? "—" : `${value}%`);
const pp = (now, before) =>
  typeof now === "number" && typeof before === "number" ? Math.round((now - before) * 10) / 10 : null;
const change = (now, before) =>
  typeof now === "number" && typeof before === "number" && before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null;

/** 기간마다 한 번 묻는다. 실패와 BE 미배포(404)를 나눈다. */
function useMetrics(days) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setState({ loading: true, data: null, error: null });
    Promise.resolve(getMetricsOverview(days))
      .catch(() => null)
      .then((res) => {
        if (!alive) return;
        if (res?.error || !res?.current) setState({ loading: false, data: null, error: res?.error || "failed" });
        else setState({ loading: false, data: res, error: null });
      });
    return () => {
      alive = false;
    };
  }, [days, retry]);
  return { ...state, reload: () => setRetry((n) => n + 1) };
}

const StatusTag = ({ loading, error }) =>
  loading ? (
    <Tag role="status">불러오는 중</Tag>
  ) : error ? (
    <Tag $tone="critical">
      <FiAlertCircle size={13} aria-hidden="true" />
      {error === "notDeployed" ? "BE 배포 전" : "응답 실패"}
    </Tag>
  ) : null;

const Failure = ({ error, onRetry }) => (
  <Caption role="status">
    {error === "notDeployed"
      ? "BE에 지표 경로가 아직 없습니다. BE를 먼저 배포하면 보입니다."
      : "지표를 불러오지 못했습니다. "}
    {error !== "notDeployed" && (
      <Button type="button" onClick={onRetry}>
        다시 조회
      </Button>
    )}
  </Caption>
);

const periodText = (data) =>
  data.days ? `${data.startDate} ~ ${data.endDate}(${data.days}일), 직전 ${data.days}일과 비교` : `전체 기간(기록 보관 안), ${data.endDate}까지`;

/** 대시보드: 핵심 지표 7칸. */
export function CoreMetricsCard({ days }) {
  const { loading, data, error, reload } = useMetrics(days);
  const cur = data?.current;
  const prev = data?.previous;
  const compare = Boolean(prev);
  const label = data?.days ? `직전 ${data.days}일 대비` : undefined;
  return (
    <Card aria-labelledby="core-metrics-title" aria-busy={loading}>
      <Head>
        <div>
          <CardTitle id="core-metrics-title">핵심 유저 지표</CardTitle>
          <CardSubtitle>{data ? periodText(data) : "선택 기간의 서버 기록"}</CardSubtitle>
        </div>
        <StatusTag loading={loading} error={error} />
      </Head>
      {error && <Failure error={error} onRetry={reload} />}
      {cur && (
        <>
          <Explain label="지표 설명">
            <Caption>
              서버 기록 기준이라 GA·Clarity 수치와 다를 수 있습니다. 표 단위 결과(3인 달성·입력 완료·공통 시간)는 마감이 기간 안에 끝난 표,
              초대 도달은 생성 7일이 기간 안에 끝난 표를 봅니다. 비율 변화는 %p(퍼센트포인트)입니다. 관리자가 만든 표와 관리자 브라우저 기록은 빠집니다.
              {data.eventsSince && ` 행동 기록은 ${data.eventsSince}부터 남아 있습니다(180일 보관).`}
            </Caption>
          </Explain>
          <Grid $min="190px" $mobileCols={2}>
            <StatTile
              label="방문자"
              value={cur.activity.visitors}
              delta={compare ? change(cur.activity.visitors, prev.activity.visitors) : undefined}
              deltaLabel={label}
              showComparison={compare}
              hint="기록을 남긴 서로 다른 브라우저"
            />
            <StatTile
              label="만든 표"
              value={cur.activity.tables.total}
              delta={compare ? change(cur.activity.tables.total, prev.activity.tables.total) : undefined}
              deltaLabel={label}
              showComparison={compare}
              hint={`날짜 투표 ${cur.activity.tables.date}개(${pct(cur.activity.tables.dateRate)}) · 시간 표 ${cur.activity.tables.time}개`}
            />
            <StatTile
              label="초대 도달"
              value={pct(cur.invite.rate)}
              delta={compare ? pp(cur.invite.rate, prev.invite.rate) : undefined}
              deltaUnit="%p"
              deltaLabel={label}
              showComparison={compare}
              hint={`생성 7일 안에 만든 사람이 아닌 브라우저가 연 표 · 판정 ${cur.invite.judged}개 · 진행 중 ${cur.invite.ongoing}개 중 ${cur.invite.ongoingReached}개 도달`}
            />
            <StatTile
              label="3인 달성"
              value={pct(cur.outcomes.rate)}
              delta={compare ? pp(cur.outcomes.rate, prev.outcomes.rate) : undefined}
              deltaUnit="%p"
              deltaLabel={label}
              showComparison={compare}
              hint={`마감된 표 ${cur.outcomes.ended}개 중 ${cur.outcomes.achieved}개가 마감까지 3명 이상 등록`}
            />
            <StatTile
              label="입력 완료"
              value={pct(cur.outcomes.input.rate)}
              delta={compare ? pp(cur.outcomes.input.rate, prev.outcomes.input.rate) : undefined}
              deltaUnit="%p"
              deltaLabel={label}
              showComparison={compare}
              hint={`마감된 표 등록자 ${cur.outcomes.input.registered}명 중 ${cur.outcomes.input.withInput}명이 가능한 시간·날짜를 저장`}
            />
            <StatTile
              label="공통 시간 있음"
              value={pct(cur.outcomes.common.rate)}
              delta={compare ? pp(cur.outcomes.common.rate, prev.outcomes.common.rate) : undefined}
              deltaUnit="%p"
              deltaLabel={label}
              showComparison={compare}
              hint={`2명 이상 넣은 마감 표 ${cur.outcomes.common.tables}개 중 넣은 사람 모두 되는 칸이 있는 표`}
            />
            <StatTile
              label="참여·저장 실패율"
              value={pct(cur.failures.rate)}
              delta={compare ? pp(cur.failures.rate, prev.failures.rate) : undefined}
              deltaUnit="%p"
              deltaLabel={label}
              showComparison={compare}
              higherIsBetter={false}
              hint={`참여 ${cur.failures.join.failed}/${cur.failures.join.submits} · 저장 ${cur.failures.save.failed}/${cur.failures.save.attempts} · 새 화면 조각 실패 ${cur.failures.load.failed}`}
            />
          </Grid>
        </>
      )}
    </Card>
  );
}

/** 3인 참여 달성률 탭: 표 유형별 결과와 3명 모이는 데 걸린 시간. */
export function OutcomeCard({ days }) {
  const { loading, data, error, reload } = useMetrics(days);
  const o = data?.current?.outcomes;
  const hours = o?.timeTo3?.medianHours;
  return (
    <Card aria-labelledby="outcome-title" aria-busy={loading}>
      <Head>
        <div>
          <CardTitle id="outcome-title">표 유형별 결과</CardTitle>
          <CardSubtitle>{data ? `마감이 ${data.days ? `${data.startDate} 이후` : "지금까지"} 끝난 표 · 시간 표와 날짜 투표 표` : "마감된 표"}</CardSubtitle>
        </div>
        <StatusTag loading={loading} error={error} />
      </Head>
      {error && <Failure error={error} onRetry={reload} />}
      {o && (
        <>
          <Grid $min="190px" $mobileCols={2}>
            <StatTile label="시간 표 3인 달성" value={pct(o.byType.time.rate)} showComparison={false} hint={`마감 ${o.byType.time.ended}개 중 ${o.byType.time.achieved}개`} />
            <StatTile label="날짜 투표 3인 달성" value={pct(o.byType.date.rate)} showComparison={false} hint={`마감 ${o.byType.date.ended}개 중 ${o.byType.date.achieved}개`} />
            <StatTile
              label="3명 모이는 데 걸린 시간"
              value={hours === null || hours === undefined ? "—" : hours < 48 ? `${hours}시간` : `${Math.round((hours / 24) * 10) / 10}일`}
              showComparison={false}
              hint={`3인 달성한 표 ${o.timeTo3.tables}개의 중앙값(생성 → 세 번째 이름 등록)`}
            />
            <StatTile label="입력 완료" value={pct(o.input.rate)} showComparison={false} hint={`등록자 ${o.input.registered}명 중 ${o.input.withInput}명`} />
            <StatTile label="공통 시간 있음" value={pct(o.common.rate)} showComparison={false} hint={`2명 이상 넣은 표 ${o.common.tables}개 중 ${o.common.withCommon}개`} />
          </Grid>
          <Caption>
            등록·입력은 지금 남은 기록 기준입니다(참여 취소·표 삭제로 줄어듦). 입력 완료와 공통 시간은 저장된 값이 그 표의 칸(날짜 투표 표는 후보 날짜)일 때만 셉니다.
          </Caption>
        </>
      )}
    </Card>
  );
}

/** 사용자 분석 탭: 출처별 생성 전환, 재방문, 다시 만드는 사람. */
export function GrowthCard({ days }) {
  const { loading, data, error, reload } = useMetrics(days);
  const creators = data?.current?.creators;
  const retention = data?.retention;
  return (
    <Card aria-labelledby="growth-title" aria-busy={loading}>
      <Head>
        <div>
          <CardTitle id="growth-title">유입·재방문·다시 만들기</CardTitle>
          <CardSubtitle>{data ? periodText(data).split(",")[0] : "선택 기간의 서버 기록"}</CardSubtitle>
        </div>
        <StatusTag loading={loading} error={error} />
      </Head>
      {error && <Failure error={error} onRetry={reload} />}
      {data && (
        <>
          <Grid $min="190px" $mobileCols={2}>
            <StatTile
              label="7일 재방문"
              value={pct(retention.d7.rate)}
              showComparison={false}
              hint={`첫 방문이 기간 안인 브라우저 중 7일 안 다른 날 다시 옴 · ${retention.d7.returned}/${retention.d7.eligible}`}
            />
            <StatTile
              label="28일 재방문"
              value={pct(retention.d28.rate)}
              showComparison={false}
              hint={`같은 기준 28일 · ${retention.d28.returned}/${retention.d28.eligible}`}
            />
            <StatTile
              label="표 2개 이상 만든 사람"
              value={pct(creators.repeatRate)}
              showComparison={false}
              hint={`기간에 표를 만든 브라우저 ${creators.creators}명 중 ${creators.repeat}명`}
            />
            <StatTile
              label="다시 온 생성자"
              value={pct(creators.returningRate)}
              showComparison={false}
              hint={creators.returning === null ? "전체 기간은 기간 전 생성이 없어 비교 불가" : `기간 전에도 표를 만든 적 있는 브라우저 ${creators.returning}명`}
            />
          </Grid>
          <TableWrap>
            <DataTable>
              <caption>출처별 랜딩 방문과 생성 전환</caption>
              <thead>
                <tr>
                  <th scope="col">첫 유입 출처</th>
                  <th scope="col" className="num">
                    랜딩 방문 브라우저
                  </th>
                  <th scope="col" className="num">
                    생성 성공
                  </th>
                  <th scope="col" className="num">
                    전환율
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.sources.length === 0 ? (
                  <tr>
                    <td colSpan={4}>기간에 랜딩 방문 기록이 없습니다.</td>
                  </tr>
                ) : (
                  data.sources.map((row) => (
                    <tr key={row.rest ? "__rest" : row.label}>
                      <td>{row.label}</td>
                      <td className="num">{row.visitors.toLocaleString()}</td>
                      <td className="num">{row.converted.toLocaleString()}</td>
                      <td className="num">{pct(row.rate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </DataTable>
          </TableWrap>
          <Caption>
            출처는 브라우저가 처음 들어온 곳(first-touch)입니다. 생성 성공은 같은 기간 랜딩 폼·빠른 생성 모두를 셉니다. 같은 세션·순서를 보장하지 않습니다.
          </Caption>
        </>
      )}
    </Card>
  );
}

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${t.space(3)};
  margin-bottom: ${t.space(3)};
`;

const Caption = styled.p`
  margin-top: ${t.space(3)};
  font-size: 0.75rem;
  line-height: 1.6;
  color: ${t.color.muted};

  button {
    margin-left: ${t.space(2)};
  }
`;

const TableWrap = styled.div`
  margin-top: ${t.space(4)};
  overflow-x: auto;
`;
