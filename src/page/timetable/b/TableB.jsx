import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { joinUser, deleteUser } from "../../../api/user";
import { addSchedule } from "../../../api/schedule";
import { getChating, postChat } from "../../../api/chat";
import { trackEvent, EVENTS, trackClarityEvent, CLARITY_EVENTS } from "../../../utils/analytics";
import {
  readTableState,
  writeTableState,
  clearTableState,
  draftFor,
  validCellsOf,
  isDateOnlyTable,
  chatSeenAt,
  markChatsSeen,
  pickLabel,
} from "../../../utils/tableSession";
import { setPageHelp } from "../../../utils/pageHelp";
import { joinFailReason, joinTypeOf, saveFailReason } from "../../../utils/failReason";
import AdSense from "../../../component/AdSense";
import Loader from "../components/Loading";
import BIcon from "./BIcon";
import BSheet from "./BSheet";
import { ViewGrid, EditGrid, CellPopup, usePaint } from "./BGrid";
import { DateViewCalendar, DateEditCalendar, DatePopup, OK_EMOJI } from "./BCalendar";
import { JoinBody, LeaveBody, MoreBody, GoldBody, DayGoldBody, HelpBody, ChatBody, ConfirmBody, PromptBody } from "./BSheets";
import { BPage } from "./TableB.styles";
import { fireConfetti } from "./confetti";
import * as M from "./bModel";
import { removeStorage, writeStorage } from "../../../utils/storage";

/**
 * 새 화면(표 화면 B). 확정 시안(하네스 output/table-ab-sian/full, 2026-10-01 사람 확정)을 옮겼다.
 * 자료(표·참여자)와 공유 상태(고른 사람·보던 주)는 TimetablePage가 들고 A와 함께 쓴다. 여기서는 화면·흐름만 맡는다.
 * 계측은 A와 같은 서버 이벤트(uiVersion B가 붙는다)와 계약서 "새 화면(B) 계측"의 Clarity 이벤트다.
 *
 * 날짜 투표 표(2026-10-09, 시작·끝 시각 없음)는 실험과 관계없이 늘 이 화면이다(TimetablePage). 시간표 대신 달마다 달력을 그리고
 * (BCalendar), 칸은 날짜 "YYYY-MM-DD"다. 주 넘기기·칠하기 끌기·시간 잠금이 없고, 문구는 "시간" 대신 "날짜"다.
 */

const SAVE_PROMPT_DELAY_MS = 650;
const TOAST_MS = 2400;
const REFRESH_MS = 60000;

/** 실패 응답을 사람이 읽을 글로. 서버 글이 있으면 그것을 쓴다. */
const failText = (error, body, fallback) => {
  if (error && !error.response) return "인터넷 연결을 확인하고 다시 해 주세요.";
  const status = error?.response?.status;
  const message = error?.response?.data?.message || body?.message;
  if (status === 429) return message || "요청이 많아요. 잠시 뒤 다시 해 주세요.";
  return message || fallback;
};

const inviteUrl = (tableId) => `${process.env.REACT_APP_DOMAIN_URL || window.location.origin}/table/${tableId}`;

const canNativeShare = () => {
  try {
    return typeof navigator.share === "function" && !!window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  } catch (error) {
    return false;
  }
};

export default function TableB({
  tableId,
  table,
  users,
  scheduleStatus,
  me,
  onMeChange,
  picks,
  onPicksChange,
  weekKey,
  onWeekKeyChange,
  setUsers,
  onSaved,
  onReload,
  onRetry,
  isAdReady,
  onRendered,
}) {
  // 표 화면 A/B 2회차: 새 화면 내용이 처음 그려졌음을 알린다(TimetablePage가 이때 ui_view를 남긴다).
  // 자료를 받기 전 로딩·오류 화면은 알리지 않는다. booted는 한 번 켜지면 꺼지지 않으므로 한 번만 알린다.
  const renderedRef = useRef(onRendered);
  const [mode, setMode] = useState("view");
  const savedRef = useRef(new Set());
  const selectedRef = useRef(new Set());
  const [, bumpSel] = useReducer((n) => n + 1, 0);
  const [sheet, setSheet] = useState(null);
  const [popKey, setPopKey] = useState(null);
  const [hintOff, setHintOff] = useState(false);
  const [slide, setSlide] = useState(null);
  const [revealKey, setRevealKey] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatsError, setChatsError] = useState(false);
  const [, bumpSeen] = useReducer((n) => n + 1, 0);
  const [toast, setToast] = useState(null);
  const [coach, setCoach] = useState(false);
  const [saving, setSaving] = useState(false);
  const [booted, setBooted] = useState(scheduleStatus === "ready");
  // 공유 상태는 처음 한 번 읽어 둔다(기존 화면에서 입력 중이었으면 입력 모드로 이어서 연다).
  const [initialShared] = useState(() => readTableState(tableId));

  const cardRef = useRef(null);
  const gridRef = useRef(null);
  const chipsRef = useRef(null);
  const mainDockRef = useRef(null);
  const toastRef = useRef(null);
  const selectTrackedRef = useRef(false);
  const coachShownRef = useRef(false);
  const afterSaveRef = useRef(null);
  const promptTimerRef = useRef(0);

  // ---------- 자료 ----------
  const dateMode = isDateOnlyTable(table);
  const dates = useMemo(() => M.datesOf(table), [table]);
  const times = useMemo(() => (dateMode ? [] : M.timesOf(table)), [table, dateMode]);
  const locked = useMemo(() => new Set(table?.banedCells || []), [table]);
  const validCells = useMemo(
    () => validCellsOf({ dates: table?.dates, startHour: table?.startHour, endHour: table?.endHour, banedCells: table?.banedCells }),
    [table],
  );
  const info = useMemo(() => (dateMode ? M.dateInfoOf(users, table) : M.infoOf(users, table)), [users, table, dateMode]);
  const max = useMemo(() => M.maxOf(info), [info]);
  // 날짜 투표 표는 주 넘기기·시간 덩어리 대신 달력과 날짜 순위를 쓴다.
  const weeks = useMemo(() => (dateMode ? [] : M.calWeeks(dates)), [dates, dateMode]);
  const blocks = useMemo(() => (dateMode ? [] : M.blocksOf({ dates, times, locked, info })), [dates, times, locked, info, dateMode]);
  const months = useMemo(() => (dateMode ? M.monthsOf(dates) : []), [dates, dateMode]);
  const rankedDays = useMemo(() => (dateMode ? M.rankDays(info, dates) : []), [info, dates, dateMode]);
  const names = useMemo(() => users.map((u) => u.name), [users]);
  const joined = !!me && names.includes(me);
  const myTimes = useMemo(() => (joined ? users.find((u) => u.name === me)?.availableTimes || [] : []), [joined, users, me]);
  // 내가 저장한 날(날짜 투표 표의 🙆‍♂️). 참여한 사람의 저장한 날짜에만. 날짜 투표 표는 후보 날짜만 센다(옛 값·시간 칸은 빼고).
  const mineSet = useMemo(() => new Set(dateMode ? myTimes.filter((d) => validCells.has(d)) : []), [dateMode, myTimes, validCells]);
  const mine = dateMode ? mineSet.size : myTimes.length;
  const total = users.length;

  const sharedIndex = weekKey ? weeks.findIndex((w) => w[0].key === weekKey) : -1;
  const weekIndex = weeks.length ? Math.max(0, Math.min(sharedIndex >= 0 ? sharedIndex : M.firstWeekOf(blocks, weeks), weeks.length - 1)) : 0;
  const week = weeks[weekIndex] || [];

  // 처음 불러오기가 끝나면 그 뒤 새로 불러오는 동안에도 화면을 그대로 둔다(시안처럼 이전 자료로).
  useEffect(() => {
    if (scheduleStatus === "ready") setBooted(true);
  }, [scheduleStatus]);
  useEffect(() => {
    if (booted) renderedRef.current?.();
  }, [booted]);

  // 보던 주가 공유 상태에 없으면(처음 여는 표) 1위가 있는 주로 정하고 남긴다. 기존 화면으로 바꿔도 같은 주다.
  useEffect(() => {
    const key = weeks[weekIndex]?.[0]?.key;
    if (booted && key && key !== weekKey) onWeekKeyChange(key);
  }, [booted, weeks, weekIndex, weekKey, onWeekKeyChange]);

  // ---------- 알림 ----------
  const showToast = useCallback((text, { pop = false } = {}) => setToast({ id: Date.now() + Math.random(), text, pop }), []);
  useLayoutEffect(() => {
    const el = toastRef.current;
    if (!el || !toast) return undefined;
    // 저장 단추 뒤 안내는 아래에서 톡 튀어 오른다(이미 떠 있던 문구여도 처음부터 다시).
    el.classList.remove("pop");
    if (toast.pop) {
      void el.offsetWidth;
      el.classList.add("pop");
    }
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  // ---------- 대화 ----------
  const fetchChats = useCallback(async () => {
    const res = await getChating(tableId);
    if (res?.status === 200 && Array.isArray(res.data)) {
      setChats(res.data);
      setChatsError(false);
      return res.data;
    }
    if (res?.status === 201) {
      setChats([]);
      setChatsError(false);
      return [];
    }
    setChatsError(true);
    return null;
  }, [tableId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const seenAt = chatSeenAt(tableId);
  const unread = M.unreadOf(chats, seenAt, joined ? me : null);

  // ---------- 공용 ----------
  const scrollToCard = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    const header = document.querySelector("[data-site-header]");
    const top = card.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) - 8;
    try {
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    } catch (error) {
      // 스크롤을 못 해도 흐름은 이어진다.
    }
  }, []);

  const closeSheet = useCallback(() => setSheet(null), []);

  const share = useCallback(
    async ({ fromPrompt = false } = {}) => {
      // invite_share는 누른 순간의 공유·복사 시도다(계약서). 공유 창을 닫거나 복사가 실패해도 시도로 센다.
      trackEvent(EVENTS.INVITE_SHARE, tableId);
      trackClarityEvent(CLARITY_EVENTS.INVITE_SHARE_TABLE);
      if (fromPrompt) trackClarityEvent(CLARITY_EVENTS.B_PROMPT_SHARE);
      const url = inviteUrl(tableId);
      if (canNativeShare()) {
        try {
          await navigator.share({ title: table?.title || "타임테이블", text: "가능한 시간을 표시해 주세요.", url });
          return "shared";
        } catch (error) {
          // 공유 창을 닫으면 아무것도 하지 않는다.
          return null;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        showToast("링크를 복사했어요. 단톡방에 붙여 넣으세요.");
        return "copied";
      } catch (error) {
        showToast("복사하지 못했어요. 주소창의 링크를 직접 복사해 주세요.");
        return null;
      }
    },
    [tableId, table, showToast],
  );

  // ---------- 입력 모드 ----------
  const trackSelectOnce = useCallback(() => {
    if (selectTrackedRef.current) return;
    selectTrackedRef.current = true;
    trackClarityEvent(CLARITY_EVENTS.SCHEDULE_SELECT);
  }, []);

  const persistDraft = useCallback(() => {
    const dirty = !M.sameSet(selectedRef.current, savedRef.current);
    writeTableState(tableId, { name: me, editing: true, draft: dirty ? [...selectedRef.current].sort() : null });
  }, [tableId, me]);

  const openJoin = useCallback((title = "참여하기") => {
    trackClarityEvent(CLARITY_EVENTS.B_JOIN_OPEN);
    setPopKey(null);
    setSheet({ type: "join", title });
  }, []);

  const startEdit = useCallback(
    (name, list, { byUser = true } = {}) => {
      if (!name || !list.some((u) => u.name === name)) {
        // 서버에서 지워진 이름이면 로그아웃하고 그 이름의 공유 상태도 지운다(같은 이름으로 새로 들어온 사람에게 이어지지 않게).
        if (name) {
          removeStorage("name");
          onMeChange("");
          clearTableState(tableId);
        }
        openJoin();
        return;
      }
      const raw = [...(list.find((u) => u.name === name)?.availableTimes || [])];
      // 날짜 투표 표는 후보 날짜만 내 선택으로 연다(후보 밖·시간 칸 값은 저장하면 빠진다, BE도 같은 규칙).
      const saved = dateMode ? raw.filter((cell) => validCells.has(cell)) : raw;
      // 표 화면 A/B 공유 상태: 기존 화면에서 칠하던 칸(같은 이름)이 있으면 그것으로 시작한다.
      const draft = draftFor(readTableState(tableId), name, validCells, saved);
      savedRef.current = new Set(saved);
      selectedRef.current = new Set(draft || saved);
      writeTableState(tableId, { name, editing: true, draft: draft ? [...selectedRef.current].sort() : null });
      selectTrackedRef.current = false;
      setPopKey(null);
      setMode("edit");
      bumpSel();
      if (byUser) trackClarityEvent(CLARITY_EVENTS.B_EDIT_START);
      if (!coachShownRef.current) {
        coachShownRef.current = true;
        setCoach(true);
      }
      scrollToCard();
    },
    [tableId, validCells, dateMode, onMeChange, openJoin, scrollToCard],
  );

  const exitEdit = useCallback(() => {
    // 저장·취소로 입력을 끝내면 저장 안 한 선택을 비운다.
    writeTableState(tableId, { editing: false, draft: null });
    setMode("view");
    setCoach(false);
  }, [tableId]);

  const isDirty = () => mode === "edit" && !M.sameSet(selectedRef.current, savedRef.current);

  /** 저장하지 않은 칸이 있으면 먼저 묻는다(로그아웃·참여 취소 앞). */
  const guardDirty = (fn) => {
    if (!isDirty()) {
      fn();
      return;
    }
    setSheet({
      type: "confirm",
      title: dateMode ? "저장하지 않은 날짜가 있어요" : "저장하지 않은 시간이 있어요",
      text: dateMode ? "지금 고른 날짜는 저장되지 않아요. 그래도 할까요?" : "지금 고른 시간은 저장되지 않아요. 그래도 할까요?",
      goLabel: "그래도 하기",
      onGo: fn,
    });
  };

  const cancelEdit = () => {
    const leave = () => {
      trackClarityEvent(CLARITY_EVENTS.B_EDIT_CANCEL);
      exitEdit();
    };
    if (!isDirty()) {
      leave();
      return;
    }
    setSheet({
      type: "confirm",
      title: "저장하지 않고 나갈까요?",
      text: dateMode ? "지금 고른 날짜는 저장되지 않아요." : "지금 고른 시간은 저장되지 않아요.",
      goLabel: "나가기",
      onGo: leave,
    });
  };

  const toggleKeys = (keys, kind) => {
    const on = new Set(dates);
    const ks = keys.filter((k) => !locked.has(k) && on.has(k.slice(0, 10)));
    if (!ks.length) return;
    const selected = selectedRef.current;
    const all = ks.every((k) => selected.has(k));
    ks.forEach((k) => (all ? selected.delete(k) : selected.add(k)));
    if (!all) trackSelectOnce();
    trackClarityEvent(kind === "day" ? CLARITY_EVENTS.B_DAY_TOGGLE : CLARITY_EVENTS.B_HOUR_TOGGLE);
    persistDraft();
    bumpSel();
  };

  /** 날짜 투표 표: 날 하나를 고르거나 지운다(끌어 칠하기 없음). */
  const toggleDate = (key) => {
    if (!validCells.has(key)) return;
    const selected = selectedRef.current;
    if (selected.has(key)) selected.delete(key);
    else {
      selected.add(key);
      trackSelectOnce();
    }
    persistDraft();
    bumpSel();
  };

  /** 날짜 투표 표: 그 달의 그 요일 전부를 고르거나(하나라도 안 골랐으면) 지운다. */
  const toggleWeekday = (month, col) => {
    const keys = month.weeks.map((w) => w[col]).filter((c) => c.inMonth && c.on).map((c) => c.key);
    toggleKeys(keys, "day");
  };

  usePaint(gridRef, mode === "edit" && !dateMode, `${mode}:${weekIndex}`, {
    selectedRef,
    onPaint: (added) => {
      if (added) trackSelectOnce();
      persistDraft();
    },
    onEnd: bumpSel,
  });

  const saveEdit = async () => {
    if (saving) return;
    const selected = selectedRef.current;
    const saved = savedRef.current;
    if (M.sameSet(selected, saved)) {
      trackClarityEvent(CLARITY_EVENTS.B_SAVE_NOCHANGE);
      showToast(dateMode ? "바뀐 날짜가 없어요." : "바뀐 시간이 없어요.", { pop: true });
      exitEdit();
      return;
    }
    // 바뀐 시간이 있을 때 누른 순간이다(A는 이때만 저장 단추가 켜진다). 성공은 schedule_save로 따로 센다.
    trackClarityEvent(CLARITY_EVENTS.SCHEDULE_SAVE_CLICK);
    const hadTimes = saved.size > 0;
    const hasTimes = selected.size > 0;
    const cells = [...selected].sort();
    setSaving(true);
    let result = null;
    let error = null;
    try {
      result = await addSchedule(tableId, me, cells);
    } catch (e) {
      error = e;
    }
    setSaving(false);
    // 서버가 success: true를 줄 때만 저장된 것으로 본다. 아니면 칸과 입력 모드(공유 상태의 저장 안 한 칸)를 남긴다.
    if (error || result?.success !== true) {
      trackEvent(EVENTS.SAVE_FAIL, tableId, undefined, { reason: saveFailReason(error, result) });
      showToast(failText(error, result, "저장하지 못했어요. 잠시 뒤 다시 해 주세요."), { pop: true });
      return;
    }
    trackEvent(EVENTS.SCHEDULE_SAVE, tableId);
    const confirmed = Array.isArray(result.data?.userAvailableTimes) ? result.data.userAvailableTimes : cells;
    const savedPeople = users.filter((u) => u.name !== me && (u.availableTimes || []).length > 0).length + (confirmed.length > 0 ? 1 : 0);
    // 2026-10-01 사람 지시:
    // - 내 첫 저장(고치기가 아님)이면 "내 시간 고치기" 단추 자리에서 폭죽(보기 막대로 바뀐 뒤 터뜨린다).
    // - 그중 표에서 처음으로 시간을 넣은 사람(저장 뒤 시간을 넣은 사람이 나뿐)에게만 링크 공유를 권하는 창.
    // - 첫 번째가 아니면 "참여 가능한 시간을 저장했어요...", 고쳐 저장하면 "고친 시간을 저장했어요!".
    // - 저장 단추를 누른 뒤 뜨는 안내(바뀐 것 없음·실패 포함)는 모두 톡 튀어 오른다.
    afterSaveRef.current = { firstSave: !hadTimes && hasTimes, onlyMe: savedPeople === 1, hasTimes };
    exitEdit();
    scrollToCard();
    onSaved({ name: me, availableTimes: confirmed });
  };

  // 저장 뒤 보기 막대가 그려진 다음: 폭죽·권유 창·안내.
  useLayoutEffect(() => {
    const after = afterSaveRef.current;
    if (!after || mode !== "view") return;
    afterSaveRef.current = null;
    let burst = false;
    if (after.firstSave) {
      const origin = mainDockRef.current?.getBoundingClientRect();
      burst = fireConfetti({ origin });
    }
    if (after.firstSave && after.onlyMe) {
      const open = () => {
        trackClarityEvent(CLARITY_EVENTS.B_SAVE_PROMPT);
        setSheet({ type: "prompt" });
      };
      if (burst) promptTimerRef.current = setTimeout(open, SAVE_PROMPT_DELAY_MS);
      else open();
    } else if (after.firstSave) {
      showToast(`참여 가능한 ${dateMode ? "날짜를" : "시간을"} 저장했어요. 이제 모두가 볼 수 있어요.`, { pop: true });
    } else if (dateMode) showToast(after.hasTimes ? "고친 날짜를 저장했어요!" : "내 날짜를 모두 지웠어요.", { pop: true });
    else showToast(after.hasTimes ? "고친 시간을 저장했어요!" : "내 시간을 모두 지웠어요.", { pop: true });
  }, [mode, showToast, dateMode]);
  useEffect(() => () => clearTimeout(promptTimerRef.current), []);

  // ---------- 참여·나가기 ----------
  const submitJoin = async (typed, password) => {
    const name = M.resolveName(typed, names);
    const invalid = M.validateJoin(name.trim() ? name : "", password);
    if (invalid) {
      trackEvent(EVENTS.JOIN_FAIL, tableId, undefined, { reason: "invalid_input" });
      return invalid;
    }
    trackEvent(EVENTS.JOIN_SUBMIT, tableId);
    const res = await joinUser(tableId, name, password);
    if (!res || res.success === false || ![200, 201].includes(res.code)) {
      trackEvent(EVENTS.JOIN_FAIL, tableId, undefined, { reason: joinFailReason(res) });
      if (res?.code === 401) return "비밀번호가 달라요. 처음 정한 비밀번호를 넣어 주세요.";
      if (res?.status === 429) return res.message || "요청이 많아요. 잠시 뒤 다시 해 주세요.";
      return res ? res.message || "참여하지 못했어요. 잠시 뒤 다시 해 주세요." : "인터넷 연결을 확인하고 다시 해 주세요.";
    }
    trackEvent(EVENTS.JOIN_SUCCESS, tableId, undefined, { joinType: joinTypeOf(res) });
    // 서버가 돌려준 이름을 쓴다(기존 화면 JoinForm과 같다).
    const saved = typeof res.data?.name === "string" ? res.data.name : name;
    const times = Array.isArray(res.data?.availableTimes) ? res.data.availableTimes : [];
    writeStorage("tableId", tableId);
    writeStorage("name", saved);
    onMeChange(saved);
    // 다시 불러오기가 실패해도 참여는 된 것이다. 목록에 먼저 넣어 두어 입력 화면이 로그아웃으로 바뀌지 않게 한다.
    const add = (list) => (list.some((u) => u.name === saved) ? list : [...list, { name: saved, availableTimes: times }]);
    setUsers(add);
    const fresh = await onReload();
    const listed = fresh.ok && fresh.users.some((u) => u.name === saved);
    if (!listed) setUsers(add);
    const list = add(fresh.ok ? fresh.users : users);
    setSheet(null);
    if (!listed) showToast(`${saved} 님으로 들어왔어요. 참여자 목록은 잠시 뒤 다시 맞춰져요.`);
    else if (dateMode) {
      showToast(res.code === 201 ? `${saved} 님, 환영해요. 되는 날을 골라 주세요.` : `${saved} 님으로 들어왔어요. 날짜를 고칠 수 있어요.`);
    } else showToast(res.code === 201 ? `${saved} 님, 환영해요. 되는 시간을 칠해 주세요.` : `${saved} 님으로 들어왔어요. 시간을 고칠 수 있어요.`);
    // 참여 뒤 저절로 여는 입력은 사람이 누른 입력 시작(tt_b_edit_start)으로 세지 않는다(Codex 교차 검증 2026-10-01).
    startEdit(saved, list, { byUser: false });
    return "";
  };

  const logout = () => {
    trackClarityEvent(CLARITY_EVENTS.B_LOGOUT);
    removeStorage("name");
    onMeChange("");
    // 앞사람의 저장 안 한 선택이 다음 사람에게 이어지지 않게 공유 상태를 지운다.
    clearTableState(tableId);
    setMode("view");
    setCoach(false);
    onPicksChange([]);
    openJoin("누구 시간을 넣을까요?");
  };

  const submitLeave = async (password) => {
    const res = await deleteUser(tableId, me, password);
    if (!res?.success) {
      if (res?.status === 401 || res?.code === 401) return "비밀번호가 달라요.";
      return res ? res.message || "지우지 못했어요. 잠시 뒤 다시 해 주세요." : "인터넷 연결을 확인하고 다시 해 주세요.";
    }
    const gone = me;
    removeStorage("name");
    onMeChange("");
    clearTableState(tableId);
    setUsers((list) => list.filter((u) => u.name !== gone));
    setSheet(null);
    setMode("view");
    setCoach(false);
    showToast(dateMode ? "참여를 취소했어요. 내 날짜가 지워졌어요." : "참여를 취소했어요. 내 시간이 지워졌어요.");
    onReload();
    return "";
  };

  // ---------- 보기 ----------
  const onCell = (key) => {
    if (popKey === key) {
      setPopKey(null);
      return;
    }
    trackClarityEvent(CLARITY_EVENTS.TIMETABLE_CELL);
    setHintOff(true);
    setPopKey(key);
  };

  const go = (next) => {
    const j = Math.max(0, Math.min(weeks.length - 1, next));
    if (j === weekIndex) return;
    trackClarityEvent(CLARITY_EVENTS.B_WEEK_NAV);
    setPopKey(null);
    setSlide(j > weekIndex ? "left" : "right");
    onWeekKeyChange(weeks[j][0].key);
  };
  useEffect(() => {
    if (!slide) return undefined;
    const timer = setTimeout(() => setSlide(null), 260);
    return () => clearTimeout(timer);
  }, [slide]);

  /** 시간표의 그 칸으로 가서 명단을 연다. keepPicks면 고른 사람을 그대로 둔다. */
  const jump = (b, keepPicks) => {
    if (!keepPicks) onPicksChange([]);
    const wi = M.weekOf(weeks, b.date);
    if (wi >= 0) onWeekKeyChange(weeks[wi][0].key);
    setPopKey(null);
    setRevealKey(`${b.date}-${b.start}`);
  };
  /** 날짜 투표 표: 달력의 그 날로 가서 명단을 연다. keepPicks면 고른 사람을 그대로 둔다. */
  const jumpDate = (date, keepPicks) => {
    if (!keepPicks) onPicksChange([]);
    setPopKey(null);
    setRevealKey(date);
  };
  useEffect(() => {
    if (!revealKey) return;
    const cell = gridRef.current?.querySelector(`[data-key="${revealKey}"]`);
    setRevealKey(null);
    if (!cell) return;
    try {
      cell.scrollIntoView?.({ block: "center", behavior: "smooth" });
    } catch (error) {
      // 스크롤을 못 해도 명단은 연다.
    }
    setHintOff(true);
    setPopKey(revealKey);
  }, [revealKey]);

  const togglePick = (name) => {
    const next = new Set(picks);
    if (next.has(name)) next.delete(name);
    else {
      next.add(name);
      trackClarityEvent(CLARITY_EVENTS.B_PICK);
    }
    setPopKey(null);
    onPicksChange(names.filter((n) => next.has(n)));
  };

  const openChat = async () => {
    trackClarityEvent(CLARITY_EVENTS.B_CHAT_OPEN);
    setPopKey(null);
    setSheet({ type: "chat" });
    markChatsSeen(tableId, chats);
    bumpSeen();
    const fresh = await fetchChats();
    if (fresh) markChatsSeen(tableId, fresh);
    bumpSeen();
  };

  const sendChat = async (message) => {
    const res = await postChat(tableId, me, message);
    if (!res?.success) {
      showToast(res?.message || "보내지 못했어요. 잠시 뒤 다시 해 주세요.");
      return false;
    }
    trackClarityEvent(CLARITY_EVENTS.CHAT_SEND);
    const fresh = await fetchChats();
    if (fresh) markChatsSeen(tableId, fresh);
    bumpSeen();
    return true;
  };

  // ---------- 헤더 "?" = 사용법 ----------
  useEffect(
    () =>
      setPageHelp({
        label: "사용법 보기",
        open: () => {
          trackClarityEvent(CLARITY_EVENTS.B_HELP_OPEN);
          setSheet({ type: "help" });
        },
      }),
    [],
  );

  // ---------- 처음 그린 뒤: 입력 이어 열기 또는 보기 상태 남기기 ----------
  const resumedRef = useRef(false);
  useEffect(() => {
    if (!booted || resumedRef.current) return;
    resumedRef.current = true;
    if (me && initialShared.name === me && initialShared.editing && names.includes(me)) startEdit(me, users, { byUser: false });
    else writeTableState(tableId, { name: me || null, editing: false });
  }, [booted, me, names, users, initialShared, startEdit, tableId]);

  // ---------- 1분 새로고침(보기 화면이 보이고 창·명단·입력이 없을 때만) ----------
  const idleRef = useRef(false);
  idleRef.current = mode === "view" && !sheet && !popKey;
  useEffect(() => {
    if (!booted) return undefined;
    let failedOnce = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible" || !idleRef.current) return;
      const [fresh] = await Promise.all([onReload(), fetchChats()]);
      if (!fresh.ok) {
        // 연결이 끊겨 못 불러오면 한 번만 알린다. 화면은 이전 자료 그대로.
        if (!failedOnce) showToast("새 정보를 불러오지 못했어요. 연결을 확인해 주세요.");
        failedOnce = true;
        return;
      }
      failedOnce = false;
    };
    // 뒤로 가기로 돌아오면 사파리가 페이지를 그대로 되살려(bfcache) 다음 새로고침까지 옛 자료가 보였다. 되살아나면 바로 불러온다.
    const onShow = (e) => {
      if (e.persisted) refresh();
    };
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pageshow", onShow);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pageshow", onShow);
    };
  }, [booted, onReload, fetchChats, showToast]);

  // ---------- 참여자 칩 끝 흐림 ----------
  useEffect(() => {
    const chips = chipsRef.current;
    if (!chips) return undefined;
    const sync = () => {
      chips.classList.toggle("fade-l", chips.scrollLeft > 2);
      chips.classList.toggle("fade-r", chips.scrollLeft + chips.clientWidth < chips.scrollWidth - 2);
    };
    sync();
    chips.addEventListener("scroll", sync, { passive: true });
    return () => chips.removeEventListener("scroll", sync);
  });

  // ---------- 그리기 ----------
  if (!booted) {
    return (
      <BPage>
        <div className="tb-col">
          {scheduleStatus === "error" ? (
            <div className="tb-body" role="alert" style={{ padding: "32px 16px", textAlign: "center" }}>
              <p className="tb-empty">참여자와 일정을 불러오지 못했어요. 연결을 확인하고 다시 불러와 주세요.</p>
              <button className="tb-cta" type="button" onClick={onRetry}>
                다시 불러오기
              </button>
            </div>
          ) : (
            <Loader />
          )}
        </div>
      </BPage>
    );
  }

  const edit = mode === "edit";
  const selected = selectedRef.current;
  const nWeeks = weeks.length;
  const top = blocks[0];
  const tipKey = picks.length || hintOff ? null : M.goldenKeyOf(blocks, max);
  const common = !dateMode && !edit && picks.length >= 2 ? M.commonBlocksOf(picks, { dates, times, locked, info }) : null;
  const dur = selected.size ? (dateMode ? M.dayCount(selected.size) : M.duration(selected.size)) : "없음";
  // 날짜 투표 표: 1위 날(동점이면 이른 날), 고른 사람들끼리 모두 되는 날.
  const topDay = dateMode ? rankedDays[0]?.d || null : null;
  const commonDays = dateMode && !edit && picks.length >= 2 ? M.commonDaysOf(picks, info, dates) : null;
  const unit = dateMode ? "날짜" : "시간";
  const weekSub = edit
    ? (() => {
        const m = M.myInWeek(week, times, selected);
        return m ? `이번주 ${M.duration(m)}` : "이번주 시간 없음";
      })()
    : (() => {
        const mx = M.weekMax(week, { times, locked, info });
        return mx ? `최대 ${mx}명` : "아직 없음";
      })();

  const legendBox = (
    <div className="tb-legend" aria-hidden="true">
      {edit ? (
        <>
          <BIcon name="pen" size={14} />
          <span className="tb-sw" />
          <span className="tb-gap" />
          <BIcon name="users" size={14} />
          <span className="tb-sw light" />
        </>
      ) : picks.length === 1 ? (
        <>
          <BIcon name="user" size={14} />
          <span className="tb-sw" />
          <span className="tb-legend-name" data-clarity-mask="true">
            {picks[0]}
          </span>
        </>
      ) : picks.length > 1 ? (
        <>
          <BIcon name="users" size={14} />
          <span className="tb-sw" />
          <span className="tb-legend-name">모두</span>
          <span className="tb-gap" />
          <span className="tb-sw light" />
          <span className="tb-legend-name">일부</span>
        </>
      ) : (
        <>
          <BIcon name="user" size={14} />
          <span className="tb-scale" />
          <BIcon name="users" size={14} />
        </>
      )}
    </div>
  );

  // 날짜 투표 표 범례(시안 Final1~3·FinalSpec). 게이지 양끝은 사람 한 명 ↔ 여러 명 아이콘, 옆에 🙆‍♂️ 내가 되는 날.
  // 사람을 골라 보는 중에는 시간표와 같은 범례(모두·일부)다.
  const dateLegend = !dateMode ? null : edit ? (
    <>
      <div className="tb-legend tb-legend-date" aria-hidden="true">
        <span className="tb-lg-item">
          <span className="tb-sw-day pick">
            <span className="tb-sw-emo">{OK_EMOJI}</span>
          </span>
          내가 고른 날
        </span>
        <span className="tb-lg-item">
          <span className="tb-sw-day light" />
          다른 사람이 되는 날
        </span>
      </div>
      <p className="tb-legend-note">요일 글자를 누르면 그 요일을 한꺼번에 고르거나 지워요.</p>
    </>
  ) : picks.length ? (
    legendBox
  ) : (
    <div className="tb-legend tb-legend-date" aria-hidden="true">
      <span className="tb-lg-item">
        <BIcon name="user" size={14} />
        <span className="tb-grad" />
        <BIcon name="users" size={14} />
      </span>
      {mineSet.size > 0 && (
        <span className="tb-lg-item">
          <span className="tb-lg-emo">{OK_EMOJI}</span>
          내가 되는 날
        </span>
      )}
    </div>
  );
  const dateCalendar = !dateMode ? null : edit ? (
    <DateEditCalendar
      ref={gridRef}
      months={months}
      info={info}
      total={total}
      me={me}
      selected={selected}
      onDay={toggleDate}
      onWeekday={toggleWeekday}
    />
  ) : (
    <DateViewCalendar
      ref={gridRef}
      months={months}
      info={info}
      total={total}
      max={max}
      mine={mineSet}
      picks={picks}
      popKey={popKey}
      onCell={onCell}
    />
  );

  const renderSheet = () => {
    if (!sheet) return null;
    switch (sheet.type) {
      case "join":
        return (
          <BSheet title={sheet.title} onClose={closeSheet} initialFocus="#tb-join-name">
            <JoinBody onSubmit={submitJoin} dateMode={dateMode} />
          </BSheet>
        );
      case "leave":
        return (
          <BSheet title="참여를 취소할까요?" onClose={closeSheet}>
            <LeaveBody onSubmit={submitLeave} onClose={closeSheet} dateMode={dateMode} />
          </BSheet>
        );
      case "more":
        return (
          <BSheet title="더보기" onClose={closeSheet}>
            <MoreBody
              me={me}
              dateMode={dateMode}
              onLogout={() => {
                setSheet(null);
                guardDirty(logout);
              }}
              onLeave={() => {
                setSheet(null);
                guardDirty(() => setSheet({ type: "leave" }));
              }}
            />
          </BSheet>
        );
      case "gold":
        if (dateMode) {
          return (
            <BSheet title="가장 많이 모이는 날" onClose={closeSheet}>
              <DayGoldBody
                ranked={rankedDays}
                total={total}
                mine={mineSet}
                onJump={(d) => {
                  trackClarityEvent(CLARITY_EVENTS.B_RANK_JUMP);
                  setSheet(null);
                  jumpDate(d.date, false);
                }}
                onMore={() => trackClarityEvent(CLARITY_EVENTS.B_RANK_MORE)}
              />
            </BSheet>
          );
        }
        return (
          <BSheet title="가장 많이 모이는 시간" onClose={closeSheet}>
            <GoldBody
              ranked={M.rankBlocks(blocks)}
              total={total}
              onJump={(b) => {
                trackClarityEvent(CLARITY_EVENTS.B_RANK_JUMP);
                setSheet(null);
                jump(b, false);
              }}
              onMore={() => trackClarityEvent(CLARITY_EVENTS.B_RANK_MORE)}
            />
          </BSheet>
        );
      case "help":
        return (
          <BSheet title="사용법" onClose={closeSheet}>
            <HelpBody multiWeek={nWeeks > 1} dateMode={dateMode} />
          </BSheet>
        );
      case "chat":
        return (
          <BSheet
            title={`대화 ${chats.length}`}
            onClose={() => {
              markChatsSeen(tableId, chats);
              bumpSeen();
              closeSheet();
            }}
          >
            <ChatBody
              chats={chats}
              chatsError={chatsError}
              me={joined ? me : null}
              onSend={sendChat}
              onJoin={() => {
                setSheet(null);
                openJoin();
              }}
            />
          </BSheet>
        );
      case "confirm":
        return (
          <BSheet title={sheet.title} onClose={closeSheet}>
            <ConfirmBody
              text={sheet.text}
              goLabel={sheet.goLabel}
              onStay={closeSheet}
              onGo={() => {
                setSheet(null);
                sheet.onGo();
              }}
            />
          </BSheet>
        );
      case "prompt":
        return (
          <BSheet title={null} label={dateMode ? "첫 번째로 날짜를 넣었어요" : "첫 번째로 시간을 넣었어요"} center onClose={closeSheet}>
            <PromptBody onShare={() => share({ fromPrompt: true })} onClose={closeSheet} dateMode={dateMode} />
          </BSheet>
        );
      default:
        return null;
    }
  };

  return (
    <BPage className={sheet ? "sheet-open" : undefined}>
      <div className="tb-col">
        <div className="tb-body">
          <section ref={cardRef} className="tb-card" aria-labelledby="tb-title">
            <div className="tb-facts">
              <span className="tb-fact" aria-label={`기간 ${M.periodOf(dates)}`}>
                <BIcon name="cal" size={14} />
                {M.periodOf(dates)}
              </span>
              {nWeeks > 1 && <span className="tb-fact tb-weeks">{`${nWeeks}주`}</span>}
            </div>
            <div className="tb-head">
              <h1 className="tb-title" id="tb-title" data-clarity-mask="true">
                {table.title}
              </h1>
              {!edit && (
                <button
                  className="tb-goldbtn"
                  type="button"
                  aria-label={
                    dateMode
                      ? topDay
                        ? `가장 많이 모이는 날 ${M.fmtDay(topDay.date)}, ${total}명 중 ${topDay.count}명. 순위 보기`
                        : "가장 많이 모이는 날 보기"
                      : top
                        ? `가장 많이 모이는 시간 ${M.fmtDay(top.date)} ${M.fmtRange(top)}, ${total}명 중 ${top.count}명. 순위 보기`
                        : "가장 많이 모이는 시간 보기"
                  }
                  onClick={() => {
                    trackEvent(EVENTS.RANKING_OPEN, tableId);
                    setPopKey(null);
                    setSheet({ type: "gold" });
                  }}
                >
                  <BIcon name="gold" size={22} />
                </button>
              )}
            </div>
            {edit ? null : total === 0 ? (
              <p className="tb-empty">아직 아무도 없어요. 첫 번째로 참여해 보세요!</p>
            ) : (
              <div
                ref={chipsRef}
                className="tb-chips"
                role="group"
                aria-label="참여자. 여러 명을 고르면 그 사람들끼리 되는 시간이 보여요"
                data-clarity-mask="true"
              >
                <button
                  className="tb-chip"
                  type="button"
                  aria-pressed={picks.length === 0}
                  aria-label={`전체 ${total}명 보기`}
                  onClick={() => {
                    setPopKey(null);
                    onPicksChange([]);
                  }}
                >
                  <BIcon name="users" size={15} />
                  {`전체 ${total}`}
                </button>
                {users.map((u) => {
                  const has = (u.availableTimes || []).length > 0;
                  const on = picks.includes(u.name);
                  return (
                    <button
                      key={u.name}
                      className={`tb-chip${has ? "" : " todo"}`}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${u.name}${u.name === me ? "(나)" : ""}${has ? "" : `, 아직 ${unit}${dateMode ? "를" : "을"} 안 넣음`}. ${on ? "빼기" : "고르기"}`}
                      onClick={() => togglePick(u.name)}
                    >
                      <BIcon name={on ? "check" : "user"} size={15} />
                      {u.name}
                      {u.name === me && <small className="tb-me">나</small>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 날짜 투표 표의 1위 카드(시안 Final1·2): 불꽃 + 날짜만, 내 날이면 날짜 뒤 🙆‍♂️. 누르면 그 날 명단 창. */}
            {dateMode && !edit && !picks.length && topDay && (
              <button
                className="tb-best"
                type="button"
                aria-label={`가장 많이 모이는 날 ${M.fmtDay(topDay.date)}, ${topDay.count}명 가능${mineSet.has(topDay.date) ? ", 나도 돼요" : ""}. 명단 보기`}
                onClick={() => {
                  trackClarityEvent(CLARITY_EVENTS.B_BEST_OPEN);
                  jumpDate(topDay.date, true);
                }}
              >
                <span className="tb-best-icon" aria-hidden="true">
                  <BIcon name="gold" size={18} />
                </span>
                <b>
                  {M.fmtDay(topDay.date)}
                  {mineSet.has(topDay.date) && (
                    <span className="tb-me-emo" aria-hidden="true">
                      {OK_EMOJI}
                    </span>
                  )}
                </b>
                <BIcon name="right" size={16} className="tb-chev" />
              </button>
            )}

            {commonDays && (
              <div className="tb-common" role="status" data-clarity-mask="true">
                <span className="tb-common-who">
                  <BIcon name="users" size={15} />
                  {`${pickLabel(picks)} 모두`}
                </span>
                {commonDays.length ? (
                  <button
                    className="tb-common-best"
                    type="button"
                    aria-label={`${pickLabel(picks)} 모두 되는 날 ${M.fmtDay(commonDays[0])}, 모두 ${commonDays.length}일. 달력에서 보기`}
                    onClick={() => {
                      trackClarityEvent(CLARITY_EVENTS.B_COMMON_JUMP);
                      jumpDate(commonDays[0], true);
                    }}
                  >
                    {M.shortDay(commonDays[0])}
                    {commonDays.length > 1 && <small>{`외 ${commonDays.length - 1}일`}</small>}
                    <BIcon name="right" size={14} className="tb-chev" />
                  </button>
                ) : (
                  <span className="tb-common-none">모두 되는 날이 아직 없어요</span>
                )}
              </div>
            )}

            {common && (
              <div className="tb-common" role="status" data-clarity-mask="true">
                <span className="tb-common-who">
                  <BIcon name="users" size={15} />
                  {`${pickLabel(picks)} 모두`}
                </span>
                {common.length ? (
                  <button
                    className="tb-common-best"
                    type="button"
                    aria-label={`${pickLabel(picks)} 모두 되는 시간 ${M.fmtDay(common[0].date)} ${M.fmtRange(common[0])}, 모두 ${common.length}곳. 시간표에서 보기`}
                    onClick={() => {
                      trackClarityEvent(CLARITY_EVENTS.B_COMMON_JUMP);
                      jump(common[0], true);
                    }}
                  >
                    {`${M.shortDay(common[0].date)} ${M.spanOf(common[0])}`}
                    {common.length > 1 && <small>{`외 ${common.length - 1}곳`}</small>}
                    <BIcon name="right" size={14} className="tb-chev" />
                  </button>
                ) : (
                  <span className="tb-common-none">모두 되는 시간이 아직 없어요</span>
                )}
              </div>
            )}

            {/* 입력 중에는 제목 아래 알약 대신 주 넘기기 가운데에 "ㅇㅇ 님의 가능한 시간"을 크게 두고, 칠하기 안내는 그 아래에 둔다
                (2026-10-04 사람 결정: 시안 1·안내 띠 아래·primary 색, output/table-ab-sian/edit-label). 1주짜리 표는 화살표 없이 문구만. */}
            {/* 날짜 투표 표 입력 중(시안 Final3): "ㅇㅇ 님의 날짜" 알약과 고르는 법 한 줄. */}
            {dateMode && edit && (
              <>
                <p className="tb-editing" data-clarity-mask="true">
                  <BIcon name="pen" size={14} />
                  {`${me} 님의 날짜`}
                </p>
                <p className="tb-hint">
                  <BIcon name="cal" size={16} />
                  되는 날을 누르면 고르기
                  <span className="tb-dotsep" aria-hidden="true">
                    ·
                  </span>
                  다시 누르면 지움
                </p>
              </>
            )}

            {!dateMode && (edit || nWeeks > 1) && (
              <div className={`tb-weekbar${nWeeks > 1 ? "" : " solo"}`}>
                {nWeeks > 1 && (
                  <button className="tb-navbtn" type="button" aria-label="이전 주" disabled={weekIndex === 0} onClick={() => go(weekIndex - 1)}>
                    <BIcon name="left" size={20} />
                  </button>
                )}
                {edit ? (
                  <div className="tb-weeklabel me" role="status" data-clarity-mask="true">
                    <span className="tb-melabel">
                      <span className="tb-mewho">{`${me} 님의`}</span>
                      <span className="tb-mewhat">가능한 시간</span>
                    </span>
                    {nWeeks > 1 && <span className="tb-mesub">{`${weekIndex + 1} / ${nWeeks}주`}</span>}
                    <span className="tb-mesub">{weekSub}</span>
                  </div>
                ) : (
                  <div className="tb-weeklabel" role="status">
                    <b>{M.weekRangeOf(week)}</b>
                    <span>{`${weekIndex + 1} / ${nWeeks}주 · ${weekSub}`}</span>
                  </div>
                )}
                {nWeeks > 1 && (
                  <button
                    className="tb-navbtn"
                    type="button"
                    aria-label="다음 주"
                    disabled={weekIndex === nWeeks - 1}
                    onClick={() => go(weekIndex + 1)}
                  >
                    <BIcon name="right" size={20} />
                  </button>
                )}
              </div>
            )}

            {!dateMode && edit && (
              <p className="tb-hint">
                {/* 손가락용·마우스용 중 하나만 보인다(TableB.styles.js .tb-hint-touch·.tb-hint-mouse). */}
                <span className="tb-hint-touch">
                  <BIcon name="pointer" size={16} />
                  한 칸
                  <span className="tb-dotsep" aria-hidden="true">
                    ·
                  </span>
                  <BIcon name="move" size={16} />
                  길게 눌러 끌기
                </span>
                <span className="tb-hint-mouse">
                  <BIcon name="pointer" size={16} />
                  클릭 한 칸
                  <span className="tb-dotsep" aria-hidden="true">
                    ·
                  </span>
                  <BIcon name="move" size={16} />
                  누른 채 끌기
                </span>
              </p>
            )}

            {!dateMode && (
              <>
                {edit ? (
                  <EditGrid
                    key={`e${weekIndex}`}
                    ref={gridRef}
                    week={week}
                    times={times}
                    locked={locked}
                    info={info}
                    max={max}
                    me={me}
                    selected={selected}
                    slide={slide}
                    coach={coach}
                    onToggle={toggleKeys}
                  />
                ) : (
                  <ViewGrid
                    key={`v${weekIndex}`}
                    ref={gridRef}
                    week={week}
                    times={times}
                    locked={locked}
                    info={info}
                    max={max}
                    picks={picks}
                    tipKey={tipKey}
                    popKey={popKey}
                    slide={slide}
                    onCell={onCell}
                  />
                )}

                {legendBox}
              </>
            )}
            {/* 한 달이면 달력 아래, 여러 달이면 달력 위에 범례(시안 Final1·FinalMonths). */}
            {dateMode &&
              (months.length > 1 ? (
                <>
                  {dateLegend}
                  {dateCalendar}
                </>
              ) : (
                <>
                  {dateCalendar}
                  {dateLegend}
                </>
              ))}
            {!edit && <p className="tb-sr">{dateMode ? M.daySummaryOf(rankedDays, total) : M.summaryOf(blocks, total)}</p>}
          </section>

          <AdSense slot="7512892307" layout="in-article" format="fluid" isReady={isAdReady} />

          <div className="tb-bar" data-floor="">
            <div className="tb-bar-in">
              {edit ? (
                <>
                  <button
                    key="more"
                    className="tb-dock"
                    type="button"
                    aria-haspopup="dialog"
                    aria-label="더보기: 로그아웃, 참여 취소"
                    onClick={() => {
                      trackClarityEvent(CLARITY_EVENTS.B_MORE_OPEN);
                      setSheet({ type: "more" });
                    }}
                  >
                    <BIcon name="more" size={22} />
                    <span className="tb-lbl">더보기</span>
                  </button>
                  <button key="cancel" className="tb-dock" type="button" aria-label="취소" onClick={cancelEdit}>
                    <BIcon name="x" size={22} />
                    <span className="tb-lbl">취소</span>
                  </button>
                  <button
                    key="save"
                    className="tb-dock main wide"
                    type="button"
                    aria-label={`저장하기, ${dur}`}
                    disabled={saving}
                    onClick={saveEdit}
                  >
                    <BIcon name="check" size={22} />
                    <span className="tb-lbl">{`저장 · ${dur}`}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    key="share"
                    className="tb-dock"
                    type="button"
                    aria-label={canNativeShare() ? "초대 링크 공유하기" : "초대 링크 복사하기"}
                    onClick={() => share()}
                  >
                    <BIcon name="share" size={22} />
                    <span className="tb-lbl">공유</span>
                  </button>
                  <button
                    key="mine"
                    ref={mainDockRef}
                    className={`tb-dock main${joined ? "" : " nudge"}`}
                    type="button"
                    aria-label={
                      joined && mine
                        ? `내 ${unit} 고치기, 지금 ${dateMode ? M.dayCount(mineSet.size) : M.duration(mine)}`
                        : `내 ${unit} 넣기`
                    }
                    // 참여 전이면 참여 창을 연다. 서버에서 지워진 이름이 이 기기에 남아 있으면 이름·공유 상태를 먼저 지운다(startEdit).
                    onClick={() => startEdit(me, users)}
                  >
                    <BIcon name="pen" size={22} />
                    <span className="tb-lbl">{joined && mine ? `내 ${unit} 고치기` : `내 ${unit} 넣기`}</span>
                    {!joined && (
                      <span className="tb-nudge-tip" aria-hidden="true">
                        {dateMode ? "여기서 되는 날을 골라요" : "여기서 내 시간을 넣어요"}
                      </span>
                    )}
                  </button>
                  <button
                    key="chat"
                    className="tb-dock"
                    type="button"
                    aria-label={unread ? `대화 ${chats.length}개, 안 읽은 글 ${unread}개` : `대화 ${chats.length}개`}
                    onClick={openChat}
                  >
                    <BIcon name="chat" size={21} />
                    <span className="tb-lbl">대화</span>
                    {unread > 0 && <span className="tb-badge">{unread > 99 ? "99+" : String(unread)}</span>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {popKey && !edit && !dateMode && (
        <CellPopup cellKey={popKey} gridRef={gridRef} info={info} names={names} max={max} onClose={() => setPopKey(null)} />
      )}
      {popKey && !edit && dateMode && (
        <DatePopup
          cellKey={popKey}
          gridRef={gridRef}
          info={info}
          users={users}
          me={joined ? me : null}
          max={max}
          onClose={() => setPopKey(null)}
        />
      )}
      {renderSheet()}
      {/* 참여 안내에 이름이 들어가므로 화면 녹화에서 가린다(Codex 교차 검증 2026-10-01). */}
      <div
        ref={toastRef}
        className="tb-toast"
        role="status"
        aria-live="polite"
        data-clarity-mask="true"
        style={{ display: toast ? "block" : "none" }}
      >
        {toast?.text}
      </div>
    </BPage>
  );
}
