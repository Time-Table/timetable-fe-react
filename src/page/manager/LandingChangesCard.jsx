import { useLayoutEffect, useRef } from "react";
import styled from "@emotion/styled";
import t from "./tokens";
import { Card, CardTitle, CardSubtitle, Tag } from "./ui";
import { LANDING_CHANGES, SIDE_LABELS, formatChangeTime } from "./landingChanges";

/**
 * A/B 탭 "기간 중 변경" 카드(2026-10-04 사람 지시 3번). 실험 중 화면·계측이 바뀐 시각을 수치 옆에서 바로 보게 한다.
 * 두 쪽이 같이 바뀐 변경은 A·B 비교에는 중립이지만 전환율 추이는 그 전후로 나눠 본다. 목록은 landingChanges.js(정본은 product.md).
 * focusKey: 대시보드 일별 추이 표의 "변경"에서 왔을 때 0보다 큰 번호. 바뀔 때마다 이 카드로 초점을 옮기고 화면에 보이게 한다.
 */
export default function LandingChangesCard({ focusKey = 0 }) {
  const cardRef = useRef(null);

  // 그리자마자(레이아웃 단계) 초점을 옮겨 화면이 한 번 다른 곳에 머물렀다 움직이지 않게 한다.
  useLayoutEffect(() => {
    if (!focusKey) return;
    const card = cardRef.current;
    card?.focus?.({ preventScroll: true });
    card?.scrollIntoView?.({ block: "start" });
  }, [focusKey]);

  return (
    <ChangesCard ref={cardRef} tabIndex={-1} aria-labelledby="landing-changes-title">
      <CardTitle id="landing-changes-title">기간 중 변경</CardTitle>
      <CardSubtitle>
        실험 중 화면·계측이 바뀐 운영 반영 시각(KST). 둘 다 바뀐 것은 A·B 비교에는 중립이지만 전환율은 이 시각 전후로 나눠 봅니다.
      </CardSubtitle>
      <List>
        {[...LANDING_CHANGES].reverse().map((change) => (
          <Item key={change.at}>
            <When>{formatChangeTime(change)}</When>
            <Tag>{SIDE_LABELS[change.side]}</Tag>
            <Body>
              <Title>{change.title}</Title>
              <Detail>{change.detail}</Detail>
            </Body>
          </Item>
        ))}
      </List>
    </ChangesCard>
  );
}

/* 1023px 이하에서는 메뉴가 위에 붙어(45px) 있어, 초점을 옮겨 올 때 제목이 그 밑에 가리지 않게 여유를 둔다. */
const ChangesCard = styled(Card)`
  @media ${t.media.compact} {
    scroll-margin-top: ${t.space(14)};
  }
`;

const List = styled.ol`
  margin-top: ${t.space(4)};
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${t.space(3)};
`;

const Item = styled.li`
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: start;
  /* 쪽 표시(Tag)가 1fr 칸을 가로로 꽉 채우지 않게 */
  justify-items: start;
  gap: ${t.space(3)};

  @media ${t.media.mobile} {
    grid-template-columns: auto 1fr;
  }
`;

const When = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  color: ${t.color.muted};
  white-space: nowrap;
  padding-top: 2px;
`;

const Body = styled.div`
  min-width: 0;

  @media ${t.media.mobile} {
    grid-column: 1 / -1;
  }
`;

const Title = styled.p`
  font-size: 0.8125rem;
  color: ${t.color.ink};
`;

const Detail = styled.p`
  margin-top: 2px;
  font-size: 0.75rem;
  color: ${t.color.muted};
`;
