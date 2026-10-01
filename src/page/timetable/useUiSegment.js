import { useCallback, useEffect, useRef } from "react";
import { trackEvent, EVENTS, createId } from "../../utils/analytics";

/**
 * 표 화면 A/B 2회차 화면 기록(2026-10-01, 하네스 specs/table-ab-2.md).
 *
 * active(실험 중이고 그 화면 내용이 그려짐)가 켜지면 새 화면 ID로 ui_view를 한 번 보낸다. 화면이 바뀌면(A↔B) 다시 보낸다.
 * 같은 표·같은 화면이 잠깐 꺼졌다 다시 켜지는 것(시간표 새로고침으로 표를 다시 불러오는 동안 등)은 새로 본 것이 아니므로
 * 앞의 화면 ID를 그대로 쓰고 다시 보내지 않는다(Codex 2026-10-02). 페이지를 새로 열면 새로 보낸다.
 * 판정은 "화면을 교체한 사람이 마감 때 유지한 화면"이라 머문 시간은 재지 않는다(2026-10-02 사람 정정).
 *
 * 반환: 지금 화면 ID를 읽는 함수(띠로 바꿀 때 ui_switch에 떠나는 화면을 싣는다).
 */
export default function useUiSegment({ tableId, uiVersion, active }) {
  const viewRef = useRef(null);
  const lastRef = useRef(null);

  useEffect(() => {
    if (!active || !tableId) return undefined;
    const last = lastRef.current;
    if (last && last.tableId === tableId && last.uiVersion === uiVersion) {
      viewRef.current = last.viewId;
    } else {
      const viewId = createId();
      lastRef.current = { tableId, uiVersion, viewId };
      viewRef.current = viewId;
      // 자기 화면 값을 직접 싣는다(바꾸는 순간 "지금 화면" 값이 먼저 바뀌어도 맞게).
      trackEvent(EVENTS.UI_VIEW, tableId, undefined, { viewId, uiVersion });
    }
    const viewId = viewRef.current;
    return () => {
      if (viewRef.current === viewId) viewRef.current = null;
    };
  }, [active, tableId, uiVersion]);

  return useCallback(() => viewRef.current || undefined, []);
}
