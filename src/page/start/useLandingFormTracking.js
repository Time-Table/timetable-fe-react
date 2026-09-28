import { useCallback, useEffect, useRef } from "react";
import { CLARITY_EVENTS } from "../../utils/analytics";

/**
 * 랜딩 폼 보조 계측(2026-09-29 A/B 1회차). v1(StartPage)과 v2(LandingV2Page)가 같은 기준으로 재야
 * 두 쪽을 비교할 수 있어 한곳에 둔다. 모두 Clarity 전용이고, 화면을 한 번 열 때 처음 1회만 남긴다.
 *
 * - 폼이 보임: 모임 입력 상자가 절반 이상 화면에 들어온 순간
 * - 폼 시작: 모임 이름·후보 날짜·시간 범위 중 하나가 처음 기본값에서 바뀐 순간
 * - 추천 이름: 추천 모임 이름 칩을 처음 누른 순간(markPreset)
 * - 명단 열기: 미리보기 칸을 직접 눌러 명단을 처음 연 순간(markPreviewOpen). 자동으로 열린 것은 세지 않는다.
 *
 * track은 이벤트 이름을 받는 함수다. 미리보기 주소(/landing-v2)는 아무것도 하지 않는 함수를 넘긴다.
 */
export default function useLandingFormTracking({ builderRef, formState, track }) {
  const trackRef = useRef(track);
  trackRef.current = track;
  const sent = useRef(new Set());
  const once = useCallback((name) => {
    if (sent.current.has(name)) return;
    sent.current.add(name);
    trackRef.current(name);
  }, []);

  useEffect(() => {
    const el = builderRef.current;
    if (!el || typeof IntersectionObserver !== "function") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // isIntersecting은 조금만 걸쳐도 참이다. 처음 관찰할 때도 불리므로 비율을 직접 본다.
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
        once(CLARITY_EVENTS.LANDING_FORM_VIEW);
        observer.disconnect();
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [builderRef, once]);

  // 처음 그린 값을 기억해 두고, 그 값에서 달라진 첫 순간을 폼 시작으로 본다.
  const firstState = useRef(null);
  useEffect(() => {
    if (firstState.current === null) {
      firstState.current = formState;
      return;
    }
    if (formState !== firstState.current) once(CLARITY_EVENTS.LANDING_FORM_START);
  }, [formState, once]);

  const markPreset = useCallback(() => once(CLARITY_EVENTS.LANDING_PRESET), [once]);
  const markPreviewOpen = useCallback(() => once(CLARITY_EVENTS.LANDING_PREVIEW_OPEN), [once]);
  return { markPreset, markPreviewOpen };
}
