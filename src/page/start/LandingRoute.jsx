import { Suspense, lazy, useEffect, useRef, useState } from "react";
import StartPage from "./StartPage";
import { trackVisit } from "../../api/visit";
import { trackEvent, EVENTS } from "../../utils/analytics";
import { assignLandingVariant, tagLandingVariant } from "../../utils/landingExperiment";

/**
 * v2는 배정받은 사람만 받는다. v1 방문자의 첫 로딩 번들을 키우지 않으려고 따로 떼어 둔다.
 * 조각 파일을 못 받으면 오류 안내 대신 v1을 보여 준다. 랜딩이 비면 안 되기 때문이다.
 * 이 경우 서버 배정으로는 v2로 잡히지만 드물어 그대로 둔다.
 */
const LandingV2Page = lazy(() => import("./LandingV2Page").catch(() => ({ default: StartPage })));

/**
 * 랜딩 주소 `/`. A/B 1회차 배정(utils/landingExperiment.js)에 따라 v1(StartPage)이나 v2(LandingV2Page)를 그린다.
 * 주소는 그대로라 검색 노출·canonical은 바뀌지 않는다.
 */
export default function LandingRoute() {
  const [{ variant, inExperiment }] = useState(() => assignLandingVariant());
  const tracked = useRef(false);

  // 방문·landing_view는 두 쪽 공통의 A/B 분모라 여기서 남긴다. v2 조각을 받기 전에 남겨야
  // 조각이 오기 전에 나간 v2 방문자도 v1처럼 센다(2026-09-29 Codex 지적). 관리자는 두 함수가 스스로 거른다.
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackVisit("landing");
    trackEvent(EVENTS.LANDING_VIEW);
    if (inExperiment) tagLandingVariant(variant);
  }, [variant, inExperiment]);

  // 안쪽 경계를 둬서 v2 조각을 기다리는 동안에도 이 컴포넌트가 먼저 그려지고 위 기록이 나가게 한다.
  return variant === "v2" ? (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <LandingV2Page />
    </Suspense>
  ) : (
    <StartPage />
  );
}
