import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ActivationCard from "./ActivationCard";

const base = {
  version: 1, status: "ok", collectionMode: "best_effort",
  period: { startAt: "2026-09-23T15:00:00Z", endAt: "2026-09-30T12:00:00Z" },
  ended: { total: 4, achieved: 3, notAchieved: 1, incomplete: 0, ratePercent: 75 },
  ongoing: { total: 2, achieved: 1, notAchieved: 1, incomplete: 0 },
  quality: { legacyTables: 5, excludedAdminTables: 1, invalidTables: 2, missingLedgers: 0, scheduleChangedTables: 1, collectionFailureSince: null },
};
const markup = (report) => renderToStaticMarkup(<ActivationCard report={report} />);

test("구 BE / 새 지표 장애에서도 기존 퍼널 안내를 유지하며 0%를 만들지 않는다", () => {
  expect(markup()).toContain("아직 연결되지 않았습니다");
  expect(markup()).toContain("기존 퍼널은 계속 확인");
  expect(markup({ version: 1, status: "unavailable" })).toContain("불러오지 못했습니다");
  expect(markup({ version: 1, status: "unavailable" })).not.toContain("0%");
});

test("종료일 기준 분모와 진행 중 별도 표시, 이름 기준 및 품질 범위를 설명한다", () => {
  const view = markup(base);
  expect(view).not.toContain("비교 불가");
  for (const text of ["75%", "달성 3개 / 종료 4개", "생성 당시 종료일 기준", "진행 중인 표", "전체 수집 기간", "같은 이름", "약속 확정을 뜻하지", "기존 표 5개", "관리자 생성 1개", "기간 오류 2개"]) {
    expect(view).toContain(text);
  }
});

test("종료 표가 없으면 0% 대신 대기 상태를 보여준다", () => {
  const view = markup({ ...base, ended: { total: 0, achieved: 0, notAchieved: 0, incomplete: 0, ratePercent: null } });
  expect(view).toContain("종료된 집계 대상 표가 없습니다");
  expect(view).not.toContain("0%");
});

test("수집 공백은 미달로 확정하지 않고 성공률을 숨긴다", () => {
  const view = markup({ ...base, status: "partial", ended: { ...base.ended, incomplete: 1 } });
  expect(view).toContain("수집 불완전");
  expect(view).toContain("비율을 표시하지 않습니다");
  expect(view).not.toContain("75%");
  expect(view).toContain("무손실을 보장하지 않습니다");
});
