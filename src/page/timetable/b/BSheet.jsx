import { useEffect, useRef } from "react";
import BIcon from "./BIcon";

/**
 * 새 화면의 창. 기본은 아래에서 올라오는 창이고 center면 가운데 알림창이다(첫 저장 공유 권유).
 * 초점: initialFocus(선택자)가 있으면 그곳, 없으면 창 안 첫 입력칸·버튼으로 옮긴다. 첫 것이 닫기 단추면
 * 창 자체로 옮긴다(시안처럼 휴대폰 자판이 저절로 뜨지 않게). 닫히면 연 단추로 돌려준다.
 * 바깥(어두운 막)을 누르거나 Esc로 닫는다. title이 null이면 제목 줄 없이 label을 이름으로 쓴다.
 */
export default function BSheet({ title, label, center = false, initialFocus, onClose, children }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    const wanted = initialFocus ? panel?.querySelector(initialFocus) : null;
    const first = panel?.querySelector("input, button");
    if (wanted) wanted.focus();
    else if (first && !first.hasAttribute("data-sheet-close")) first.focus();
    else panel?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener && typeof opener.focus === "function" && opener.isConnected) opener.focus();
    };
    // 창을 여는 순간에만 한 번 맞춘다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`tb-sheet-back${center ? " center" : ""}`}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`tb-sheet${center ? " center" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || label || "창"}
        tabIndex={-1}
      >
        {!center && <div className="tb-sheet-handle" aria-hidden="true" />}
        {title !== null && (
          <div className="tb-sheet-head">
            <h2>{title}</h2>
            <button className="tb-iconbtn" type="button" aria-label="닫기" data-sheet-close onClick={onClose}>
              <BIcon name="x" size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
