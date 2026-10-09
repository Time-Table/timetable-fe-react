import { forwardRef, useRef } from "react";
import BIcon from "./BIcon";
import { DAY_SHORT, dayFill, dayUnder, fmtDay, isGolden } from "./bModel";
import { usePopPlacement } from "./BGrid";

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
