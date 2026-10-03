import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import t from "./tokens";
import { Segmented, SegmentedItem } from "./ui";
import ExperimentPanel from "./ExperimentPanel";
import TableAbPanel from "./TableAbPanel";

/** 매니저 "A/B 테스트" 탭: 실험 고르기(랜딩 1회차 · 표 화면 2회차). 하네스 specs/table-ab-2.md "매니저 탭". */
const EXPERIMENTS = [
  { value: "landing", label: "랜딩 1회차" },
  { value: "table", label: "표 화면 2회차" },
];

export default function ExperimentsTab({ focusChangesKey = 0 }) {
  const [which, setWhich] = useState("landing");

  // 대시보드 표의 "변경"에서 왔으면(focusChangesKey > 0) 랜딩 1회차를 보여 준다. "기간 중 변경" 카드가 거기 있다.
  useEffect(() => {
    if (focusChangesKey) setWhich("landing");
  }, [focusChangesKey]);
  return (
    <Stack>
      <Segmented role="group" aria-label="실험">
        {EXPERIMENTS.map((option) => (
          <SegmentedItem
            key={option.value}
            type="button"
            $active={which === option.value}
            aria-pressed={which === option.value}
            onClick={() => setWhich(option.value)}
          >
            {option.label}
          </SegmentedItem>
        ))}
      </Segmented>
      {which === "landing" ? <ExperimentPanel focusChangesKey={focusChangesKey} /> : <TableAbPanel />}
    </Stack>
  );
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.space(4)};
`;
