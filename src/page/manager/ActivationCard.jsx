import styled from "@emotion/styled";
import { Card, CardTitle, CardSubtitle, Grid, Tag } from "./ui";
import StatTile from "./StatTile";
import t from "./tokens";

const date = (value) => value ? new Date(value).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) : null;

export default function ActivationCard({ report }) {
  if (!report || report.version !== 1 || report.status === "unavailable") {
    return (
      <Card>
        <CardTitle>3인 입력 달성률</CardTitle>
        <Copy role="status">
          {!report ? "새 지표 수집이 아직 연결되지 않았습니다." : "새 지표를 불러오지 못했습니다. 잠시 후 다시 조회해 주세요."}
          {" "}아래 기존 퍼널은 계속 확인할 수 있습니다.
        </Copy>
      </Card>
    );
  }
  const { ended, ongoing, quality, period } = report;
  const partial = report.status === "partial";
  const rate = ended.ratePercent === null ? "—" : `${ended.ratePercent}%`;
  const range = period.startAt ? `${date(period.startAt)} ~ ${date(period.endAt)}` : `수집 시작 ~ ${date(period.endAt)}`;

  return (
    <Card>
      <Header>
        <div>
          <CardTitle>3인 입력 달성률</CardTitle>
          <CardSubtitle>대표 지표 · 생성 당시 종료일 기준 · 한국시간</CardSubtitle>
        </div>
        <Tag $tone={partial ? "critical" : undefined}>
          {partial ? "! 수집 불완전" : "서버 수집"}
        </Tag>
      </Header>
      <Copy>
        생성자를 포함해 서로 다른 참여자 3명 이상이 가능한 시간을 1칸 이상 저장한 표를 셉니다.
        마감 전 달성한 이력은 참여 취소나 전체 지우기 뒤에도 유지합니다.
      </Copy>
      <Period>{range}에 종료된 표</Period>
      <Grid $min="180px">
        <StatTile showComparison={false} label="종료된 표의 달성률" value={partial ? "—" : rate}
          hint={partial ? "수집 공백 확인이 필요해 비율을 표시하지 않습니다." : ended.total === 0 ? "종료된 집계 대상 표가 없습니다." : `달성 ${ended.achieved}개 / 종료 ${ended.total}개`} />
        <StatTile showComparison={false} label="종료 · 달성" value={ended.achieved} hint="마감까지 3명 입력 이력 확인" />
        <StatTile showComparison={false} label="종료 · 미달" value={ended.notAchieved} hint="수집 불완전 표는 미달로 세지 않음" />
        <StatTile showComparison={false} label="종료 · 수집 불완전" value={ended.incomplete} hint="입력 이력 누락 가능성 있음" />
      </Grid>
      <SubTitle>진행 중인 표 · 전체 수집 기간</SubTitle>
      <Grid $min="180px">
        <StatTile showComparison={false} label="이미 달성" value={ongoing.achieved} hint="종료 전이므로 위 비율에서 제외" />
        <StatTile showComparison={false} label="아직 미달" value={ongoing.notAchieved} hint="마감 전 추가 입력 가능" />
        <StatTile showComparison={false} label="수집 불완전" value={ongoing.incomplete} hint="달성 표와 중복될 수 있음" />
      </Grid>
      <Copy>
        새 수집을 적용한 뒤 생성된 표부터 집계합니다.
        {report.firstCollectedAt && ` 최초 집계 대상 생성일: ${date(report.firstCollectedAt)}.`}
        {" "}같은 표에서 같은 이름은 취소 후 다시 참여해도 한 명으로 셉니다.
        실제 인원 확인이나 약속 확정을 뜻하지 않습니다.
      </Copy>
      <Details>
        <summary>집계 범위와 데이터 품질</summary>
        <Copy>
          아래 건수는 선택 기간과 무관한 전체 수집 범위입니다.
          기존 표 {quality.legacyTables}개(현재 남아 있는 표), 관리자 생성 {quality.excludedAdminTables}개,
          기간 오류 {quality.invalidTables}개는 달성률에서 제외합니다.
          분석 기록 누락 {quality.missingLedgers}개는 수집 불완전으로 표시합니다.
          기간을 분류할 수 없는 기록은 위 종료·진행 중 건수에 포함되지 않을 수 있습니다.
        </Copy>
        <Copy>
          생성 후 일정 조건이 바뀐 표: {quality.scheduleChangedTables}개.
          분석 마감은 생성 당시 마지막 후보 날짜의 종료 시각으로 고정합니다.
          표를 삭제해도 분석 이력은 유지됩니다.
        </Copy>
        <Copy>
          사용자 저장 성공을 우선하므로 장애 시 분석 기록이 누락될 수 있습니다.
          수집 불완전은 달성 여부와 겹칠 수 있으며, 0건이라고 무손실을 보장하지 않습니다.
          배포·재시작·롤백 구간은 운영 로그와 함께 확인해야 합니다.
          {quality.collectionFailureSince && ` 현재 서버에서 ${date(quality.collectionFailureSince)} 이후 수집 오류가 감지됐습니다.`}
        </Copy>
      </Details>
    </Card>
  );
}

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${t.space(3)};
`;
const Copy = styled.p`
  margin-top: ${t.space(3)};
  color: ${t.color.ink2};
  font-size: 0.8125rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
`;
const Period = styled.p`
  margin: ${t.space(5)} 0 ${t.space(3)};
  color: ${t.color.ink2};
  font-size: 0.8125rem;
`;
const SubTitle = styled.h4`
  margin: ${t.space(6)} 0 ${t.space(3)};
  color: ${t.color.ink};
  font-size: 0.8125rem;
  font-weight: 600;
`;
const Details = styled.details`
  margin-top: ${t.space(4)};
  border-top: 1px solid ${t.color.border};
  padding-top: ${t.space(4)};
  color: ${t.color.ink2};
  font-size: 0.8125rem;
  summary { cursor: pointer; }
`;
