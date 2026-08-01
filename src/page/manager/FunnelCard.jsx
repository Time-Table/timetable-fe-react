import { useState } from "react";
import styled from "@emotion/styled";
import { FiChevronDown, FiAlertCircle } from "react-icons/fi";
import t from "./tokens";
import { Card, CardTitle } from "./ui";

/**
 * 퍼널 하나를 단계별 막대로 보여준다.
 * 단계를 클릭하면 그 단계가 무엇을 뜻하는지와 개선 힌트가 열린다.
 *
 * 막대 색은 한 계열이므로 하나만 쓴다. 값은 막대 길이가 이미 말하고 있어서
 * 단계마다 색을 바꾸면 같은 정보를 두 번 칠하는 셈이 된다.
 * 예외는 이탈이 가장 큰 구간으로, 여기만 상태색 + 배지로 표시한다.
 */
const FunnelCard = ({ funnel }) => {
  const [openStep, setOpenStep] = useState(null);
  const unit = funnel.unit || "명";

  const worstIndex = funnel.steps.reduce(
    (worst, step, i) => (i > 0 && step.dropFromPrev > funnel.steps[worst].dropFromPrev ? i : worst),
    0,
  );
  const hasWorst = worstIndex > 0 && funnel.steps[worstIndex].dropFromPrev > 0;

  return (
    <Card>
      <Head>
        <div>
          <CardTitle>{funnel.title}</CardTitle>
          <Question>{funnel.question}</Question>
        </div>
        <Summary>
          <span>최종 전환</span>
          <strong>{funnel.overallConversion}%</strong>
        </Summary>
      </Head>

      <Meaning>{funnel.meaning}</Meaning>

      {funnel.entered === 0 ? (
        <EmptyNote>
          아직 이 기간에 쌓인 데이터가 없습니다. 사용자가 첫 단계를 밟으면 집계가 시작됩니다.
        </EmptyNote>
      ) : (
        funnel.steps.map((step, i) => {
          const isOpen = openStep === i;
          const isWorst = hasWorst && i === worstIndex;

          return (
            <div key={`${funnel.key}-${i}`}>
              {i > 0 && (
                <Connector $warn={isWorst}>
                  <FiChevronDown size={12} />
                  <span>{step.conversionFromPrev}% 통과</span>
                  {step.dropFromPrev > 0 && (
                    <em>
                      · {step.dropFromPrev.toLocaleString()}
                      {unit} 이탈
                    </em>
                  )}
                  {isWorst && (
                    <Badge>
                      <FiAlertCircle size={11} /> 최대 이탈
                    </Badge>
                  )}
                </Connector>
              )}

              <StepRow type="button" onClick={() => setOpenStep(isOpen ? null : i)}>
                <StepMeta>
                  <StepName>
                    {step.label}
                    <Chevron size={11} style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
                  </StepName>
                  <StepValue>
                    {step.completed.toLocaleString()}
                    {unit}
                    <small>{step.conversionFromStart}%</small>
                  </StepValue>
                </StepMeta>
                <Track>
                  <Fill
                    $warn={isWorst}
                    style={{ width: `${Math.max(step.conversionFromStart, 1.5)}%` }}
                  />
                </Track>
              </StepRow>

              {isOpen && (
                <Detail>
                  <p>{step.meaning}</p>
                  {step.drop && (
                    <p className="advice">
                      <FiAlertCircle size={13} />
                      <span>{step.drop}</span>
                    </p>
                  )}
                  {step.reached !== step.completed && (
                    <p className="note">
                      앞 단계를 거치지 않고 이 행동만 한 경우까지 포함하면{" "}
                      {step.reached.toLocaleString()}
                      {unit}입니다.
                    </p>
                  )}
                </Detail>
              )}
            </div>
          );
        })
      )}

      {typeof funnel.averageParticipants === "number" && (
        <Foot>
          테이블당 평균 참여 인원 <strong>{funnel.averageParticipants}명</strong>
        </Foot>
      )}
    </Card>
  );
};

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${t.space(5)};
  flex-wrap: wrap;
  padding-bottom: ${t.space(4)};
  border-bottom: 1px solid ${t.color.border};
`;

const Question = styled.p`
  margin-top: ${t.space(1)};
  font-size: 0.75rem;
  color: ${t.color.muted};
`;

const Summary = styled.div`
  text-align: right;
  flex-shrink: 0;

  span {
    display: block;
    font-size: 0.6875rem;
    color: ${t.color.muted};
  }
  strong {
    font-size: 1.375rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: ${t.color.ink};
  }
`;

const Meaning = styled.p`
  margin: ${t.space(4)} 0 ${t.space(6)};
  padding: ${t.space(3)} ${t.space(4)};
  background: ${t.color.surfaceSunken};
  border-left: 2px solid ${t.color.series1};
  border-radius: 0 ${t.radius.sm} ${t.radius.sm} 0;
  font-size: 0.8125rem;
  line-height: 1.7;
  color: ${t.color.ink2};
`;

const StepRow = styled.button`
  display: block;
  width: 100%;
  padding: ${t.space(1)} 0;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
`;

const StepMeta = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${t.space(3)};
  margin-bottom: ${t.space(2)};
`;

const StepName = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${t.space(1)};
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${t.color.ink};
`;

const Chevron = styled(FiChevronDown)`
  color: ${t.color.muted};
  transition: transform 0.2s ease;
`;

const StepValue = styled.span`
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${t.color.ink};
  font-variant-numeric: tabular-nums;

  small {
    margin-left: ${t.space(2)};
    font-weight: 400;
    color: ${t.color.muted};
  }
`;

const Track = styled.div`
  width: 100%;
  height: 22px;
  background: ${t.color.surfaceSunken};
  border-radius: ${t.radius.sm};
  overflow: hidden;
`;

const Fill = styled.div`
  height: 100%;
  border-radius: ${t.radius.sm};
  background: ${(p) => (p.$warn ? t.color.critical : t.color.series1)};
  transition: width 0.7s cubic-bezier(0.165, 0.84, 0.44, 1);
`;

const Connector = styled.div`
  display: flex;
  align-items: center;
  gap: ${t.space(1)};
  padding: ${t.space(2)} 0 ${t.space(2)} ${t.space(2)};
  font-size: 0.6875rem;
  color: ${(p) => (p.$warn ? t.color.critical : t.color.muted)};

  span {
    font-weight: 600;
  }
  em {
    font-style: normal;
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: ${t.space(1)};
  padding: 2px ${t.space(2)};
  border-radius: 999px;
  background: ${t.color.critical}14;
  color: ${t.color.critical};
  font-size: 0.625rem;
  font-weight: 600;
`;

const Detail = styled.div`
  margin: ${t.space(2)} 0 ${t.space(1)};
  padding: ${t.space(4)};
  background: ${t.color.surfaceSunken};
  border-radius: ${t.radius.md};
  font-size: 0.75rem;
  line-height: 1.7;
  color: ${t.color.ink2};

  p + p {
    margin-top: ${t.space(3)};
  }

  .advice {
    display: flex;
    align-items: flex-start;
    gap: ${t.space(2)};
    padding-top: ${t.space(3)};
    border-top: 1px solid ${t.color.grid};
    color: ${t.color.ink2};

    svg {
      flex-shrink: 0;
      margin-top: 3px;
      color: ${t.color.warning};
    }
  }

  .note {
    font-size: 0.6875rem;
    color: ${t.color.muted};
  }
`;

const EmptyNote = styled.p`
  padding: ${t.space(10)} 0;
  text-align: center;
  font-size: 0.8125rem;
  color: ${t.color.muted};
`;

const Foot = styled.p`
  margin-top: ${t.space(5)};
  padding-top: ${t.space(4)};
  border-top: 1px solid ${t.color.border};
  font-size: 0.75rem;
  color: ${t.color.muted};

  strong {
    font-weight: 600;
    color: ${t.color.ink};
  }
`;

export default FunnelCard;
