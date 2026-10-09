import { forwardRef, useEffect, useRef } from "react";
import BIcon from "./BIcon";
import { DAY_SHORT, dayFill, dayUnder, fmtDay, isGolden } from "./bModel";
import { LONG_PRESS_MS, MOVE_SLOP, usePopPlacement } from "./BGrid";

/**
 * 날짜 투표 표의 달력(2026-10-09 사람 확정, 시안 하네스 캔버스 Final1~5·FinalSpec·FinalMonths·FinalPC).
 * 시간 없이 만든 표는 늘 새 화면이고, 시간표 대신 이 달력을 그린다. 규칙(FinalSpec):
 * - 한 달이든 여러 달이든 달마다 한 장. 달 이름 줄 아래 요일 줄과 그 달의 모든 주. 스크롤하면 달 이름·요일 줄이 위에 붙는다.
 * - 그 달이 아닌 칸은 연한 회색으로 비우고, 그 달이지만 후보가 아닌 날은 회색 칸·연한 날짜로 비활성(누를 수 없음).
 * - 칸 진하기는 그날 되는 사람 ÷ 참여자 수(0.12 + 0.88 × 비율). 칸·범례에 비율 숫자는 쓰지 않는다.
 * - 가장 많은 인원이 되는 날(동점이면 모두, 2명 이상일 때만)에 흰 동그라미 불꽃과 반짝임. 사람을 골라 보는 중에는 반짝임을 끈다.
 * - 내가 저장한 날에는 칸 아래 가운데 🙆‍♂️(날짜를 조금 올린다). 참여한 사람의 저장한 날짜에만.
 * - 칸을 누르면 명단 창. 그 칸은 2px 검은 테두리, 그 달 요일 글자는 빨강.
 * 입력 모드: 누르면 고르기·다시 누르면 지움, 요일 글자는 그 달의 그 요일 전부. 고른 칸은 코랄 꽉 + 🙆‍♂️, 안 고른 칸은 다른 사람 비율로 옅게.
 * 끌어서 여러 날 고르기(2026-10-10 사람 지시 "pc 드래그해서 날짜 선택, 모바일 드래그해서 날짜 선택 전부 지원"): useDatePaint.
 */

export const OK_EMOJI = "\u{1F646}‍♂️"; // 🙆‍♂️ 내가 되는 날(2026-10-09 사람 결정)

const headClass = (i, hl) => ["tb-cal-wd", i === 5 ? "sat" : "", i === 6 ? "sun" : "", hl ? "hl" : ""].filter(Boolean).join(" ");

const monthDayLabel = (key) => `${Number(key.slice(5, 7))}월 ${Number(key.slice(8, 10))}일`;

const OffCell = ({ c }) =>
  c.inMonth ? (
    <span className="tb-dc off" data-off={c.key} aria-disabled="true" aria-label={`${monthDayLabel(c.key)}, 후보 아님`}>
      <span className="tb-dc-num">{c.dnum}</span>
    </span>
  ) : (
    <span className="tb-dc out" aria-hidden="true" />
  );

const Emoji = () => (
  <span className="tb-dc-emo" aria-hidden="true">
    {OK_EMOJI}
  </span>
);

const MonthHead = ({ month, hlCol, onWeekday }) => (
  <div className="tb-cal-head">
    <h3 className="tb-cal-mon">{month.label}</h3>
    <div className="tb-cal-week">
      {DAY_SHORT.map((w, i) =>
        onWeekday ? (
          <button
            key={w}
            type="button"
            className={headClass(i, false)}
            aria-label={`${month.label} ${w}요일 전부 고르기·지우기`}
            onClick={() => onWeekday(month, i)}
          >
            {w}
          </button>
        ) : (
          <span key={w} className={headClass(i, hlCol === i)} aria-hidden="true">
            {w}
          </span>
        ),
      )}
    </div>
  </div>
);

/**
 * 모두의 날짜(보기). picks가 있으면 그 사람들끼리 모두 되는 날은 진하게, 일부만 되는 날은 옅게 둔다(시간표와 같은 규칙).
 */
export const DateViewCalendar = forwardRef(function DateViewCalendar(
  { months, info, total, max, mine, picks, popKey, onCell },
  ref,
) {
  return (
    <div ref={ref} className={`tb-cals${months.length > 1 ? " multi" : ""}`}>
      {months.map((month) => {
        const openHere = popKey && popKey.slice(0, 7) === month.key;
        const hlCol = openHere ? month.weeks.flat().find((c) => c.key === popKey)?.col : null;
        return (
          <section key={month.key} className="tb-cal" aria-label={month.label}>
            <MonthHead month={month} hlCol={hlCol} />
            <div className="tb-cal-grid" role="group" aria-label="모두의 가능한 날짜. 진할수록 그날 되는 사람이 많아요">
              {month.weeks.flat().map((c) => {
                if (!c.inMonth || !c.on) return <OffCell key={c.key} c={c} />;
                const inf = info.get(c.key);
                const count = inf ? inf.count : 0;
                let opacity = 0;
                if (picks.length) {
                  const n = inf ? picks.filter((p) => inf.members.includes(p)).length : 0;
                  opacity = n === picks.length ? 1 : n ? 0.12 + 0.28 * (n / picks.length) : 0;
                } else opacity = dayFill(count, total);
                const gold = isGolden(count, max);
                const isMine = mine.has(c.key);
                const label = [
                  `${fmtDay(c.key)} · ${count}명 가능`,
                  gold ? "가장 많이 모여요" : "",
                  isMine ? "나도 돼요" : "",
                ]
                  .filter(Boolean)
                  .join(", ");
                const cls = ["tb-dc", "tap", isMine ? "has-emo" : "", popKey === c.key ? "open" : ""].filter(Boolean).join(" ");
                return (
                  <button
                    key={c.key}
                    type="button"
                    className={cls}
                    data-key={c.key}
                    aria-haspopup="dialog"
                    aria-expanded={popKey === c.key}
                    aria-label={label}
                    onClick={() => onCell(c.key)}
                  >
                    {opacity > 0 && <span className="tb-dc-fill" style={{ opacity: opacity.toFixed(3) }} />}
                    {gold && !picks.length && <span className="tb-shine" aria-hidden="true" />}
                    <span className="tb-dc-num">{c.dnum}</span>
                    {gold && (
                      <span className="tb-dc-one" aria-hidden="true">
                        <BIcon name="gold" size={12} />
                      </span>
                    )}
                    {isMine && <Emoji />}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
});

/**
 * 날짜 칸 끌어 칠하기. 손동작은 시간표 칠하기(BGrid usePaint)와 같다.
 * - 마우스·펜: 누른 채 끌면 지나간 날을 칠한다. 처음 누른 날이 비어 있었으면 고르기, 골라져 있었으면 지우기.
 * - 손가락: 누르면 한 칸, 길게 누른 뒤 끌면 여러 칸, 옆으로 밀면 바로 칠하기. 세로로 밀면 화면이 내려간다(칸은 touch-action: pan-y).
 * 날짜 칸은 단추라 키보드(Enter·Space)로도 고른다. 끌기로 이미 바꾼 뒤 브라우저가 따라 보내는 click(마우스·손가락, detail ≥ 1)은
 * 손을 뗀 뒤 CLICK_GRACE_MS 동안 막아 두 번 바뀌지 않게 한다. iOS 사파리는 손을 뗀 뒤 click을 늦게 보내고, touchend를 막아도
 * 보낼 때가 있다(2026-10-10 iPhone 17e에서 고른 날을 탭하면 지웠다가 다시 고르던 문제). 키보드 click(detail 0)은 늘 받는다.
 * paintable(key)가 거짓인 날(후보 아님)은 건너뛴다. onPaint(added)는 칸이 바뀔 때마다 불린다(손을 떼기 전에도).
 */
const CLICK_GRACE_MS = 700;

export function useDatePaint(calRef, enabled, { selectedRef, paintable, onPaint, onEnd }) {
  const optsRef = useRef({ paintable, onPaint, onEnd });
  optsRef.current = { paintable, onPaint, onEnd };

  useEffect(() => {
    const container = calRef.current;
    if (!enabled || !container) return undefined;
    let mode = null;
    let start = null;
    let timer = 0;
    let lastEnd = -Infinity;
    const cellOf = (el) => el?.closest?.(".tb-dc.tap[data-key]");
    const ok = (cell) => !!cell && container.contains(cell) && optsRef.current.paintable(cell.dataset.key);
    const at = (x, y) => cellOf(document.elementFromPoint?.(x, y));
    const paint = (cell) => {
      if (!ok(cell)) return;
      const key = cell.dataset.key;
      const selected = selectedRef.current;
      const want = mode === "add";
      if (selected.has(key) === want) return;
      if (want) selected.add(key);
      else selected.delete(key);
      optsRef.current.onPaint(want);
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
      lastEnd = Date.now();
      optsRef.current.onEnd?.();
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) {
        finish();
        return;
      }
      const cell = cellOf(e.target);
      if (!ok(cell)) return;
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
      if (e.pointerType === "touch" || (e.button !== undefined && e.button !== 0)) return;
      const cell = cellOf(e.target);
      if (!ok(cell)) return;
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
    const onClickCapture = (e) => {
      // 키보드·보조기기 click(detail 0)은 그대로. 끄는 중이거나 막 손을 뗀 뒤의 마우스·손가락 click만 막는다.
      if (!e.detail || (!mode && Date.now() - lastEnd > CLICK_GRACE_MS)) return;
      // 날짜 칸, 또는 끌기 붙잡기로 달력 자체에 온 click만. 요일 글자 단추는 그대로 받는다.
      if (e.target !== container && !cellOf(e.target)) return;
      e.stopPropagation();
      e.preventDefault();
    };
    const onContextMenu = (e) => {
      if (cellOf(e.target)) e.preventDefault();
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", finish);
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerEnd);
    container.addEventListener("pointercancel", onPointerEnd);
    container.addEventListener("click", onClickCapture, true);
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
      container.removeEventListener("click", onClickCapture, true);
      container.removeEventListener("contextmenu", onContextMenu);
    };
    // 입력 모드에 들어갈 때 달력에 붙인다(달력 DOM은 입력 중에 바뀌지 않는다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

/** 내 날짜 고르기. 누르면 고르기·다시 누르면 지움, 요일 글자는 그 달의 그 요일 전부. */
export const DateEditCalendar = forwardRef(function DateEditCalendar(
  { months, info, total, me, selected, onDay, onWeekday },
  ref,
) {
  return (
    <div ref={ref} className={`tb-cals edit${months.length > 1 ? " multi" : ""}`}>
      {months.map((month) => (
        <section key={month.key} className="tb-cal" aria-label={month.label}>
          <MonthHead month={month} onWeekday={onWeekday} />
          <div className="tb-cal-grid" role="group" aria-label="내 가능한 날짜 고르기">
            {month.weeks.flat().map((c) => {
              if (!c.inMonth || !c.on) return <OffCell key={c.key} c={c} />;
              const picked = selected.has(c.key);
              const others = (info.get(c.key)?.members || []).filter((n) => n !== me).length;
              const under = picked ? 0 : dayUnder(others, total);
              return (
                <button
                  key={c.key}
                  type="button"
                  className={`tb-dc tap${picked ? " pick has-emo" : ""}`}
                  data-key={c.key}
                  aria-pressed={picked}
                  aria-label={`${fmtDay(c.key)}${picked ? ", 골랐어요" : ""}`}
                  onClick={() => onDay(c.key)}
                >
                  {under > 0 && <span className="tb-dc-under" style={{ opacity: under.toFixed(3) }} />}
                  <span className="tb-dc-num">{c.dnum}</span>
                  {picked && <Emoji />}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
});

/**
 * 날짜 칸 명단 창(시안 Final4). 되는 사람·안 되는 사람을 아이콘과 숫자만으로 나누고("명 돼요" 글자는 읽기 프로그램에만),
 * 나는 되는 사람 맨 앞에 🙆‍♂️와 "나", 날짜를 아직 안 넣은 사람은 "아직 안 넣음".
 */
export function DatePopup({ cellKey, gridRef, info, users, me, max, onClose }) {
  const ref = useRef(null);
  const cellOf = usePopPlacement({ ref, gridRef, cellKey, onClose, deps: info });
  const inf = info.get(cellKey) || { count: 0, members: [] };
  const names = users.map((u) => u.name);
  const can = [...inf.members].sort((a, b) => (a === me ? -1 : b === me ? 1 : 0));
  const no = names.filter((n) => !inf.members.includes(n)).sort((a, b) => (a === me ? -1 : b === me ? 1 : 0));
  const empty = new Set(users.filter((u) => !(u.availableTimes || []).length).map((u) => u.name));
  const all = names.length >= 2 && inf.count === names.length;
  return (
    <div ref={ref} className="tb-pop" role="dialog" aria-label="이 날 참여 명단" style={{ visibility: "hidden" }}>
      <div className="tb-pop-head">
        <div>
          <p className="tb-pop-time">
            <BIcon name="cal" size={14} />
            {fmtDay(cellKey)}
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
          <span className="tb-sr">명 돼요</span>
        </div>
        <div className="tb-pop-names" data-clarity-mask="true">
          {can.length ? (
            can.map((n) => (
              <span key={n} className={`tb-pop-name${n === me ? " me" : ""}`}>
                {n === me && (
                  <span className="tb-pop-emo" aria-hidden="true">
                    {OK_EMOJI}
                  </span>
                )}
                {n}
                {n === me && <small>나</small>}
              </span>
            ))
          ) : (
            <span className="tb-noname">없음</span>
          )}
        </div>
      </div>
      <div className="tb-pop-row">
        <div className="tb-pop-label">
          <BIcon name="x" size={15} className="no" />
          <b>{no.length}</b>
          <span className="tb-sr">명 안 돼요</span>
        </div>
        <div className="tb-pop-names" data-clarity-mask="true">
          {no.length ? (
            no.map((n) => (
              <span key={n} className="tb-pop-name no">
                {n}
                {n === me && <small>나</small>}
                {empty.has(n) && <small>아직 안 넣음</small>}
              </span>
            ))
          ) : (
            <span className="tb-noname">없음</span>
          )}
        </div>
      </div>
    </div>
  );
}
