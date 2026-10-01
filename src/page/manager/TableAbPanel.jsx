import { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import Swal from "sweetalert2";
import { FiAlertCircle, FiPlayCircle, FiStopCircle } from "react-icons/fi";
import { getTableAb, startTableAb, stopTableAb } from "../../api/admin";
import t from "./tokens";
import { Card, CardTitle, CardSubtitle, DataTable, Empty, Loading, Spinner, Tag, Button } from "./ui";

/**
 * 매니저 "A/B 테스트" 탭의 표 화면 2회차(2026-10-01). 설계·계산: 하네스 specs/table-ab-2.md.
 * 상태 + [시작]·[중단](각각 한 번뿐) + 결과. 수는 모두 브라우저(visitorId) 수다.
 */
const STATES = { off: "꺼짐", running: "진행 중", stopped: "중단됨" };
const VERDICTS = {
  srm_alert: "판정 보류 · 배정 비율 이상",
  rule_pending: "판정 기준(최소 인원·기간)을 정하기 전",
  insufficient: "판정 보류 · 표본 부족",
  no_difference: "차이 없음",
  b_preferred: "B(새 화면) 선호",
  a_preferred: "A(기존 화면) 선호",
};
const LOAD_ERRORS = {
  notDeployed: "표 화면 A/B API가 아직 배포되지 않았습니다. 백엔드부터 배포하세요.",
  failed: "표 화면 A/B 결과를 불러오지 못했습니다. 잠시 후 다시 시도하세요.",
};
const REASONS = {
  invalid_input: "입력 형식",
  wrong_password: "비밀번호",
  rate_limited: "요청 제한",
  network: "연결 끊김",
  server: "서버",
  rejected: "저장 거절",
};

const formatWhen = (value) =>
  value
    ? new Intl.DateTimeFormat("ko-KR", {
        month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul",
      }).format(new Date(value))
    : "-";
const pct = (value) => (value === null || value === undefined ? "-" : `${value.toLocaleString()}%`);
const num = (value) => (value === null || value === undefined ? "-" : value.toLocaleString());
const range = (ci) => (ci ? `${pct(ci[0])}~${pct(ci[1])}` : "-");

function PreferenceTable({ pref, caption }) {
  return (
    <DataTable $compact>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">배정</th>
          <th scope="col">교체한 브라우저(순서 불명 제외)</th>
          <th scope="col">B 유지</th>
          <th scope="col">B 유지 비율(95% 구간)</th>
          <th scope="col">순서 불명</th>
        </tr>
      </thead>
      <tbody>
        {["A", "B"].map((arm) => (
          <tr key={arm}>
            <th scope="row">{arm === "A" ? "A 배정" : "B 배정"}</th>
            <td>{num(pref[arm].tried)}</td>
            <td>{num(pref[arm].finalB)}</td>
            <td>
              {pct(pref[arm].rate)} ({range(pref[arm].ci95)})
            </td>
            <td>{num(pref[arm].ambiguous)}</td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}

export default function TableAbPanel() {
  const [state, setState] = useState({ loading: true, data: null });
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const data = await getTableAb();
    setState({ loading: false, data });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (kind) => {
    const starting = kind === "start";
    const answer = await Swal.fire({
      icon: "warning",
      title: starting ? "표 화면 A/B를 시작할까요?" : "표 화면 A/B를 중단할까요?",
      text: starting
        ? "지금부터 표 화면을 연 브라우저가 반반으로 나뉘고 맨 위 띠가 보입니다. 시작은 한 번뿐이고 되돌릴 수 없습니다. 판정 기준(최소 인원·기간)을 먼저 정해 두세요."
        : "지금까지의 결과로 고정하고, 새로 여는 표 화면은 모두 기존 화면(A)이 됩니다. 되돌릴 수 없습니다.",
      showCancelButton: true,
      confirmButtonText: starting ? "시작" : "중단",
      cancelButtonText: "취소",
      confirmButtonColor: starting ? t.color.accent : t.color.critical,
    });
    if (!answer?.isConfirmed) return;
    setActionError(null);
    const res = starting ? await startTableAb() : await stopTableAb();
    if (res.error === "conflict") {
      setActionError(starting ? "이미 시작한 실험입니다." : "시작하지 않았거나 이미 중단한 실험입니다.");
    } else if (res.error) {
      setActionError(res.error === "notDeployed" ? LOAD_ERRORS.notDeployed : "처리하지 못했습니다. 잠시 후 다시 시도하세요.");
      return;
    }
    await load();
  };

  const { data } = state;
  if (state.loading && !data) {
    return (
      <Loading>
        <Spinner />
        표 화면 A/B를 불러오는 중입니다
      </Loading>
    );
  }
  if (!data || data.error) {
    return (
      <Card>
        <Empty>{LOAD_ERRORS[data?.error] || LOAD_ERRORS.failed}</Empty>
      </Card>
    );
  }

  const { experiment } = data;
  const status = experiment.state;
  const head = (
    <Card>
      <HeadRow>
        <div>
          <CardTitle>
            표 화면 A/B 2회차 <Tag>{STATES[status] || status}</Tag>
          </CardTitle>
          <CardSubtitle>
            A 기존 화면 · B 새 화면 · 브라우저(방문자 ID)마다 반반, 누구나 맨 위 띠로 바꿈 · 판정은 화면을 교체한 브라우저가 마감 때 유지한 화면
          </CardSubtitle>
        </div>
        {status === "off" && (
          <Button type="button" onClick={() => act("start")} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
            <FiPlayCircle aria-hidden="true" /> 시작
          </Button>
        )}
        {status === "running" && (
          <Button
            type="button"
            onClick={() => act("stop")}
            style={{ color: t.color.critical, borderColor: `${t.color.critical}66`, whiteSpace: "nowrap", flexShrink: 0 }}
          >
            <FiStopCircle aria-hidden="true" /> 중단
          </Button>
        )}
      </HeadRow>
      {status !== "off" && (
        <Facts>
          <div>
            <dt>시작</dt>
            <dd>{formatWhen(experiment.startedAt)}</dd>
          </div>
          <div>
            <dt>{status === "running" ? "진행" : "중단"}</dt>
            <dd>{status === "running" ? `${experiment.day}일째` : `${formatWhen(experiment.stoppedAt)} · ${experiment.day}일 진행`}</dd>
          </div>
          <div>
            <dt>기준 시각</dt>
            <dd>{formatWhen(experiment.asOf)}</dd>
          </div>
        </Facts>
      )}
      {actionError && <Alert role="alert">{actionError}</Alert>}
      <Note>
        {status === "off"
          ? "꺼져 있어 모두 기존 화면(A)을 보고 띠도 없습니다. 시작 전에 판정 기준(배정별 최소 '교체한 브라우저' 수와 기간)을 정하세요."
          : `유지한 화면 = 그 브라우저가 본 대상 표 중 가장 늦은 마감 때의 선택(어느 표에서든 마지막으로 보거나 바꾼 화면). 교체한 브라우저 = 그때까지 A·B를 모두 본 브라우저. 대상 표 = 마감이 지났고 마감까지 3명 이상 참여 등록, 마감이 시작 뒤 ${experiment.maxDeadlineDays}일 안.`}
      </Note>
    </Card>
  );
  if (status === "off") return <Stack>{head}</Stack>;

  const { assignment, tables, preference, failures, joins, votes, verdict } = data;
  const pref = preference.conditional;
  return (
    <Stack aria-busy={state.loading}>
      {head}
      <Card>
        <CardTitle>주 지표 · 교체한 브라우저가 마감 때 유지한 화면(조건부 선호)</CardTitle>
        <CardSubtitle>
          대상 표 {num(tables.qualifying)}개(마감된 표 {num(tables.closed)}개 중, 만든 뒤 날짜·시간을 바꾼 표 {num(tables.changed)}개 포함). 배정별 B 유지 비율의 평균이
          50%보다 높으면 B 선호. 무작위 전체의 화면 효과가 아니라 화면을 교체해 본 사람의 선호입니다.
        </CardSubtitle>
        <Verdict data-verdict={verdict}>
          {status === "running" && <small>중간 수치 · </small>}
          {VERDICTS[verdict] || verdict}
        </Verdict>
        {verdict === "srm_alert" && (
          <Alert role="alert">
            <FiAlertCircle aria-hidden="true" />
            배정 비율이 50:50과 다릅니다(p = {assignment.srmPValue}). 배정·계측부터 점검하세요.
          </Alert>
        )}
        <Big>
          평균 {pct(pref.mean)} <small>(95% 구간 {range(pref.ci95)})</small>
        </Big>
        <PreferenceTable pref={pref} caption="대상 표 기준 조건부 선호" />
        <Note>
          모든 표 기준 평균 {pct(preference.allTables.mean)}({range(preference.allTables.ci95)}) · 교체한 비율 A 배정 {pct(preference.triedShare.A)} · B 배정{" "}
          {pct(preference.triedShare.B)} · 실험 전 기록이 관측된 브라우저 평균 {pct(preference.byHistory.observed.mean)}, 안 된 브라우저{" "}
          {pct(preference.byHistory.notObserved.mean)}
        </Note>
      </Card>

      <Card>
        <CardTitle>배정 점검</CardTitle>
        <DataTable $compact>
          <caption className="sr-only">배정 점검</caption>
          <thead>
            <tr>
              <th scope="col">배정</th>
              <th scope="col">화면이 보인 브라우저</th>
              <th scope="col">상태를 못 받아 A로 본 브라우저</th>
            </tr>
          </thead>
          <tbody>
            {["A", "B"].map((arm) => (
              <tr key={arm}>
                <th scope="row">{arm}</th>
                <td>{num(assignment[arm])}</td>
                <td>{num(assignment.stateFailOnly[arm])}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        <Note>50:50 검사 p = {assignment.srmPValue ?? "-"} (0.01보다 작으면 판정 보류)</Note>
      </Card>

      <Card>
        <CardTitle>실패</CardTitle>
        <CardSubtitle>요청 기준 실패율과, 시도한 브라우저 중 한 번이라도 실패를 겪은 비율을 따로 봅니다. 화면은 그 기록 때의 화면입니다.</CardSubtitle>
        <DataTable $compact>
          <caption className="sr-only">화면별 실패</caption>
          <thead>
            <tr>
              <th scope="col">항목</th>
              <th scope="col">A</th>
              <th scope="col">B</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">참여 요청 실패율</th>
              {["A", "B"].map((ui) => (
                <td key={ui}>
                  {pct(failures[ui].join.rate)} ({num(failures[ui].join.failed)}/{num(failures[ui].join.requests)})
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">참여 입력 오류율</th>
              {["A", "B"].map((ui) => (
                <td key={ui}>
                  {pct(failures[ui].join.invalidRate)} ({num(failures[ui].join.invalidInput)})
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">참여 실패를 겪은 브라우저</th>
              {["A", "B"].map((ui) => (
                <td key={ui}>
                  {pct(failures[ui].join.peopleRate)} ({num(failures[ui].join.peopleFailed)}/{num(failures[ui].join.people)})
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">참여 실패 이유</th>
              {["A", "B"].map((ui) => (
                <td key={ui}>
                  {Object.entries(failures[ui].join.byReason || {})
                    .map(([reason, count]) => `${REASONS[reason] || reason} ${count}`)
                    .join(" · ") || "-"}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">저장 실패율</th>
              {["A", "B"].map((ui) => (
                <td key={ui}>
                  {pct(failures[ui].save.rate)} ({num(failures[ui].save.failed)}/{num(failures[ui].save.attempts)})
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">저장 실패를 겪은 브라우저</th>
              {["A", "B"].map((ui) => (
                <td key={ui}>
                  {pct(failures[ui].save.peopleRate)} ({num(failures[ui].save.peopleFailed)}/{num(failures[ui].save.people)})
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">새 화면 불러오기</th>
              <td>-</td>
              <td>
                재시도 {pct(failures.B.load.retryRate)} · 끝내 실패 {pct(failures.B.load.failedRate)} ({num(failures.B.load.failed)}/{num(failures.B.load.people)})
              </td>
            </tr>
          </tbody>
        </DataTable>
      </Card>

      {votes && (
        <Card>
          <CardTitle>하트 투표</CardTitle>
          <CardSubtitle>띠의 하트로 고른 화면. 브라우저마다 마지막 표 하나(취소하면 빠짐). 판정에는 쓰지 않습니다.</CardSubtitle>
          <Big>
            기존 화면 {num(votes.A)}표 · 새 화면 {num(votes.B)}표
          </Big>
          <Note>
            투표율 {pct(votes.rate)} (투표한 브라우저 {num(votes.voters)} / 화면을 본 브라우저 {num(votes.exposed)})
          </Note>
        </Card>
      )}

      <Card>
        <CardTitle>참고</CardTitle>
        <Note>
          참여 성공: A 새 참여 {num(joins.A.new)} · 다시 들어옴 {num(joins.A.returning)} / B 새 참여 {num(joins.B.new)} · 다시 들어옴 {num(joins.B.returning)}.
          배정은 브라우저마다 정해진 값이라, 다른 표에서 이미 화면을 바꾼 브라우저는 배정과 다른 화면으로 열립니다.
          새 화면은 입력 중에 공유·순위 단추가 숨어 누를 기회가 기존 화면과 다릅니다. 같은 사람이 다른 기기를 쓰면 다른 브라우저로 셉니다.
        </Note>
      </Card>
    </Stack>
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
  gap: 12px;
`;

const Facts = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin: 12px 0 0;
  div {
    display: flex;
    gap: 8px;
  }
  dt {
    color: ${t.color.muted};
  }
  dd {
    margin: 0;
  }
`;

const Alert = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
  color: ${t.color.critical};
`;

const Note = styled.p`
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: ${t.color.muted};
`;

const Verdict = styled.p`
  margin: 12px 0 0;
  font-weight: 700;
  small {
    font-weight: 400;
  }
`;

const Big = styled.p`
  margin: 8px 0 12px;
  font-size: 22px;
  font-weight: 700;
  small {
    font-size: 13px;
    font-weight: 400;
  }
`;
