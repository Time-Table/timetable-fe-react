import { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import Swal from "sweetalert2";
import { FiAlertCircle, FiStopCircle } from "react-icons/fi";
import { getLandingAb, stopLandingAb } from "../../api/admin";
import t from "./tokens";
import { Card, CardTitle, CardSubtitle, DataTable, Empty, Loading, Spinner, Tag, Segmented, SegmentedItem, Button } from "./ui";
import LandingChangesCard from "./LandingChangesCard";

/**
 * 매니저 페이지 "A/B 테스트" 탭(2026-09-29). 설계: 하네스 specs/landing-ab-manager.md.
 * 보기 + 중단 버튼 하나. 실험은 사람이 중단을 누를 때까지 돈다. 수는 모두 브라우저 수다.
 */
const DEVICES = [
  { value: "all", label: "전체" },
  { value: "desktop", label: "PC" },
  { value: "mobile", label: "휴대폰" },
];

const SIDES = [
  { key: "v1", short: "A", name: "지금 랜딩" },
  { key: "v2", short: "B", name: "스크롤 이야기" },
];

const VERDICTS = {
  srm_alert: "판정 보류 · 배정 비율 이상",
  insufficient: "판정 보류 · 표본 부족",
  no_difference: "차이 없음",
  v2_better: "B(스크롤 이야기) 우세",
  v1_better: "A(지금 랜딩) 우세",
};

const LOAD_ERRORS = {
  notDeployed: "A/B 결과 API가 아직 배포되지 않았습니다. 백엔드부터 배포하세요.",
  failed: "A/B 결과를 불러오지 못했습니다. 잠시 후 다시 시도하세요.",
};

const formatWhen = (value) =>
  value
    ? new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Seoul",
      }).format(new Date(value))
    : "-";

const pct = (value) => (value === null || value === undefined ? "-" : `${value.toLocaleString()}%`);
const points = (value) => (value === null || value === undefined ? "-" : `${value > 0 ? "+" : ""}${value}%p`);

export default function ExperimentPanel({ focusChangesKey = 0 }) {
  const [device, setDevice] = useState("all");
  const [state, setState] = useState({ loading: true, data: null });
  const [stopError, setStopError] = useState(null);

  const load = useCallback(async (nextDevice) => {
    setState((prev) => ({ ...prev, loading: true }));
    const data = await getLandingAb(nextDevice);
    setState({ loading: false, data });
  }, []);

  useEffect(() => {
    load(device);
  }, [device, load]);

  const stop = async () => {
    const answer = await Swal.fire({
      icon: "warning",
      title: "A/B 테스트를 중단할까요?",
      text: "지금까지의 결과로 고정합니다. 되돌릴 수 없습니다. 랜딩은 남길 쪽을 배포할 때까지 반반으로 보입니다.",
      showCancelButton: true,
      confirmButtonText: "중단",
      cancelButtonText: "취소",
      confirmButtonColor: t.color.critical,
    });
    if (!answer?.isConfirmed) return;
    setStopError(null);
    const res = await stopLandingAb();
    if (res.error === "conflict") {
      setStopError(`이미 ${formatWhen(res.stoppedAt)}에 중단한 실험입니다.`);
    } else if (res.error) {
      setStopError(res.error === "notDeployed" ? LOAD_ERRORS.notDeployed : "중단하지 못했습니다. 잠시 후 다시 시도하세요.");
      return;
    }
    await load(device);
  };

  const { data } = state;
  // 결과를 못 받아도 "기간 중 변경" 카드는 둔다. 변경 목록은 API와 무관하고, 대시보드 표의 "변경" 단추가 여기로 보낸다.
  if (state.loading && !data) {
    return (
      <Stack>
        <Loading>
          <Spinner />
          A/B 결과를 불러오는 중입니다
        </Loading>
        <LandingChangesCard focusKey={focusChangesKey} />
      </Stack>
    );
  }
  if (!data || data.error) {
    return (
      <Stack>
        <Card>
          <Empty>{LOAD_ERRORS[data?.error] || LOAD_ERRORS.failed}</Empty>
        </Card>
        <LandingChangesCard focusKey={focusChangesKey} />
      </Stack>
    );
  }

  const { experiment, assignment, variants, difference, verdict, daily } = data;
  const running = experiment.phase === "running";
  const rule = experiment.rule || { minExposed: 100, minSuccess: 10 };
  const axisMax = Math.max(
    10,
    ...SIDES.map((s) => variants[s.key].primary.ci95?.[1] || 0),
  );

  return (
    <Stack aria-busy={state.loading}>
      <Card>
        <HeadRow>
          <div>
            <CardTitle>
              랜딩 A/B 1회차 <Tag>{running ? "진행 중" : "중단됨"}</Tag>
            </CardTitle>
            <CardSubtitle>
              A 지금 랜딩 · B 스크롤 이야기 · 같은 주소(/)에서 방문자 ID로 {100 - experiment.v2Percent}:{experiment.v2Percent} 배정
            </CardSubtitle>
          </div>
          {running && (
            <Button
              type="button"
              onClick={stop}
              style={{ color: t.color.critical, borderColor: `${t.color.critical}66`, whiteSpace: "nowrap", flexShrink: 0 }}
            >
              <FiStopCircle aria-hidden="true" /> 중단
            </Button>
          )}
        </HeadRow>

        <Facts>
          <div>
            <dt>시작</dt>
            <dd>{formatWhen(experiment.startAt)}</dd>
          </div>
          <div>
            <dt>{running ? "진행" : "중단"}</dt>
            <dd>{running ? `${experiment.day}일째` : `${formatWhen(experiment.stoppedAt)} · ${experiment.day}일 진행`}</dd>
          </div>
          <div>
            <dt>노출</dt>
            <dd>
              A {assignment.v1.toLocaleString()} · B {assignment.v2.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt>기준 시각</dt>
            <dd>{formatWhen(experiment.asOf)}</dd>
          </div>
        </Facts>

        {verdict === "srm_alert" && (
          <Alert role="alert">
            <FiAlertCircle aria-hidden="true" />
            배정 비율이 기대({100 - experiment.v2Percent}:{experiment.v2Percent})와 다릅니다(p = {assignment.srmPValue}). 배정·계측부터 점검하세요.
          </Alert>
        )}
        {experiment.startAtWarning && (
          <Alert role="alert">
            <FiAlertCircle aria-hidden="true" />
            시작 시각보다 앞선 새 계측 기록이 있습니다(첫 기록 {formatWhen(experiment.firstTrackedAt)}). 시작 시각을 확인하세요.
          </Alert>
        )}
        {stopError && <Alert role="alert">{stopError}</Alert>}
        <Note>
          {running
            ? "끝을 정하지 않은 실험입니다. 좋아 보일 때 바로 멈추면 우연한 차이를 결론으로 삼기 쉬우니, 표본 부족을 벗어난 뒤 적어도 2주 더 보고 중단하기를 권합니다."
            : "결과가 고정됐습니다. 랜딩은 아직 반반으로 보입니다. 남길 쪽을 정하면 배포로 바꿉니다."}
          {` 점검용 방문자 ID ${experiment.excludedVisitors}개는 뺐습니다.`}
        </Note>
      </Card>

      <Segmented role="group" aria-label="기기">
        {DEVICES.map((option) => (
          <SegmentedItem
            key={option.value}
            type="button"
            $active={device === option.value}
            aria-pressed={device === option.value}
            onClick={() => setDevice(option.value)}
          >
            {option.label}
          </SegmentedItem>
        ))}
      </Segmented>

      <Card>
        <CardTitle>주 지표 · 랜딩 폼 생성 성공률</CardTitle>
        <CardSubtitle>
          랜딩 방문 브라우저 중 랜딩 폼으로 표를 만든 브라우저. 막대는 95% 구간(Wilson), 세로 선은 비율이고 축은 0~{axisMax}%입니다.
        </CardSubtitle>
        <Verdict data-verdict={verdict}>
          {running && <small>중간 수치 · </small>}
          {VERDICTS[verdict] || verdict}
        </Verdict>
        {verdict === "insufficient" && (
          <Note>
            한쪽이라도 노출 {rule.minExposed}·성공 {rule.minSuccess} 이상이 되어야 판정합니다.
          </Note>
        )}
        <Primary>
          {SIDES.map((side) => {
            const v = variants[side.key];
            const ci = v.primary.ci95;
            return (
              <PrimaryRow key={side.key}>
                <SideName>
                  <b>{side.short}</b> {side.name}
                </SideName>
                <Big>{pct(v.primary.rate)}</Big>
                <Small>
                  {v.primary.count.toLocaleString()} / {v.exposed.toLocaleString()}
                  {ci && ` · 95% 구간 ${pct(ci[0])}~${pct(ci[1])}`}
                </Small>
                <Bar aria-hidden="true">
                  {ci && (
                    <BarRange
                      style={{ left: `${(ci[0] / axisMax) * 100}%`, width: `${Math.max(((ci[1] - ci[0]) / axisMax) * 100, 1)}%` }}
                    />
                  )}
                  {v.primary.rate !== null && <BarPoint style={{ left: `${(v.primary.rate / axisMax) * 100}%` }} />}
                </Bar>
                <Progress>
                  노출 {Math.min(v.exposed, rule.minExposed)}/{rule.minExposed} · 성공 {Math.min(v.primary.count, rule.minSuccess)}/{rule.minSuccess}
                </Progress>
              </PrimaryRow>
            );
          })}
        </Primary>
        <Small>
          차이(B − A) {difference ? `${points(difference.primaryPoints)} · 95% 구간 ${points(difference.ci95[0])}~${points(difference.ci95[1])}` : "-"}
        </Small>
      </Card>

      {/* 실험 중 화면·계측이 바뀐 시각(2026-10-04). 수치를 읽을 때 전후를 나눠 보게 한다. */}
      <LandingChangesCard focusKey={focusChangesKey} />

      <Card style={{ padding: 0 }}>
        <TableHead>
          <CardTitle>단계별</CardTitle>
          <CardSubtitle>기간 안에 그 기록이 있는 노출 브라우저 수. 같은 세션·순서는 보지 않습니다.</CardSubtitle>
        </TableHead>
        <Scroll>
          <DataTable $compact>
            <thead>
              <tr>
                <th>단계</th>
                <th>A 지금 랜딩</th>
                <th>B 스크롤 이야기</th>
                <th>차이(B − A)</th>
              </tr>
            </thead>
            <tbody>
              {variants.v1.steps.map((step, i) => (
                <StepRow key={step.key} label={step.label} a={step} b={variants.v2.steps[i]} />
              ))}
              {variants.v1.extraSteps.map((step, i) => (
                <StepRow key={step.key} label={step.label} a={step} b={variants.v2.extraSteps[i]} muted />
              ))}
            </tbody>
          </DataTable>
        </Scroll>
        {variants.v1.extraSteps.concat(variants.v2.extraSteps).some((s) => s.key === "create_success_unknown" && s.count > 0) && (
          <Note style={{ padding: `0 ${t.space(6)} ${t.space(4)}` }}>경로 없는 생성 성공이 있습니다. 배포 순서(BE → FE)를 점검하세요.</Note>
        )}
      </Card>

      <Card>
        <CardTitle>만든 표의 3인 참여</CardTitle>
        <CardSubtitle>노출 브라우저가 만든 표. 마감이 지난 표 중 서로 다른 이름 3명 이상 등록한 표(3인 참여 달성률과 같은 규칙).</CardSubtitle>
        <TablesGrid>
          {SIDES.map((side) => {
            const { landing, quickCreate } = variants[side.key].tables;
            return (
              <div key={side.key}>
                <SideName>
                  <b>{side.short}</b> {side.name}
                </SideName>
                <Small>
                  랜딩 폼 표 {landing.created} · 마감 {landing.closed} · 3인 달성 {landing.reachedThree}
                  {landing.closed ? ` (${Math.round((landing.reachedThree / landing.closed) * 1000) / 10}%)` : ""}
                </Small>
                <Small $muted>
                  빠른 생성 표 {quickCreate.created} · 마감 {quickCreate.closed} · 3인 달성 {quickCreate.reachedThree}
                </Small>
              </div>
            );
          })}
        </TablesGrid>
      </Card>

      <Card style={{ padding: 0 }}>
        <TableHead>
          <CardTitle>일별 노출</CardTitle>
          <CardSubtitle>처음 랜딩을 본 날(한국시간) 기준. 한쪽으로 쏠리지 않는지 봅니다.</CardSubtitle>
        </TableHead>
        {daily.length === 0 ? (
          <Empty>아직 노출 기록이 없습니다.</Empty>
        ) : (
          <Scroll>
            <DataTable $compact>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>A</th>
                  <th>B</th>
                </tr>
              </thead>
              <tbody>
                {[...daily].reverse().slice(0, 14).map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>{row.v1.toLocaleString()}</td>
                    <td>{row.v2.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Scroll>
        )}
      </Card>

      <Card>
        <CardTitle>Clarity에서 볼 것</CardTitle>
        <CardSubtitle>
          폼이 보인 비율·폼 시작·추천 이름·명단 열기는 서버에 없고 Clarity에만 있습니다. 사용자 지정 태그 tt_landing_variant(v1·v2)로
          나눠 보세요. 이벤트: tt_landing_view_v1 · tt_landing_view_v2 · tt_landing_form_view · tt_landing_form_start ·
          tt_landing_preset · tt_landing_preview_open · tt_create_success_landing
        </CardSubtitle>
      </Card>
    </Stack>
  );
}

function StepRow({ label, a, b, muted }) {
  const diff = a.rate === null || b.rate === null ? null : Math.round((b.rate - a.rate) * 10) / 10;
  return (
    <tr style={muted ? { color: t.color.muted } : undefined}>
      <td>{label}</td>
      <td>
        {a.count.toLocaleString()} <Small as="span">({pct(a.rate)})</Small>
      </td>
      <td>
        {b.count.toLocaleString()} <Small as="span">({pct(b.rate)})</Small>
      </td>
      <td>{points(diff)}</td>
    </tr>
  );
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.space(4)};
`;

const HeadRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${t.space(3)};
`;

const Facts = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${t.space(3)};
  margin: ${t.space(4)} 0 0;

  dt {
    font-size: 0.75rem;
    color: ${t.color.muted};
  }

  dd {
    margin: ${t.space(1)} 0 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${t.color.ink};
  }
`;

const Alert = styled.p`
  display: flex;
  align-items: center;
  gap: ${t.space(2)};
  margin: ${t.space(3)} 0 0;
  padding: ${t.space(2)} ${t.space(3)};
  border: 1px solid ${t.color.critical}40;
  border-radius: ${t.radius.sm};
  font-size: 0.8125rem;
  color: ${t.color.critical};
`;

const Note = styled.p`
  margin: ${t.space(3)} 0 0;
  font-size: 0.75rem;
  line-height: 1.6;
  color: ${t.color.muted};
`;

const Verdict = styled.p`
  margin: ${t.space(3)} 0 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: ${t.color.ink};

  small {
    font-weight: 500;
    color: ${t.color.muted};
  }
`;

const Primary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${t.space(4)};
  margin: ${t.space(4)} 0 ${t.space(3)};
`;

const PrimaryRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.space(1)};
`;

const SideName = styled.p`
  font-size: 0.8125rem;
  color: ${t.color.ink2};

  b {
    color: ${t.color.ink};
  }
`;

const Big = styled.p`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${t.color.ink};
  font-variant-numeric: tabular-nums;
`;

const Small = styled.p`
  font-size: 0.75rem;
  color: ${(p) => (p.$muted ? t.color.muted : t.color.ink2)};
  font-variant-numeric: tabular-nums;
`;

const Bar = styled.div`
  position: relative;
  height: 10px;
  margin-top: ${t.space(1)};
  border-radius: 999px;
  background: ${t.color.surfaceSunken};
`;

const BarRange = styled.span`
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: ${t.color.series1}55;
`;

const BarPoint = styled.span`
  position: absolute;
  top: -2px;
  width: 4px;
  height: 14px;
  margin-left: -2px;
  border-radius: 2px;
  background: ${t.color.series1};
`;

const Progress = styled.p`
  font-size: 0.6875rem;
  color: ${t.color.muted};
`;

const TableHead = styled.div`
  padding: ${t.space(6)} ${t.space(6)} ${t.space(3)};

  @media ${t.media.mobile} {
    padding: ${t.space(4)} ${t.space(4)} ${t.space(2)};
  }
`;

const Scroll = styled.div`
  overflow-x: auto;
`;

const TablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${t.space(4)};
  margin-top: ${t.space(3)};

  & > div {
    display: flex;
    flex-direction: column;
    gap: ${t.space(1)};
  }
`;
