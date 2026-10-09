import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import BIcon from "./BIcon";
import { DAY_SHORT, endOf, fmtDay, isGolden } from "./bModel";

/**
 * 새 화면 격자. 확정 시안(kit.js viewGrid·editGrid·attachPaint·openPop)을 옮겼다.
 * 한 주(월~일 7열)를 그리고 후보 밖 날은 흐리게 남긴다. 30분 칸 두 줄이 한 시간이다.
 */

const dayClass = (d, i, hlDay) =>
  ["tb-day", d.on ? "" : "off", i === 5 ? "sat" : "", i === 6 ? "sun" : "", hlDay === d.key ? "hl" : ""].filter(Boolean).join(" ");

/*
 * "눌러서 명단 보기"는 칸 위(첫 줄이면 아래)에 띄우고 꼬리를 칸 가운데 안쪽까지 넣어 그 칸을 짚는다.
 * 옆에 두면 꼬리가 칸 경계를 짚어 어느 칸인지 헷갈렸다(2026-10-01 사람 지적). 양끝 열은 말풍선만 안쪽으로 붙여 화면 밖으로 나가지 않게 한다.
 */
const TapTip = ({ col, below }) => (
  <>
    <span className={["tb-tip", col === 0 ? "start" : col === 6 ? "end" : "", below ? "below" : ""].filter(Boolean).join(" ")} aria-hidden="true">
      눌러서 명단 보기
    </span>
    <span className={`tb-tip-arrow${below ? " below" : ""}`} aria-hidden="true" />
  </>
);

const Corner = () => (
  <div className="tb-corner" aria-hidden="true">
    <BIcon name="clock" size={14} />
  </div>
);

/*
 * 시간 글자는 그 시간 선(:00 칸 윗선)에 가운데로 걸친다(2026-10-01 사람 지시 "시간을 시간 선과 동일한 레벨로 맞춰줘").
 * 첫 줄 숫자 윗부분이 붙는 날짜 줄에 가리지 않게 날짜 줄 밑에 틈을 두고, 그 틈 아래에 첫 시간 선을 긋는다.
 * 마지막 선(마지막 칸 아랫선)에는 끝 시각(예: 20)을 단다.
 * 칸은 표의 실제 시작·끝까지만 그리고 숫자는 정각 선에만 단다(2026-10-01 사람 지시 "10시반부터면 10시반부터 보여주면 되는데",
 * "시간 표시는 여전히 정각만"). 10:30에 시작하면 첫 줄 왼쪽은 빈칸, 15:30에 끝나면 마지막 선에 숫자가 없다.
 */
const GridGap = () => (
  <>
    <div className="tb-gridgap" aria-hidden="true" />
    <div className="tb-gridgap line" aria-hidden="true" />
  </>
);
const HourNum = ({ hour }) => <span className="tb-hour-num">{hour}</span>;
const EndHour = ({ times }) => {
  if (!times.length) return null;
  const end = endOf(times[times.length - 1]);
  return (
    <div className="tb-hour end" aria-hidden="true">
      {end.endsWith(":00") && <HourNum hour={Number(end.slice(0, 2))} />}
    </div>
  );
};
/** 그 정각 줄의 시간 칸이 한 줄(:30 줄 없이 끝남)인지. */
const isLoneHour = (times, i) => times[i + 1] !== `${times[i].slice(0, 2)}:30`;
/** :30에 시작하는 표의 첫 줄 시간 칸(숫자 없음). */
const StartGap = () => <div className="tb-hour one" aria-hidden="true" />;

/**
 * 모두의 시간(보기). 칸 채움은 인원 비율로 진해진다.
 * picks가 있으면 그 사람들끼리 모두 되는 칸은 진하게, 일부만 되는 칸은 옅게 둔다(최다 인원 반짝임은 끈다).
 */
export const ViewGrid = forwardRef(function ViewGrid(
  { week, times, locked, info, max, picks, tipKey, popKey, slide, onCell },
  ref,
) {
  const hlDay = popKey ? popKey.slice(0, 10) : null;
  const hlHour = popKey ? popKey.slice(11, 13) : null;
  const items = [<Corner key="corner" />];
  week.forEach((d, i) =>
    items.push(
      <div key={d.key} className={dayClass(d, i, hlDay)} data-day={d.key} aria-hidden="true">
        {DAY_SHORT[i]}
        <em>{d.dnum}</em>
      </div>,
    ),
  );
  items.push(<GridGap key="gap" />);
  times.forEach((t, ti) => {
    if (t.endsWith(":00")) {
      items.push(
        <div
          key={`h${t}`}
          className={`tb-hour${isLoneHour(times, ti) ? " one" : ""}${hlHour === t.slice(0, 2) ? " hl" : ""}`}
          data-hour={t.slice(0, 2)}
          aria-hidden="true"
        >
          <HourNum hour={Number(t.slice(0, 2))} />
        </div>,
      );
    } else if (ti === 0) {
      items.push(<StartGap key="h-start" />);
    }
    week.forEach((d, i) => {
      const key = `${d.key}-${t}`;
      const isLocked = locked.has(key);
      const inf = d.on && !isLocked ? info.get(key) : null;
      const count = inf ? inf.count : 0;
      let opacity = 0;
      if (inf) {
        if (picks.length) {
          const n = picks.filter((p) => inf.members.includes(p)).length;
          opacity = n === picks.length ? 1 : n ? 0.12 + 0.28 * (n / picks.length) : 0;
        } else opacity = 0.2 + (count / max) * 0.8;
      }
      const tap = opacity > 0;
      const tip = key === tipKey;
      const cls = ["tb-cell", t.endsWith(":00") ? "top" : "bot", d.on ? "" : "off", isLocked ? "lock" : "", tap ? "tap" : "", tip ? "has-tip" : ""]
        .filter(Boolean)
        .join(" ");
      const inner = (
        <>
          {tap && <span className="tb-fill" style={{ opacity: opacity.toFixed(3) }} />}
          {!picks.length && isGolden(count, max) && <span className="tb-shine" aria-hidden="true" />}
          {tip && <TapTip col={i} below={t === times[0]} />}
        </>
      );
      items.push(
        tap ? (
          <button
            key={key}
            type="button"
            className={cls}
            data-key={key}
            aria-haspopup="dialog"
            aria-expanded={popKey === key}
            aria-label={`${fmtDay(d.key)} ${t} · ${count}명 가능`}
            onClick={() => onCell(key)}
          >
            {inner}
          </button>
        ) : (
          <div key={key} className={cls} data-key={key} aria-label={isLocked ? "잠긴 시간" : undefined}>
            {inner}
          </div>
        ),
      );
    });
  });
  items.push(<EndHour key="end" times={times} />);
  return (
    <div
      ref={ref}
      className={`tb-grid${slide ? ` slide-${slide}` : ""}`}
      role="group"
      aria-label="모두의 가능한 시간. 칸을 누르면 그 시간에 되는 사람이 나와요."
    >
      {items}
    </div>
  );
});

/**
 * 내 시간 고르기. 내 칸은 단색, 다른 사람이 되는 칸은 옅게 깐다.
 * 요일·시간 글자는 그 줄 전체를 칠하거나 지운다. 칸 칠하기 손동작은 usePaint가 붙인다.
 */
export const EditGrid = forwardRef(function EditGrid(
  { week, times, locked, info, max, me, selected, slide, coach, onToggle },
  ref,
) {
  const items = [<Corner key="corner" />];
  week.forEach((d, i) =>
    items.push(
      d.on ? (
        <button
          key={d.key}
          type="button"
          className={dayClass(d, i, null)}
          data-day={d.key}
          aria-label={`${fmtDay(d.key)} 하루 전체 칠하기·지우기`}
          onClick={() => onToggle(times.map((t) => `${d.key}-${t}`), "day")}
        >
          {DAY_SHORT[i]}
          <em>{d.dnum}</em>
        </button>
      ) : (
        <div key={d.key} className={dayClass(d, i, null)} data-day={d.key} aria-hidden="true">
          {DAY_SHORT[i]}
          <em>{d.dnum}</em>
        </div>
      ),
    ),
  );
  items.push(<GridGap key="gap" />);
  times.forEach((t, ti) => {
    if (t.endsWith(":00")) {
      const hh = t.slice(0, 2);
      const lone = isLoneHour(times, ti);
      const until = lone ? endOf(t) : endOf(endOf(t));
      items.push(
        <button
          key={`h${t}`}
          type="button"
          className={`tb-hour${lone ? " one" : ""}`}
          data-hour={hh}
          aria-label={`${t} ~ ${until} 줄 전체 칠하기·지우기`}
          onClick={() =>
            onToggle(
              week.flatMap((d) => [`${d.key}-${hh}:00`, `${d.key}-${hh}:30`]).filter((k) => times.includes(k.slice(11))),
              "hour",
            )
          }
        >
          <HourNum hour={Number(hh)} />
        </button>,
      );
    } else if (ti === 0) {
      items.push(<StartGap key="h-start" />);
    }
    week.forEach((d) => {
      const key = `${d.key}-${t}`;
      const isLocked = locked.has(key);
      const inf = d.on && !isLocked ? info.get(key) : null;
      const others = inf ? inf.members.filter((n) => n !== me).length : 0;
      const cls = ["tb-cell", t.endsWith(":00") ? "top" : "bot", d.on ? "" : "off", isLocked ? "lock" : "", selected.has(key) ? "me" : ""]
        .filter(Boolean)
        .join(" ");
      items.push(
        <div key={key} className={cls} data-key={key}>
          {others > 0 && <span className="tb-under" style={{ opacity: (0.08 + (others / max) * 0.22).toFixed(3) }} />}
        </div>,
      );
    });
  });
  items.push(<EndHour key="end" times={times} />);
  return (
    <div ref={ref} className={`tb-grid edit${slide ? ` slide-${slide}` : ""}`} aria-label="내 가능한 시간 고르기">
      {items}
      {coach && (
        <div className="tb-coach" aria-hidden="true">
          <span className="tb-coach-dot" />
          <span className="tb-coach-hand">
            <BIcon name="pointer" size={34} strokeWidth={1.8} />
          </span>
        </div>
      )}
    </div>
  );
});

const LONG_PRESS_MS = 280;
const MOVE_SLOP = 8;

/**
 * 칠하기 손동작(시안 kit.js attachPaint). 칸은 .tb-cell[data-key].
 * 손가락: 누르면 한 칸, 길게 누른 뒤 끌면 여러 칸, 옆으로 밀면 그 줄. 세로로 밀면 화면이 내려간다(칸은 touch-action: pan-y).
 * 마우스·펜: 누른 채 끌면 바로 칠한다. 처음 칠한 칸이 비어 있었으면 칠하기, 칠해져 있었으면 지우기.
 * 끄는 동안은 칸 모양만 바로 바꾸고(selectedRef를 직접 고침) 손을 떼면 onEnd로 화면을 다시 그린다.
 * onPaint(added)는 칸이 바뀔 때마다(손을 떼기 전에도) 불린다. 표 화면 A/B 공유 상태에 바로 남기려고 둔다.
 */
export function usePaint(gridRef, enabled, redrawKey, { selectedRef, onPaint, onEnd }) {
  const onPaintRef = useRef(onPaint);
  const onEndRef = useRef(onEnd);
  onPaintRef.current = onPaint;
  onEndRef.current = onEnd;

  useEffect(() => {
    const container = gridRef.current;
    if (!enabled || !container) return undefined;
    let mode = null;
    let start = null;
    let timer = 0;
    const paintable = (cell) => !!cell && !!cell.dataset.key && !cell.classList.contains("off") && !cell.classList.contains("lock");
    const at = (x, y) => document.elementFromPoint?.(x, y)?.closest?.(".tb-cell");
    const paint = (cell) => {
      if (!paintable(cell) || !container.contains(cell)) return;
      const key = cell.dataset.key;
      const selected = selectedRef.current;
      if (mode === "add") selected.add(key);
      else selected.delete(key);
      cell.classList.toggle("me", selected.has(key));
      onPaintRef.current(mode === "add");
    };
    const begin = (cell) => {
      mode = selectedRef.current.has(cell.dataset.key) ? "remove" : "add";
      paint(cell);
    };
    const finish = () => {
      clearTimeout(timer);
      timer = 0;
      start = null;
      if (!mode) return;
      mode = null;
      onEndRef.current();
    };
    const cellOf = (target) => target?.closest?.(".tb-cell");

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) {
        finish();
        return;
      }
      const cell = cellOf(e.target);
      if (!paintable(cell)) return;
      const t = e.touches[0];
      start = { x: t.clientX, y: t.clientY, cell };
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (start && !mode) begin(start.cell);
      }, LONG_PRESS_MS);
    };
    const onTouchMove = (e) => {
      if (!start) return;
      const t = e.touches[0];
      if (mode) {
        if (e.cancelable) e.preventDefault();
        paint(at(t.clientX, t.clientY));
        return;
      }
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) > MOVE_SLOP && Math.abs(dx) > Math.abs(dy)) {
        if (e.cancelable) e.preventDefault();
        clearTimeout(timer);
        begin(start.cell);
        paint(at(t.clientX, t.clientY));
      } else if (Math.abs(dy) > MOVE_SLOP) {
        // 스크롤이다. 이 손길에서는 칠하지 않는다.
        clearTimeout(timer);
        start = null;
      }
    };
    const onTouchEnd = (e) => {
      if (mode) {
        if (e.cancelable) e.preventDefault();
        finish();
        return;
      }
      if (start) {
        // 누르고 뗌 = 한 칸. 흉내 click은 막는다(두 번 바뀌지 않게).
        if (e.cancelable) e.preventDefault();
        begin(start.cell);
        finish();
        return;
      }
      clearTimeout(timer);
    };
    const onPointerDown = (e) => {
      if (e.pointerType === "touch") return;
      const cell = cellOf(e.target);
      if (!paintable(cell)) return;
      e.preventDefault();
      begin(cell);
      try {
        container.setPointerCapture(e.pointerId);
      } catch (error) {
        // 끌기 붙잡기를 못 해도 칠하기는 된다.
      }
    };
    const onPointerMove = (e) => {
      if (e.pointerType === "touch" || !mode) return;
      paint(at(e.clientX, e.clientY));
    };
    const onPointerEnd = (e) => {
      if (e.pointerType !== "touch") finish();
    };
    const onContextMenu = (e) => e.preventDefault();

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", finish);
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerEnd);
    container.addEventListener("pointercancel", onPointerEnd);
    container.addEventListener("contextmenu", onContextMenu);
    return () => {
      clearTimeout(timer);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", finish);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerEnd);
      container.removeEventListener("pointercancel", onPointerEnd);
      container.removeEventListener("contextmenu", onContextMenu);
    };
    // 격자를 새로 그리면(주 넘기기 등) 새 격자에 다시 붙인다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, redrawKey]);
}

const POP_W = 260;
const POP_OVERLAP = 12;

/** 창을 둘 수 있는 위·아래 경계. 위는 사이트 헤더 아래, 아래는 고정 막대 위. */
const bounds = () => {
  let ceiling = 0;
  document.querySelectorAll("[data-site-header], [data-ceiling]").forEach((el) => {
    const b = el.getBoundingClientRect().bottom;
    if (b > ceiling && b < window.innerHeight / 2) ceiling = b;
  });
  let floor = window.innerHeight;
  document.querySelectorAll("[data-floor]").forEach((el) => {
    const t = el.getBoundingClientRect().top;
    if (t > window.innerHeight / 2 && t < floor) floor = t;
  });
  return { ceiling: ceiling + 8, floor: floor - 8 };
};

const Names = ({ list, can }) => (
  <div className="tb-pop-names" data-clarity-mask="true">
    {list.length ? (
      list.map((n) => (
        <span key={n} className={`tb-pop-name${can ? "" : " no"}`}>
          {n}
        </span>
      ))
    ) : (
      <span className="tb-noname">없음</span>
    )}
  </div>
);

/**
 * 명단 창 자리 잡기. 칸 옆에 붙이고 칸을 향한 모서리 하나만 뾰족하게 한다(랜딩 placePopup과 같은 계산).
 * 스크롤하면 칸을 따라가고, 칸이 화면 밖이면 숨긴다. 창 밖을 누르거나 Esc로 닫는다.
 * 시간 칸(.tb-cell)과 날짜 투표 칸(.tb-dc, 2026-10-09)이 같이 쓴다. 다른 칸을 누르면 닫지 않고 그 칸으로 옮긴다(TableB onCell).
 */
export function usePopPlacement({ ref, gridRef, cellKey, onClose, deps }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const cellOf = useCallback(() => gridRef.current?.querySelector(`[data-key="${cellKey}"]`), [gridRef, cellKey]);

  const place = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const cell = cellOf();
    if (!cell) {
      onCloseRef.current();
      return;
    }
    const r = cell.getBoundingClientRect();
    const W = window.innerWidth;
    const { ceiling, floor } = bounds();
    if (!(r.bottom > ceiling - 8 && r.top < floor + 8 && r.right > 0 && r.left < W)) {
      el.style.visibility = "hidden";
      return;
    }
    const w = el.offsetWidth || POP_W;
    const ht = el.offsetHeight || 200;
    let left = r.right - POP_OVERLAP;
    if (left + w > W - 8) left = r.left - w + POP_OVERLAP;
    left = Math.max(8, Math.min(left, W - w - 8));
    let top = r.bottom - POP_OVERLAP;
    if (top + ht > floor) top = r.top - ht + POP_OVERLAP;
    top = Math.max(ceiling, Math.min(top, floor - ht));
    const side = (top + ht / 2 < r.top + r.height / 2 ? "b" : "t") + (left + w / 2 < r.left + r.width / 2 ? "r" : "l");
    const tipX = side[1] === "l" ? left : left + w;
    const tipY = side[0] === "t" ? top : top + ht;
    const corner = tipX >= r.left - 1 && tipX <= r.right + 1 && tipY >= r.top - 1 && tipY <= r.bottom + 1 ? side : "none";
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.visibility = "";
    el.dataset.corner = corner;
  }, [ref, cellOf]);

  useLayoutEffect(() => {
    place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place, deps]);

  useEffect(() => {
    let raf = 0;
    const follow = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    // iOS 사파리는 부드러운 스크롤이 끝난 뒤 마지막 scroll 이벤트를 주지 않을 때가 있다. 끝날 즈음 다시 맞춘다.
    const timers = [450, 900].map((ms) => setTimeout(place, ms));
    const onDocClick = (e) => {
      if (ref.current?.contains(e.target)) return;
      if (e.target.closest?.(".tb-cell.tap, .tb-dc.tap")) return;
      onCloseRef.current();
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const cell = cellOf();
      onCloseRef.current();
      cell?.focus();
    };
    window.addEventListener("scroll", follow, { passive: true });
    window.addEventListener("resize", follow);
    window.visualViewport?.addEventListener("resize", follow);
    window.visualViewport?.addEventListener("scroll", follow);
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("scroll", follow);
      window.removeEventListener("resize", follow);
      window.visualViewport?.removeEventListener("resize", follow);
      window.visualViewport?.removeEventListener("scroll", follow);
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, place, cellOf]);

  return cellOf;
}

/** 칸을 눌렀을 때 뜨는 명단 창(시간 표). 자리 잡기는 usePopPlacement. */
export function CellPopup({ cellKey, gridRef, info, names, max, onClose }) {
  const ref = useRef(null);
  const cellOf = usePopPlacement({ ref, gridRef, cellKey, onClose, deps: info });

  const date = cellKey.slice(0, 10);
  const t = cellKey.slice(11);
  const inf = info.get(cellKey) || { count: 0, members: [] };
  const no = names.filter((n) => !inf.members.includes(n));
  const all = names.length >= 2 && inf.count === names.length;
  return (
    <div ref={ref} className="tb-pop" role="dialog" aria-label="이 시간 참여 명단" style={{ visibility: "hidden" }}>
      <div className="tb-pop-head">
        <div>
          <p className="tb-pop-time">
            <BIcon name="clock" size={14} />
            {`${fmtDay(date)} ${t} ~ ${endOf(t)}`}
          </p>
          {(all || isGolden(inf.count, max)) && (
            <p className="tb-pop-gold">
              <BIcon name="gold" size={14} />
              {all ? "모두 돼요" : "가장 많이 모여요"}
            </p>
          )}
        </div>
        <button
          className="tb-pop-x"
          type="button"
          aria-label="닫기"
          onClick={() => {
            const cell = cellOf();
            onClose();
            cell?.focus();
          }}
        >
          <BIcon name="x" size={15} />
        </button>
      </div>
      <div className="tb-pop-row">
        <div className="tb-pop-label">
          <BIcon name="check" size={15} className="can" />
          <b>{inf.count}</b>
          <span className="tb-sr">명 가능</span>
        </div>
        <Names list={inf.members} can />
      </div>
      <div className="tb-pop-row">
        <div className="tb-pop-label">
          <BIcon name="x" size={15} className="no" />
          <b>{no.length}</b>
          <span className="tb-sr">명 불가</span>
        </div>
        <Names list={no} can={false} />
      </div>
    </div>
  );
}
