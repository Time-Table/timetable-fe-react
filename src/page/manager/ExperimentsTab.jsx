import { useState } from "react";
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

export default function ExperimentsTab() {
  const [which, setWhich] = useState("landing");
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
      {which === "landing" ? <ExperimentPanel /> : <TableAbPanel />}
    </Stack>
  );
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.space(4)};
`;
