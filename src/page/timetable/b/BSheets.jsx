import { useLayoutEffect, useRef, useState } from "react";
import BIcon from "./BIcon";
import { fmtDay, fmtRange, fracOf, shortDay, spanOf } from "./bModel";

/** 새 화면 창 안의 내용. 창 틀(BSheet)과 흐름(TableB)은 따로 둔다. 문구는 확정 시안 그대로다. */

/** 참여 창. 이름 규칙·뒤 공백 처리는 부르는 쪽(TableB)이 한다. onSubmit이 오류 글을 돌려주면 보인다. */
export function JoinBody({ onSubmit }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="tb-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;
        setError("");
        setPending(true);
        const message = await onSubmit(name, password);
        setPending(false);
        if (message) setError(message);
      }}
    >
      <label className="tb-field">
        <BIcon name="user" size={18} />
        <input
          id="tb-join-name"
          className="tb-input"
          placeholder="이름 또는 닉네임"
          aria-label="이름"
          maxLength={15}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          enterKeyHint="next"
          data-clarity-mask="true"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="tb-field">
        <BIcon name="lock" size={18} />
        <input
          className="tb-input"
          type="password"
          placeholder="비밀번호 (최소 1자리)"
          aria-label="비밀번호"
          maxLength={15}
          autoComplete="off"
          enterKeyHint="go"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <p className="tb-err" role="alert">
        {error}
      </p>
      <button className="tb-cta" type="submit" disabled={pending}>
        <BIcon name="pen" size={18} />
        시간 고르기
      </button>
      <p className="tb-terms">
        <a href="/terms">이용약관</a>
        <span aria-hidden="true">|</span>
        <a href="/privacy">개인정보처리방침</a>
      </p>
    </form>
  );
}

/** 참여 취소. 비밀번호를 서버가 확인한다(틀리면 401). */
export function LeaveBody({ onSubmit, onClose }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="tb-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;
        setError("");
        if (!password) {
          setError("비밀번호를 넣어 주세요.");
          return;
        }
        setPending(true);
        const message = await onSubmit(password);
        setPending(false);
        if (message) setError(message);
      }}
    >
      <p className="tb-desc">내 가능한 시간이 모두 지워지고 되돌릴 수 없어요. 남긴 대화는 그대로 남아요.</p>
      <div className="tb-pfield">
        <label className="tb-label" htmlFor="tb-leave-pw">
          비밀번호
        </label>
        <input
          id="tb-leave-pw"
          className="tb-input"
          type="password"
          maxLength={15}
          autoComplete="off"
          enterKeyHint="done"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <p className="tb-err" role="alert">
        {error}
      </p>
      <div className="tb-row2">
        <button className="tb-sub" type="button" onClick={onClose}>
          닫기
        </button>
        <button className="tb-cta" type="submit" disabled={pending}>
          참여 취소
        </button>
      </div>
    </form>
  );
}

/** 더보기(입력 중에만): 로그아웃 · 참여 취소. 로그아웃은 이 기기의 이름만 지우고 서버의 내 시간은 그대로 둔다. */
export function MoreBody({ me, onLogout, onLeave }) {
  return (
    <div className="tb-mine">
      <button className="tb-morerow" type="button" onClick={onLogout}>
        <BIcon name="logout" size={20} />
        <span className="tb-morerow-txt">
          <b>로그아웃</b>
          <small>내 시간은 그대로예요. 다른 사람 시간을 넣을 때 눌러요.</small>
        </span>
      </button>
      <button className="tb-morerow danger" type="button" onClick={onLeave}>
        <BIcon name="trash" size={20} />
        <span className="tb-morerow-txt">
          <b>참여 취소</b>
          <small data-clarity-mask="true">{`${me} 님의 시간이 모두 지워져요`}</small>
        </span>
      </button>
    </div>
  );
}

const FIRST = 5;
const STEP = 10;

/** 가장 많이 모이는 시간. 인원이 같으면 같은 순위, 처음 5줄에 "더 보기"로 10줄씩. 줄을 누르면 시간표 칸으로 간다. */
export function GoldBody({ ranked, total, onJump, onMore }) {
  const [shown, setShown] = useState(FIRST);
  if (!ranked.length) return <p className="tb-empty">아직 겹치는 시간이 없어요. 첫 번째로 시간을 넣어 보세요.</p>;
  const left = ranked.length - shown;
  return (
    <div>
      <ol className="tb-goldlist">
        {ranked.slice(0, shown).map(({ b, rank }) => (
          <li key={`${b.date}-${b.start}`}>
            <button
              className={`tb-goldrow${rank === 1 ? " top" : ""}`}
              type="button"
              aria-label={`${rank}위 ${fmtDay(b.date)} ${fmtRange(b)}, ${total}명 중 ${b.count}명. 시간표에서 보기`}
              onClick={() => onJump(b)}
            >
              {rank === 1 ? (
                <span className="tb-rank">
                  <BIcon name="gold" size={15} />
                </span>
              ) : (
                <span className="tb-rank">{rank}</span>
              )}
              <span className="tb-goldrow-main">
                <b>{shortDay(b.date)}</b>
                <span>{spanOf(b)}</span>
              </span>
              <span className="tb-count">
                <BIcon name="users" size={14} />
                {fracOf(b, total)}
              </span>
              <BIcon name="right" size={16} className="tb-chev" />
            </button>
          </li>
        ))}
      </ol>
      {left > 0 && (
        <button
          className="tb-sub wide"
          type="button"
          onClick={() => {
            onMore();
            setShown((n) => n + STEP);
          }}
        >
          {`더 보기 (${left}개 남음)`}
        </button>
      )}
    </div>
  );
}

const HelpRow = ({ icon, children }) => (
  <li className="tb-help-row">
    {icon}
    <span>{children}</span>
  </li>
);

/** 사용법(헤더 "?"). */
export function HelpBody({ multiWeek }) {
  return (
    <ul className="tb-helplist">
      <HelpRow
        icon={
          <span className="tb-help-tiles" aria-hidden="true">
            <i style={{ opacity: 0.3 }} />
            <i style={{ opacity: 0.6 }} />
            <i />
          </span>
        }
      >
        진할수록 많이 돼요
      </HelpRow>
      <HelpRow icon={<BIcon name="gold" size={20} />}>가장 많이 모이는 시간(제목 옆)</HelpRow>
      <HelpRow icon={<BIcon name="pointer" size={20} />}>칸을 누르면 명단</HelpRow>
      <HelpRow icon={<BIcon name="users" size={20} />}>이름을 여러 개 고르면 그 사람들끼리 되는 시간</HelpRow>
      {multiWeek && <HelpRow icon={<BIcon name="swipe" size={20} />}>‹ › 로 다른 주</HelpRow>}
      <HelpRow icon={<BIcon name="pen" size={20} />}>로그아웃·참여 취소는 내 시간 입력 중 [더보기]</HelpRow>
      <HelpRow icon={<BIcon name="share" size={20} />}>링크 보내기</HelpRow>
    </ul>
  );
}

const CHAT_MAX = 500;

/**
 * 대화. 전체를 보이고, 참여자 목록에 있는 이름일 때만 쓸 수 있다.
 * 서버 규칙: 앞뒤 공백을 뺀 1자 이상 500자 이하. 빈 글·공백만이면 보내기를 끄고, 400자부터 남은 양을 보인다.
 * onSend가 true를 돌려주면 입력칸을 비운다.
 */
export function ChatBody({ chats, chatsError, me, onSend, onJoin }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  useLayoutEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chats]);
  const n = text.length;
  return (
    <div>
      <div ref={listRef} className="tb-room" data-clarity-mask="true">
        {chatsError ? (
          <p className="tb-room-empty" role="alert">
            대화를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.
          </p>
        ) : chats.length === 0 ? (
          <p className="tb-room-empty">공지사항이나 의견을 자유롭게 남겨 보세요.</p>
        ) : (
          chats.map((c, i) =>
            me && c.name === me ? (
              <div key={c._id || i} className="tb-msg mine">
                <span className="tb-bubble mine">{c.message}</span>
              </div>
            ) : (
              <div key={c._id || i} className="tb-msg">
                <div className="tb-msg-body">
                  <span className="tb-sender">{c.name}</span>
                  <span className="tb-bubble">{c.message}</span>
                </div>
              </div>
            ),
          )
        )}
      </div>
      <form
        className="tb-chat-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const message = text.trim();
          if (!me || !message || sending) return;
          setSending(true);
          const ok = await onSend(message);
          setSending(false);
          if (ok) {
            setText("");
            inputRef.current?.focus();
          }
        }}
      >
        <input
          ref={inputRef}
          className="tb-chat-input"
          placeholder={me ? "메시지를 입력하세요" : "참여하면 글을 남길 수 있어요"}
          disabled={!me}
          aria-label="메시지"
          maxLength={CHAT_MAX}
          enterKeyHint="send"
          data-clarity-mask="true"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {me ? (
          <button className="tb-send" type="submit" disabled={sending || !text.trim()}>
            보내기
          </button>
        ) : (
          <button className="tb-send" type="button" onClick={onJoin}>
            참여하기
          </button>
        )}
      </form>
      <p className={`tb-chat-count${n >= CHAT_MAX ? " full" : ""}`} aria-live="polite" hidden={n < CHAT_MAX - 100}>
        {n >= CHAT_MAX ? `${CHAT_MAX}자까지 쓸 수 있어요` : `${n} / ${CHAT_MAX}`}
      </p>
    </div>
  );
}

/** 저장하지 않은 선택이 있을 때 묻는 창(입력 취소·로그아웃·참여 취소 앞). */
export function ConfirmBody({ text, goLabel, onStay, onGo }) {
  return (
    <div>
      <p className="tb-desc">{text}</p>
      <div className="tb-row2">
        <button className="tb-sub" type="button" onClick={onStay}>
          계속 고르기
        </button>
        <button className="tb-cta" type="button" onClick={onGo}>
          {goLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * 표에서 처음으로 시간을 넣은 사람에게 링크 공유를 권하는 가운데 창(2026-10-01 사람 확정: 체크 카드).
 * 버튼은 취소·공유하기(주 색)·확인. 뜰 때 동그라미가 통통 튀며 자리 잡고 체크가 뒤따른다(체크 움직임 3).
 */
export function PromptBody({ onShare, onClose }) {
  const [sharing, setSharing] = useState(false);
  return (
    <div className="tb-sp">
      <span className="tb-sp-badge" aria-hidden="true">
        <BIcon name="check" size={26} />
      </span>
      <h2 className="tb-sp-title">첫 번째로 시간을 넣었어요</h2>
      <p className="tb-sp-desc">아직 다른 사람은 없어요. 링크를 보내 친구들의 시간도 모아 보세요.</p>
      <button
        className="tb-cta"
        type="button"
        disabled={sharing}
        onClick={async () => {
          setSharing(true);
          await onShare();
          setSharing(false);
        }}
      >
        <BIcon name="share" size={20} />
        <span>공유하기</span>
      </button>
      <div className="tb-sp-row">
        <button className="tb-sub" type="button" onClick={onClose}>
          취소
        </button>
        <button className="tb-sub" type="button" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}
