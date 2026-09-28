import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "@emotion/styled";
import theme from "../../theme";
import StartPage from "./StartPage";
import { trackVisit } from "../../api/visit";
import { trackEvent, EVENTS } from "../../utils/analytics";
import { isAdmin } from "../../utils/admin";
import { assignLandingVariant, tagLandingVariant } from "../../utils/landingExperiment";

/**
 * v2는 배정받은 사람만 받는다. v1 방문자의 첫 로딩 번들을 키우지 않으려고 따로 떼어 둔다.
 * 조각 파일을 못 받으면 오류 안내 대신 v1을 보여 준다. 랜딩이 비면 안 되기 때문이다.
 * 이 경우 서버 배정으로는 v2로 잡히지만 드물어 그대로 둔다.
 */
const LandingV2Page = lazy(() => import("./LandingV2Page").catch(() => ({ default: StartPage })));

const readIsAdmin = () => {
  try {
    return isAdmin();
  } catch (error) {
    return false;
  }
};

/**
 * 랜딩 주소 `/`. A/B 1회차 배정(utils/landingExperiment.js)에 따라 v1(StartPage)이나 v2(LandingV2Page)를 그린다.
 * 주소는 그대로라 검색 노출·canonical은 바뀌지 않는다.
 */
export default function LandingRoute() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [{ variant, inExperiment }, setAssignment] = useState(() => assignLandingVariant(search));
  const [isAdminView] = useState(readIsAdmin);
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

  /**
   * 관리자 전환 버튼(2026-09-29 사람 지시). 관리자는 지표에서 빠지므로 A·B를 오가도 기록이 남지 않는다.
   * 주소에 `?landing=v2`를 남겨 새로고침해도 같은 쪽을 본다(관리자만 이 값을 받는다).
   */
  const switchTo = (next) => {
    if (next === variant) return;
    setAssignment({ variant: next, inExperiment: false });
    navigate(next === "v2" ? "/?landing=v2" : "/", { replace: true });
    window.scrollTo(0, 0);
  };

  return (
    <>
      {/* 안쪽 경계를 둬서 v2 조각을 기다리는 동안에도 이 컴포넌트가 먼저 그려지고 위 기록이 나가게 한다. */}
      {variant === "v2" ? (
        <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
          <LandingV2Page />
        </Suspense>
      ) : (
        <StartPage />
      )}
      {isAdminView && (
        <AdminSwitch role="group" aria-label="관리자 랜딩 전환" data-nosnippet>
          <AdminLabel aria-hidden="true">관리자</AdminLabel>
          <AdminOption
            type="button"
            aria-pressed={variant === "v1"}
            aria-label="A 지금 랜딩"
            onClick={() => switchTo("v1")}
          >
            A
          </AdminOption>
          <AdminOption
            type="button"
            aria-pressed={variant === "v2"}
            aria-label="B 스크롤 이야기"
            onClick={() => switchTo("v2")}
          >
            B
          </AdminOption>
        </AdminSwitch>
      )}
    </>
  );
}

/* 왼쪽 아래에 떠 있는 작은 알약. 휴대폰은 하단 만들기 막대 위에 둔다. 확인 창(z-index 1100)보다는 아래다. */
const AdminSwitch = styled.div`
  position: fixed;
  left: ${theme.space[3]};
  bottom: calc(84px + env(safe-area-inset-bottom));
  z-index: 1050;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: ${theme.radius.pill};
  background: white;
  box-shadow: ${theme.shadow.popover};

  @media (min-width: ${theme.breakpoint.lg}) {
    left: ${theme.space[4]};
    bottom: ${theme.space[4]};
  }
`;

const AdminLabel = styled.span`
  padding: 0 ${theme.space[2]} 0 ${theme.space[2]};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
`;

const AdminOption = styled.button`
  min-width: 36px;
  height: 32px;
  padding: 0 ${theme.space[2]};
  border: 0;
  border-radius: ${theme.radius.pill};
  background: transparent;
  color: ${theme.text.gamma[200]};
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.small};
  cursor: pointer;

  &[aria-pressed="true"] {
    background: ${theme.text.gamma[100]};
    color: white;
  }

  &:hover:not([aria-pressed="true"]) {
    background: ${theme.text.gamma[900]};
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }
`;
