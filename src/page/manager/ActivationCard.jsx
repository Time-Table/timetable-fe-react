import styled from "@emotion/styled";
import { Card, CardTitle, CardSubtitle, Grid, Tag, Button, Segmented, SegmentedItem } from "./ui";
import StatTile from "./StatTile";
import t from "./tokens";

const date = (value) => value ? new Date(value).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) : null;

export default function ActivationCard({ report, loading = false, failed = false, compact = false, onDetails, onRetry, periodDays = 0, onPeriodChange }) {
  const periodPicker = onPeriodChange && <PeriodPicker>
    <CardSubtitle>참여 달성 집계 기간 · 기본값은 서비스 시작 이후 전체</CardSubtitle>
    <Segmented role="group" aria-label="참여 달성 집계 기간">
      {[{ label: "전체", days: 0 }, { label: "7일", days: 7 }, { label: "30일", days: 30 }, { label: "90일", days: 90 }].map((option) => (
        <SegmentedItem key={option.days} $active={periodDays === option.days} aria-pressed={periodDays === option.days}
          onClick={() => onPeriodChange(option.days)}>{option.label}</SegmentedItem>
      ))}
    </Segmented>
  </PeriodPicker>;
  if (loading || failed || !report || report.version !== 1 || report.definition !== "current_registration_before_deadline" || report.status === "unavailable") {
    return (
      <Card>
        <CardTitle>3인 참여 달성률</CardTitle>
        {periodPicker}
        <Copy role="status">
          {loading ? "참여 달성 지표를 불러오는 중입니다." :
            failed ? "통계 조회에 실패했습니다. 다시 조회해 주세요." :
              !report ? "새 지표 수집이 아직 연결되지 않았습니다." :
                "새 지표를 불러오지 못했습니다. 잠시 후 다시 조회해 주세요."}
          {!loading && " 다른 통계는 별도로 확인할 수 있습니다."}
        </Copy>
        {!loading && onRetry && <Button onClick={onRetry}>지표 다시 조회</Button>}
      </Card>
    );
  }
  const { ended, ongoing, quality, period } = report;
  const partial = report.status === "partial";
  const rate = ended.ratePercent === null ? "—" : `${ended.ratePercent}%`;
  const range = period.startAt ? `${date(period.startAt)} ~ ${date(period.endAt)}` : `서비스 시작 이후 전체 기간 ~ ${date(period.endAt)}`;

  return (
    <Card>
      <Header>
        <div>
          <CardTitle>3인 참여 달성률</CardTitle>
          <CardSubtitle>대표 지표 · 현재·과거 표 · 종료일 기준 · 한국시간</CardSubtitle>
        </div>
        <Tag $tone={partial ? "critical" : undefined}>
          {partial ? "! 수집 불완전" : "참여 등록 기준"}
        </Tag>
      </Header>
      {periodPicker}
      <Copy>
        생성자를 포함해 서로 다른 이름 3명 이상이 표 생성부터 마감까지 참여 등록한 표를 셉니다.
        시간 입력 여부와 관계없이 현재 표와 과거 표를 함께 집계합니다.
      </Copy>
      {report.asOf && <Copy>집계 기준: {new Date(report.asOf).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false })} (한국시간)</Copy>}
      {!partial && ended.total === 0 && <Copy role="status">선택 기간에 종료된 집계 대상 표가 없습니다.</Copy>}
      <Period>{range}에 종료된 표</Period>
      <Grid $min="180px">
        <StatTile showComparison={false} label="전체 보관 표" value={quality.existingTables}
          hint={`전체 기간 · 관리자 제외 ${quality.excludedAdminTables}개 · 기간 오류 ${quality.invalidTables}개`} />
        <StatTile showComparison={false} label="종료된 표의 달성률" value={partial ? "—" : rate}
          hint={partial ? "수집 공백 확인이 필요해 비율을 표시하지 않습니다." : ended.total === 0 ? "종료된 집계 대상 표가 없습니다." : `달성 ${ended.achieved}개 / 종료 ${ended.total}개`} />
        {compact ? <>
          <StatTile showComparison={false} label="달성한 표" value={ended.achieved} hint="선택 기간에 종료 · 마감 전 달성" />
          <StatTile showComparison={false} label="종료된 표" value={ended.total} hint="선택 기간 · 집계 대상" />
          <StatTile showComparison={false} label="진행 중인 표" value={ongoing.total}
            hint={`전체 보관 기간 · 이미 달성 ${ongoing.achieved}개 · 달성률 분모에서 제외`} />
        </> : <>
        <StatTile showComparison={false} label="종료 · 달성" value={ended.achieved} hint="마감까지 3명 이상 이름 등록" />
        <StatTile showComparison={false} label="종료 · 미달" value={ended.notAchieved} hint="현재 남은 마감 전 등록자가 3명 미만" />
        <StatTile showComparison={false} label="종료 · 평가 대상" value={ended.total} hint="달성 표와 미달 표의 합계" />
        </>}
      </Grid>
      {!compact && <>
      <Copy>달성한 표와 미달성 표의 합계가 선택 기간의 평가 대상입니다.</Copy>
      <SubTitle>진행 중인 표 · 전체 보관 기간</SubTitle>
      <Grid $min="180px">
        <StatTile showComparison={false} label="이미 달성" value={ongoing.achieved} hint="종료 전이므로 위 비율에서 제외" />
        <StatTile showComparison={false} label="아직 미달" value={ongoing.notAchieved} hint="마감 전 추가 참여 가능" />
        <StatTile showComparison={false} label="진행 중 전체" value={ongoing.total} hint="마감 전이므로 달성률 분모에서 제외" />
      </Grid>
      </>}
      {compact && partial && <Copy>수집 공백이 있어 비율을 숨겼습니다. 상세에서 누락 범위를 확인해 주세요.</Copy>}
      <Copy>
        과거·현재 모두 현재 남아 있는 표와 참여 기록으로 판단합니다.
        참여 취소·표 삭제·기간 수정에 따라 과거 수치도 변경됩니다. 삭제된 표와 취소한 참여자는 제외합니다.
        같은 표의 같은 이름은 한 명으로 세며, 실제 인원 확인이나 시간 입력 완료·약속 확정을 뜻하지 않습니다.
      </Copy>
      {compact ? <Button onClick={onDetails}>참여 달성 상세 보기</Button> : <Details>
        <summary>집계 범위와 데이터 품질</summary>
        <Copy>
          아래 건수는 선택 기간과 무관한 전체 집계 범위입니다.
          전체 보관 표 {quality.existingTables}개를 확인했습니다.
          관리자 생성 {quality.excludedAdminTables}개, 기간 오류 {quality.invalidTables}개는 달성률에서 제외합니다.
        </Copy>
        <Copy>
          모든 표는 현재 저장된 날짜와 종료 시간을 마감으로 사용합니다.
          첫 후보일 이전 등록과 마감 정각의 등록도 포함합니다. 등록 시각이 없거나 잘못된 참여 기록은 세지 않습니다.
          취소 후 다시 참여하면 새 등록 시각으로 판단합니다. 구분할 수 없는 관리자 테스트가 포함될 수 있습니다.
          기존 달성 이력과 삭제된 참여 기록은 이 지표에 사용하지 않습니다.
        </Copy>
      </Details>}
    </Card>
  );
}

const PeriodPicker = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${t.space(3)};
  margin-top: ${t.space(4)};
`;
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
