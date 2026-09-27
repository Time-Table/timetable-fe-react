import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import isPropValid from "@emotion/is-prop-valid";
import { keyframes } from "@emotion/react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { FaUser } from "react-icons/fa";
import {
  FiCalendar,
  FiShare,
  FiShare2,
  FiAward,
  FiChevronRight,
  FiChevronDown,
  FiAlertCircle,
  FiUsers,
  FiInfo,
  FiX,
  FiPlus,
  FiMinus,
  FiSearch,
  FiPhone,
  FiVideo,
  FiMenu,
  FiEye,
  FiLock,
  FiCheck,
  FiCopy,
  FiArrowRight,
  FiArrowDown,
} from "react-icons/fi";
import theme from "../../theme";
import Seo from "../../Seo";
import TimeGrid from "../../component/TimeGrid";
import { createTable } from "../../api/table";
import { trackVisit } from "../../api/visit";
import { trackEvent, EVENTS, trackClarityEvent, CLARITY_EVENTS } from "../../utils/analytics";
import {
  PRESETS,
  buildDefaultDates,
  buildDatesAfter,
  formatDayLabel,
  HOURS,
  DAYS_PER_WEEK,
  MIN_WEEKS,
  MAX_WEEKS,
} from "./presets";
import { buildTidyMockTimetable, buildMemberBlocks, MOCK_MEMBERS, MOCK_TABLE_ID } from "./mockPreview";

const DAY_FULL = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
/** 화면에 그리는 순서. 주는 월요일에 시작한다. */
const DAY_SHORT = ["월", "화", "수", "목", "금", "토", "일"];
/** getDay()(일=0)를 월요일 시작 열 번호(월=0)로 옮긴다. */
const colOf = (date) => (date.getDay() + 6) % 7;
const TOAST_MS = 3000;
/** 셀 팝업 크기. /table 의 GroupTimeGrid 와 같은 값이다. */
const POPUP_WIDTH = 260;
const POPUP_H_ESTIMATE = 250;
/** 팝업이 칸을 물고 들어가는 정도(px). 칸(약 49×30)이 통째로 가려지지 않을 만큼만. */
const POPUP_OVERLAP = 12;
/**
 * 미리보기 오른쪽 칸(순위·참여자)을 감추고 골든타임 명단을 먼저 열지 않는 폭.
 * 이 폭에서는 첫 칸 옆 "눌러서 명단 보기" 안내로 대신한다.
 */
const COMPACT_QUERY = `(max-width: ${parseInt(theme.breakpoint.xl, 10) - 1}px)`;
/**
 * 페이지가 한 줄(미리보기 위, 폼 아래)로 쌓이는 폭. 이 폭에서는 미리보기를 줄여
 * 입력창과 함께 첫 화면에 들어오게 한다. 1024px부터는 좌우로 갈라져 줄일 필요가 없다.
 */
const STACKED_QUERY = `(max-width: ${parseInt(theme.breakpoint.lg, 10) - 1}px)`;
/** 줄인 미리보기에 그리는 시간 행 수. 골든타임을 가운데 두고 자른다. */
const COMPACT_ROWS = 5;
/** 사이트 헤더(Header.jsx HeaderWrapper) 높이. 헤더가 위에 붙어 있어 고정 미리보기를 그 아래에 둔다. */
const HEADER_PX = 72;
const HEADER_HEIGHT = `${HEADER_PX}px`;
/** 한 줄로 쌓이는 화면에서 스크롤해 단톡방이 사라지면 제목 자리에 보여 줄 입력 유도 문구(2026-09-27 사람 선택). */
const TITLE_PROMPT = "모임 이름부터 바꿔 보세요";

const matchesQuery = (query) =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query).matches
    : false;

/** 첫 렌더부터 맞는 값이어야 한다. false로 시작하면 모바일에서 골든타임 팝업이 한 번 떴다 사라진다. */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => matchesQuery(query));
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

const FOCUSABLE =
  'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

/**
 * 모달 공통 키보드·초점 처리.
 * - 열리면 주 버튼(`initialRef`)으로 초점을 옮긴다. 초점이 뒤 페이지에 남아 있으면 Esc가 먹지 않았다.
 * - Esc는 초점 위치와 상관없이 `onEscape`를 부른다. Tab은 모달 안에서만 돈다.
 * - 뒤 페이지는 스크롤되지 않게 막고, 닫히면 `getReturnTarget(연 요소)`가 돌려준 요소로 초점을 돌려준다.
 */
function useModalFocus(open, modalRef, initialRef, onEscape, getReturnTarget) {
  const escapeRef = useRef(onEscape);
  const returnRef = useRef(getReturnTarget);
  escapeRef.current = onEscape;
  returnRef.current = getReturnTarget;

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => (initialRef.current || modalRef.current)?.focus());

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        escapeRef.current?.();
        return;
      }
      const modal = modalRef.current;
      if (e.key !== "Tab" || !modal) return;
      const items = [...modal.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!modal.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      const target = returnRef.current ? returnRef.current(opener) : opener;
      if (target && target.isConnected) target.focus();
    };
    // 열림 여부만 본다. ref와 콜백은 ref로 최신 값을 읽는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

/**
 * 링크 복사. Clipboard API가 없거나(보안 연결이 아닌 주소) 거절되면 예전 방식으로 한 번 더 시도한다.
 * 둘 다 실패하면 false — 호출한 쪽이 "복사됨"이라고 말하면 안 된다.
 */
async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 아래 방법으로 한 번 더
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    area.remove();
    return ok === true;
  } catch {
    return false;
  }
}

/** "9월 28일(월)" */
const formatDayShort = (date) =>
  `${date.getMonth() + 1}월 ${date.getDate()}일(${formatDayLabel(date)})`;

/**
 * 자주 묻는 질문. 답은 실제 동작 기준이다.
 * - 가입·설치 없음, 이름(닉네임)+비밀번호 참여, 다시 로그인해 수정·삭제, 링크 가진 사람은 명단을 봄:
 *   /table 화면 안내 문구(TimetablePage)와 이용 가이드(GuidePage)
 * - 골든타임 1~3위: /table 순위 탭 안내 문구
 * - 시간 잠금: 이 페이지의 확인 창
 * - 후보 날짜 기본값(내일부터 7일)·1~8주 조절·날짜 켜고 끄기: presets.js·이 페이지 달력
 * - 공유 창·복사: 이 페이지 완료 창(휴대폰은 공유 창, 컴퓨터는 복사가 주 버튼)
 * 동작이 바뀌면 여기도 같이 고친다.
 * 질문 문구는 이 페이지가 맡은 검색어(약속 시간 정하기·언제 만날까, specs/seo-strategy.md)를 자연스럽게 담는다.
 */
const FAQ_ITEMS = [
  {
    q: "무료인가요? 회원가입이 필요한가요?",
    a: "무료이고, 만드는 사람도 참여하는 사람도 회원가입이나 앱 설치가 필요 없습니다. 모임 이름과 후보 날짜, 시간 범위를 정하고 '이대로 만들기'를 누르면 공유할 링크가 만들어집니다.",
  },
  {
    q: "언제 만날지 아직 못 정했을 때도 쓸 수 있나요?",
    a: "네. '언제 만날까'부터 정해야 할 때 쓰는 도구입니다. 후보 날짜를 여러 날 고르면 됩니다. 기본은 내일부터 7일이고, 1주에서 8주까지 늘리거나 줄이며 날짜를 하나씩 켜고 끌 수 있습니다. 참여자가 각자 가능한 시간을 표시하면 가장 많이 겹치는 시간을 골든타임으로 추천합니다.",
  },
  {
    q: "참여자는 가능한 시간을 어떻게 입력하나요?",
    a: "받은 링크를 열고 이름(닉네임)과 비밀번호를 입력한 뒤, 가능한 시간을 선택하고 저장하면 됩니다. 이메일이나 전화번호는 받지 않습니다. 같은 이름과 비밀번호로 다시 들어오면 입력한 시간을 고치거나 지울 수 있고, 링크를 가진 사람은 참여자의 이름과 가능한 시간을 볼 수 있습니다.",
  },
  {
    q: "카카오톡 단톡방으로 링크를 보낼 수 있나요?",
    a: "네. 링크를 만들면 휴대폰에서는 '링크 공유하기'로 카카오톡·문자 같은 공유 창을 바로 열 수 있고, 컴퓨터에서는 링크를 복사해 단톡방에 붙여 넣으면 됩니다. 링크를 받은 사람은 앱 설치 없이 브라우저에서 바로 참여합니다.",
  },
  {
    q: "모두가 되는 시간은 어떻게 찾나요?",
    a: "저장된 응답을 모아 가능한 인원이 가장 많은 시간대를 골든타임으로 자동 추천하고, 1~3위를 순위로 보여줍니다. 시간표에서는 가능한 사람이 많은 칸일수록 진하게 표시됩니다.",
  },
  {
    q: "단톡방에서 시간을 묻는 것과 무엇이 다른가요?",
    a: (
      <>
        단톡방에서 &ldquo;언제 시간 돼?&rdquo;를 주고받으면 답이 올 때마다 조건이 바뀌고, 인원이
        늘수록 모두가 되는 시간을 찾기 어려워집니다. 링크를 공유하면 각자 자기 시간만 표시하면
        되므로 취합하는 사람이 병목이 되지 않습니다. 약속 조율 방법별 비교는{" "}
        <Link to="/appointment-scheduling-guide">약속 조율 완전 가이드</Link>에 정리해 두었습니다.
      </>
    ),
  },
  {
    q: "특정 시간대는 빼고 받을 수 있나요?",
    a: "'이대로 만들기'를 누르면 나오는 확인 창에서 '시간 잠금(선택)'을 펼쳐 뺄 시간대를 잠그면, 참여자는 그 시간을 고를 수 없습니다.",
  },
];

/**
 * 정본 랜딩(`/`). 랜딩 자체가 생성 폼이다.
 *
 * 2026-09-27 시안(`/landing-v3`)을 사람 결정으로 `/`에 올렸다. 이전 랜딩과 달라진 큰 줄기:
 * - 첫 화면에 입력창과 줄인 미리보기가 함께 보이도록 배치(휴대폰은 하단 고정 만들기 버튼)
 * - 제목 위 카카오톡 단톡방 그림, h1 "단체 약속 잡기, 이 링크 하나면 끝"
 * - 단색 위주의 시각 정리(만들기 버튼만 강조색), 골든타임 칸에만 반짝임
 * - 만들기 전 확인 창(요약 + 시간 잠금 선택), 휴대폰 공유 창 중심의 완료 창
 * - 넓은 화면: 왼쪽 제목·폼 / 오른쪽 단톡방·미리보기·버튼, 1536px부터 양옆 광고 자리
 * - 휴대폰: 스크롤하면 단톡방·헤더가 밀려 올라가고 제목 자리에 입력 유도 문구
 * - 하단 설명 본문은 접이식 자주 묻는 질문
 * 검색 제목·설명은 이전 랜딩과 같다.
 */
export default function StartPage() {
  const navigate = useNavigate();
  const hasTracked = useRef(false);

  const reduceMotion = useReducedMotion();

  const [title, setTitle] = useState(PRESETS[0].title);
  const [dates, setDates] = useState(buildDefaultDates);
  const [startHour, setStartHour] = useState(PRESETS[0].startHour);
  const [endHour, setEndHour] = useState(PRESETS[0].endHour);
  const [isLoading, setIsLoading] = useState(false);
  // 키워드를 누르면 세 필드가 한꺼번에 바뀐다. 화면을 못 보는 사람에게는 그 사실을 알려야 한다.
  const [presetAnnounce, setPresetAnnounce] = useState("");

  // 미리보기 상호작용. null = 전체 보기.
  const [previewName, setPreviewName] = useState(null);
  const [isRankingOpen, setRankingOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  // 미리보기에서 열어 둔 칸. `${dayKey}|${hour}` 또는 null.
  // 골든타임 칸을 기본으로 열어 두어 "칸을 누르면 명단이 나온다"를 먼저 보여준다.
  const [openCell, setOpenCell] = useState(null);
  // 골든타임 첫 칸의 "눌러서 명단 보기" 안내. 칸을 한 번 누르거나 명단을 닫으면 다시 띄우지 않는다.
  const [isTapHintDismissed, setTapHintDismissed] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, visible: false });
  const popupRef = useRef(null);
  const [isLockOpen, setLockOpen] = useState(false);
  const [isLockExpanded, setLockExpanded] = useState(false);
  const [banedCells, setBanedCells] = useState([]);
  const lockRef = useRef(null);
  const lockPrimaryRef = useRef(null);
  const lockOpenerRef = useRef(null);
  // 만든 뒤 완료 창. { tableId, url, title } 또는 null.
  const [created, setCreated] = useState(null);
  const createdRef = useRef(null);
  createdRef.current = created;
  // "idle" | "copied" | "failed"
  const [copyState, setCopyState] = useState("idle");
  const doneRef = useRef(null);
  const donePrimaryRef = useRef(null);
  const linkInputRef = useRef(null);

  // 후보 날짜 드래그. quick-create 의 Calendar 와 같은 방식이다.
  const [dragAction, setDragAction] = useState(null);
  const [isToastOpen, setToastOpen] = useState(false);
  const toastTimer = useRef(null);
  // 마우스와 포커스를 따로 센다. 하나로 합치면 "포커스는 남았는데 포인터만 나간"
  // 경우에 타이머가 되살아나 읽는 중에 토스트가 닫힌다.
  const toastHovered = useRef(false);
  const toastFocused = useRef(false);
  const isMounted = useRef(true);

  const isCompact = useMediaQuery(COMPACT_QUERY);
  const isStacked = useMediaQuery(STACKED_QUERY);
  const isTouchDevice = useMediaQuery("(pointer: coarse)");

  /**
   * 한 줄로 쌓이는 화면(휴대폰·태블릿 세로)의 스크롤 연출.
   * 단톡방이 헤더 밑으로 올라가는 만큼(0→1) 작아지며 옅어지고, 거의 사라지면 제목 자리에
   * 입력 유도 문구가 올라온다. 시간이 아니라 스크롤 위치에 묶어 있어 되돌리면 그대로 되돌아온다.
   * 모양(transform·opacity)만 바꾸므로 아래 내용이 당겨 올라오지 않는다(스크롤 튐·CLS 없음).
   * 원래 제목(h1)은 문서에 그대로 남고 보이지만 않는다. 검색엔진·스크린리더는 원래 제목을 읽는다.
   * 사용자가 제목을 한 번 고쳤으면(직접 입력·빠른 제목) 문구를 띄우지 않는다.
   */
  const roomRef = useRef(null);
  const [isTitleTouched, setTitleTouched] = useState(false);
  const { scrollYProgress: roomOut } = useScroll({
    target: roomRef,
    offset: [`start ${HEADER_HEIGHT}`, `end ${HEADER_HEIGHT}`],
  });
  const roomScale = useTransform(roomOut, [0, 1], [1, 0.9]);
  // 헤더가 접히는 지점(0.7)보다 먼저 다 사라져야 헤더가 빠진 자리로 옅은 방이 비쳐 보이지 않는다.
  const roomOpacity = useTransform(roomOut, [0.05, 0.65], [1, 0]);
  // 스크롤을 어디서 멈춰도 문구가 흐릿하게 걸려 있지 않도록 방이 다 사라지기 전에 바꿈을 끝낸다.
  // 원래 제목이 다 사라진 뒤에 문구가 올라온다. 둘이 겹치면 두 문장이 반씩 포개져 지저분했다.
  const titleOpacity = useTransform(roomOut, [0.4, 0.6], [1, 0]);
  const titleY = useTransform(roomOut, [0.4, 0.6], [0, -8]);
  const promptOpacity = useTransform(roomOut, [0.6, 0.8], [0, 1]);
  const promptY = useTransform(roomOut, [0.6, 0.8], [8, 0]);
  const [isPromptShown, setPromptShown] = useState(false);
  // 휴대폰에서 제목을 입력하는 동안에는 하단 고정 막대를 내린다. 키보드 바로 위에 붙어 입력칸 주변을 가렸다.
  const [isTitleFocused, setTitleFocused] = useState(false);
  useMotionValueEvent(roomOut, "change", (v) => {
    const shown = v > 0.7;
    setPromptShown((prev) => (prev === shown ? prev : shown));
  });
  const showsPrompt = isStacked && !isTitleTouched;
  const promptActive = showsPrompt && isPromptShown;

  /**
   * 사이트 헤더도 단톡방과 같은 속도로 밀려 올라가며 옅어진다(2026-09-27 사람 지시: 시간으로 접히면 경박하다).
   * 단톡방 아래 끝이 헤더 두 칸 높이(144px)에서 헤더 아래 끝(72px)까지 올라가는 72px 동안
   * 헤더도 72px 올라간다. 스크롤 1px에 1px이라 방과 헤더 사이 간격이 그대로 유지된 채 함께 사라지고,
   * 되돌리면 그대로 내려온다. 끝까지 올라가면 visibility로 키보드·스크린리더에서도 뺀다.
   * 헤더는 모든 페이지가 같이 쓰므로 여기서 그 요소([data-site-header])의 인라인 스타일만 바꾸고,
   * 넓은 화면·확인/완료 창이 떠 있을 때·이 페이지를 떠날 때는 되돌린다.
   */
  const { scrollYProgress: headerOut } = useScroll({
    target: roomRef,
    offset: [`end ${HEADER_PX * 2}px`, `end ${HEADER_PX}px`],
  });
  const pushesHeader = isStacked && !isLockOpen && !created;
  const placeHeader = useCallback(
    (progress) => {
      const header = document.querySelector("[data-site-header]");
      if (!header) return;
      const p = pushesHeader ? Math.min(Math.max(progress, 0), 1) : 0;
      header.style.transform = p > 0 ? `translateY(${-p * 100}%)` : "";
      header.style.opacity = p > 0 ? String(1 - p) : "";
      header.style.visibility = p >= 1 ? "hidden" : "";
    },
    [pushesHeader]
  );
  useMotionValueEvent(headerOut, "change", placeHeader);
  useEffect(() => {
    placeHeader(headerOut.get());
    return () => placeHeader(0);
  }, [placeHeader, headerOut]);

  /** 문구를 누르면 입력칸으로 간다. 기본 제목이 들어 있으므로 전부 골라 두어 바로 새로 쓰게 한다. */
  const focusTitle = () => {
    const input = document.getElementById("start-title");
    if (!input) return;
    input.focus();
    input.select();
  };

  // 빠른 제목 칩 줄이 옆으로 넘치면 가려진 쪽 끝을 흐리게 해 밀 수 있다는 것을 보여준다.
  const quickRef = useRef(null);
  const [quickFade, setQuickFade] = useState({ start: false, end: false });
  const updateQuickFade = useCallback(() => {
    const el = quickRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = { start: el.scrollLeft > 1, end: max - el.scrollLeft > 1 };
    setQuickFade((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);
  useEffect(() => {
    updateQuickFade();
    // 글꼴이 늦게 들어오면 칩 폭이 바뀐다.
    document.fonts?.ready?.then(() => isMounted.current && updateQuickFade());
    window.addEventListener("resize", updateQuickFade);
    return () => window.removeEventListener("resize", updateQuickFade);
  }, [updateQuickFade]);

  // 폼 끝의 만들기 버튼이 아직 화면 아래에 있으면 같은 버튼을 화면 하단에 띄워 둔다.
  const inlineCtaRef = useRef(null);
  const [isInlineCtaBelow, setInlineCtaBelow] = useState(true);
  useEffect(() => {
    const el = inlineCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setInlineCtaBelow(!entry.isIntersecting && entry.boundingClientRect.top > 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    trackVisit("landing");
    trackEvent(EVENTS.LANDING_VIEW);
    // 랜딩 자체가 생성 폼이다. 실제 클릭은 openLock에서만 기록한다.
    trackEvent(EVENTS.CREATE_VIEW, undefined, "landing");
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearTimeout(toastTimer.current);
    };
  }, []);

  const selectedDays = useMemo(() => dates.filter((d) => d.selected), [dates]);
  const selectedDates = useMemo(() => selectedDays.map((d) => d.key), [selectedDays]);

  // 미리보기에 채울 가짜 참여 현황. 실제 /table 화면과 같은 히트맵을 그리기 위한 것이다.
  const mock = useMemo(
    () => buildTidyMockTimetable(selectedDays, startHour, endHour),
    [selectedDays, startHour, endHour]
  );

  // 참여자를 고르면 그 사람이 가능한 구간만 남는다. 요약 문장과 범례가 함께 바뀐다.
  const memberBlocks = useMemo(
    () => buildMemberBlocks(mock, selectedDays, previewName),
    [mock, selectedDays, previewName]
  );

  const previewTitle = title.trim() || "제목 없음";
  const previewOrigin =
    process.env.REACT_APP_DOMAIN_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const dateRangeLabel =
    selectedDays.length > 0
      ? `${selectedDays[0].date.getMonth() + 1}.${selectedDays[0].date.getDate()} - ${
          selectedDays[selectedDays.length - 1].date.getMonth() + 1
        }.${selectedDays[selectedDays.length - 1].date.getDate()}`
      : null;

  /**
   * 미리보기 아래에 항상 보이는 요약. 격자는 장식으로 감춰 두므로
   * 격자가 말하는 내용이 여기 글로 남아 있어야 한다.
   */
  const previewSummary = useMemo(() => {
    if (!mock) return "후보 날짜를 하나 이상 선택하면 미리보기가 나타납니다.";
    if (previewName) {
      if (memberBlocks.length === 0) return `예시 데이터입니다. ${previewName} 님은 가능한 시간이 없습니다.`;
      const shown = memberBlocks.slice(0, 3).map((b) => b.label).join(", ");
      const rest = memberBlocks.length > 3 ? ` 외 ${memberBlocks.length - 3}개` : "";
      return `예시 데이터입니다. ${previewName} 님이 가능한 시간은 ${shown}${rest}입니다.`;
    }
    if (!mock.golden) return "예시 데이터입니다. 겹치는 시간이 없습니다.";
    return `예시 데이터입니다. 참여자 ${mock.total}명 중 최대 ${mock.maxCount}명이 겹칩니다. 가장 많이 겹치는 시간은 ${mock.golden.label}입니다.`;
  }, [mock, previewName, memberBlocks]);

  /**
   * 키워드는 "선택"이 아니라 "동작"이다. 누른 뒤 사용자가 제목을 고치면
   * 선택 표시가 거짓말이 되므로 지속 선택 상태를 두지 않는다.
   * 날짜는 건드리지 않는다 — 언제 모일지는 키워드가 알 수 없는 것이다.
   */
  const applyPreset = (key) => {
    const found = PRESETS.find((p) => p.key === key);
    if (!found) return;
    setTitleTouched(true);
    setTitle(found.title);
    setStartHour(found.startHour);
    setEndHour(found.endHour);
    setPreviewName(null);
    setPresetAnnounce(
      `'${found.title}'로 채웠습니다. 시간 ${found.startHour}–${found.endHour}. 날짜는 그대로입니다.`
    );
  };

  const toggleDate = (key) =>
    setDates((prev) => prev.map((d) => (d.key === key ? { ...d, selected: !d.selected } : d)));

  /** 드래그로 지나간 날짜에 같은 동작(켜기/끄기)을 적용한다. 이미 그 상태면 건드리지 않는다. */
  const applyDrag = useCallback((key, action) => {
    if (!key || !action) return;
    setDates((prev) =>
      prev.map((d) => (d.key === key ? { ...d, selected: action === "select" } : d))
    );
  }, []);

  const startDrag = (key, selected) => (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // 캡처를 놓아야 elementFromPoint 로 다른 셀을 집을 수 있다.
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const action = selected ? "deselect" : "select";
    setDragAction(action);
    applyDrag(key, action);
  };

  useEffect(() => {
    if (!dragAction) return;
    const onMove = (e) => {
      const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-date]");
      if (cell) applyDrag(cell.dataset.date, dragAction);
    };
    const onUp = () => setDragAction(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragAction, applyDrag]);

  const weekCount = Math.ceil(dates.length / DAYS_PER_WEEK);

  /**
   * 미리보기 격자를 달력 주(일~토) 단위로 자른다. 실제 /table 화면도 한 주씩 보여준다.
   * 후보가 8주까지 늘어날 수 있어 전부 한 줄에 늘어놓으면 읽을 수 없다.
   * 빈 자리는 `null` — 후보에 없는 날이라 비활성으로 그린다.
   */
  const previewWeeks = useMemo(() => {
    if (!dates.length) return [];
    const out = [];
    let week = new Array(colOf(dates[0].date)).fill(null);
    dates.forEach((d) => {
      week.push(d);
      if (colOf(d.date) === 6) {
        out.push(week);
        week = [];
      }
    });
    if (week.length) out.push([...week, ...new Array(DAYS_PER_WEEK - week.length).fill(null)]);
    return out;
  }, [dates]);

  const shownWeek = previewWeeks[Math.min(previewIndex, previewWeeks.length - 1)] || [];

  /** 골든타임 칸의 키. 미리보기를 열면 여기가 기본으로 펼쳐져 있다. */
  const goldenKey = mock?.golden ? `${mock.golden.day.key}|${mock.golden.from}` : null;

  // 날짜·시간을 바꾸면 골든타임이 옮겨간다. 열려 있던 칸을 새 골든타임으로 다시 맞춘다.
  // 줄인 미리보기는 첫 화면에서 입력창 바로 위에 있어, 팝업을 먼저 띄우면 입력창을 가린다.
  useEffect(() => {
    setOpenCell(isCompact ? null : goldenKey);
  }, [goldenKey, isCompact]);

  /**
   * 첫 주에 후보가 하루뿐이면(예: 토요일에 열면 내일인 일요일 한 칸) 격자가 비어 보인다.
   * 골든타임이 있는 주를 먼저 보여준다. 사용자가 주를 넘긴 뒤에는 골든타임이 옮겨갈 때만 다시 맞춘다.
   */
  const goldenWeekIndex = mock?.golden
    ? previewWeeks.findIndex((week) => week.some((d) => d && d.key === mock.golden.day.key))
    : -1;
  useEffect(() => {
    if (goldenWeekIndex >= 0) setPreviewIndex(goldenWeekIndex);
  }, [goldenWeekIndex]);

  /** 한 줄로 쌓이는 화면의 줄인 미리보기에서는 골든타임을 가운데 둔 몇 줄만 그린다. */
  const shownHours = useMemo(() => {
    if (!mock) return [];
    const all = mock.hours;
    if (!isStacked || all.length <= COMPACT_ROWS) return all;
    const center = mock.golden
      ? all.indexOf(mock.golden.from) + Math.floor((mock.golden.to - mock.golden.from - 1) / 2)
      : Math.floor(all.length / 2);
    const start = Math.max(0, Math.min(center - 2, all.length - COMPACT_ROWS));
    return all.slice(start, start + COMPACT_ROWS);
  }, [mock, isStacked]);

  /**
   * 팝업을 열린 칸 옆에 붙인다. /table 의 GroupTimeGrid 와 같은 계산이다.
   * 다른 점 하나: 여기서는 골든타임 칸이 기본으로 열려 있어 사용자가 스크롤해서 내려온다.
   * 그래서 스크롤·리사이즈마다 다시 계산해 칸을 계속 따라다니게 한다.
   */
  const placePopup = useCallback(() => {
    if (!openCell) return;
    const cell = document.querySelector(`[data-cell="${CSS.escape(openCell)}"]`);
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    /**
     * 칸이 화면 밖이면 팝업을 띄우지 않는다.
     * 골든타임 칸이 기본으로 열려 있는데 미리보기는 스크롤해야 나온다.
     * 이때 아래 clamp 가 팝업을 화면 안으로 끌어와, 칸과 상관없는 자리(모바일에서는
     * 페이지 최상단 폼 위)에 명단이 떠 있었다.
     */
    const onScreen = rect.bottom > 0 && rect.top < winH && rect.right > 0 && rect.left < winW;
    if (!onScreen) {
      setPopupPos((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const width = popupRef.current?.getBoundingClientRect().width || POPUP_WIDTH;
    const height = popupRef.current?.getBoundingClientRect().height || POPUP_H_ESTIMATE;

    // 팝업 모서리가 칸 모서리를 살짝 물게 둔다. 어느 칸을 연 것인지 붙어서 보이되,
    // 칸이 통째로 덮이지는 않는다(가로 세로 각 OVERLAP 만큼만 겹친다).
    let left = rect.right - POPUP_OVERLAP;
    if (left + width > winW - 8) left = rect.left - width + POPUP_OVERLAP;
    left = Math.max(8, Math.min(left, winW - width - 8));

    let top = rect.bottom - POPUP_OVERLAP;
    if (top + height > winH - 8) top = rect.top - height + POPUP_OVERLAP;
    top = Math.max(8, Math.min(top, winH - height - 8));

    setPopupPos((prev) =>
      prev.top === top && prev.left === left && prev.visible ? prev : { top, left, visible: true }
    );
  }, [openCell]);

  useEffect(() => {
    if (!openCell) return;
    placePopup();
    window.addEventListener("scroll", placePopup, true);
    window.addEventListener("resize", placePopup);
    return () => {
      window.removeEventListener("scroll", placePopup, true);
      window.removeEventListener("resize", placePopup);
    };
  }, [openCell, placePopup]);

  const openCellInfo = useMemo(() => {
    if (!mock || !openCell) return null;
    const [dayKey, hourStr] = openCell.split("|");
    const day = selectedDays.find((d) => d.key === dayKey);
    if (!day) return null;
    const hour = Number(hourStr);
    const can = mock.cells[openCell] || [];
    return {
      day,
      hour,
      can,
      cannot: MOCK_MEMBERS.filter((m) => !can.includes(m)),
      isGolden: can.length > 0 && can.length === mock.maxCount,
    };
  }, [mock, openCell, selectedDays]);

  const addWeek = () =>
    setDates((prev) =>
      prev.length >= MAX_WEEKS * DAYS_PER_WEEK
        ? prev
        : [...prev, ...buildDatesAfter(prev[prev.length - 1].date, DAYS_PER_WEEK)]
    );

  // 줄일 때 선택 상태는 남은 날짜 그대로 둔다. 다시 늘리면 새 날짜만 전부 선택으로 들어온다.
  const removeWeek = () =>
    setDates((prev) =>
      prev.length <= MIN_WEEKS * DAYS_PER_WEEK
        ? prev
        : prev.slice(0, prev.length - DAYS_PER_WEEK)
    );

  // 순위는 그룹 이야기, 격자는 개인 이야기다. 서로 닫지 않고 함께 볼 수 있게 둔다.
  const selectPreviewName = (name) => setPreviewName(name);

  const armToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOpen(false), TOAST_MS);
  }, []);

  const openInviteToast = useCallback(() => {
    setToastOpen(true);
    armToast();
  }, [armToast]);

  // 마우스를 올리거나 포커스가 들어오면 읽을 시간을 준다 (WCAG 2.2.1).
  // 둘 다 빠져나갔을 때만 다시 시간을 잰다.
  const holdToast = (kind) => () => {
    if (kind === "hover") toastHovered.current = true;
    else toastFocused.current = true;
    clearTimeout(toastTimer.current);
  };
  const releaseToast = (kind) => () => {
    if (kind === "hover") toastHovered.current = false;
    else toastFocused.current = false;
    if (!toastHovered.current && !toastFocused.current) armToast();
  };
  const closeToast = () => {
    clearTimeout(toastTimer.current);
    toastHovered.current = false;
    toastFocused.current = false;
    setToastOpen(false);
  };

  // 미리보기에서 빠져나오는 탈출구. 안쪽에 열린 것부터 순서대로 닫는다.
  const handlePreviewKeyDown = (e) => {
    if (e.key !== "Escape") return;
    if (isToastOpen) closeToast();
    else if (openCell) setOpenCell(null);
    else if (previewName) setPreviewName(null);
    else if (isRankingOpen) setRankingOpen(false);
  };

  const isValid = title.trim().length > 0 && selectedDates.length > 0 && startHour < endHour;

  // 버튼이 왜 비활성인지 글로 알린다. opacity만으로는 이유가 전달되지 않는다.
  // 문제가 없을 때는 아무 글도 두지 않는다(사람 지시로 "회원가입 없이 · 링크 공유 · 무료" 삭제).
  const ctaHint = !title.trim()
    ? "모임 이름을 입력해 주세요."
    : selectedDates.length === 0
      ? "후보 날짜를 하루 이상 선택해 주세요."
      : startHour >= endHour
        ? "종료 시간이 시작 시간보다 늦어야 합니다."
        : isLoading
          ? "링크를 만드는 중입니다."
          : "";

  /** 버튼을 눌러도 바로 만들지 않는다. 시간 잠금을 한 번 물어본 뒤 만든다. */
  const openLock = () => {
    if (!isValid || isLoading) return;
    // 창을 연 버튼. 하단 고정 막대의 버튼은 창이 뜨는 순간 내려가므로 렌더 전에 잡아 둔다.
    lockOpenerRef.current = document.activeElement;
    trackEvent(EVENTS.CREATE_CTA_CLICK, undefined, "landing");
    setBanedCells((prev) => prev.filter((c) => selectedDates.includes(c.slice(0, c.lastIndexOf("-")))));
    setLockOpen(true);
  };

  const closeLock = () => {
    setLockOpen(false);
    setLockExpanded(false);
  };

  // 만드는 중에는 닫지 않는다. 응답이 오면 이 창이 완료 창으로 바뀐다.
  useModalFocus(
    isLockOpen,
    lockRef,
    lockPrimaryRef,
    () => !isLoading && closeLock(),
    () => {
      // 완료 창으로 넘어가는 중이면 초점은 완료 창이 가져간다.
      if (createdRef.current) return null;
      const opener = lockOpenerRef.current;
      if (opener && opener !== document.body && opener.isConnected) return opener;
      // 하단 고정 막대의 버튼은 잠금 창이 떠 있는 동안 내려갔다 다시 그려진다.
      // 지금 화면 안에 보이는 만들기 버튼으로 간다(화면 밖 버튼에 초점을 주면 페이지가 그쪽으로 튄다).
      const shown = [...document.querySelectorAll("[data-create-cta]")].filter(
        (el) => el.getClientRects().length
      );
      return (
        shown.find((el) => {
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= window.innerHeight;
        }) || shown[0]
      );
    }
  );

  /** 잠금 창 요약에 쓰는 후보 날짜 한 줄. "9월 28일(월) ~ 10월 4일(일) · 7일" */
  const dateSummary =
    selectedDays.length === 0
      ? ""
      : selectedDays.length === 1
        ? formatDayShort(selectedDays[0].date)
        : `${formatDayShort(selectedDays[0].date)} ~ ${formatDayShort(
            selectedDays[selectedDays.length - 1].date
          )} · ${selectedDays.length}일`;

  const goToTable = () => {
    if (!createdRef.current) return;
    navigate(`/table/${createdRef.current.tableId}`);
  };

  // 완료 창은 닫는 것이 곧 테이블로 가는 것이다(예전 성공 알림도 닫으면 테이블로 갔다).
  useModalFocus(Boolean(created), doneRef, donePrimaryRef, goToTable, () => null);

  /**
   * 공유·복사 계측은 버튼을 누른 시점에 한 번 남긴다(명세 specs/api-contract.md: invite_share = 시도).
   * 서버에는 둘 다 invite_share로 가고, 공유 창인지 복사인지는 Clarity 보조 이벤트로만 나눈다.
   * 테이블 화면의 복사 버튼도 누를 때 기록하므로 같은 기준이다.
   */
  const recordShareAttempt = (tableId, clarityName) => {
    trackEvent(EVENTS.INVITE_SHARE, tableId);
    trackClarityEvent(clarityName);
  };

  /** track: false는 공유 창이 실패해 자동으로 복사로 넘어갈 때다. 이미 공유 시도로 셌으므로 다시 세지 않는다. */
  const copyLink = async (e, { track = true } = {}) => {
    const done = createdRef.current;
    if (!done) return;
    const button = e?.currentTarget;
    if (track) recordShareAttempt(done.tableId, CLARITY_EVENTS.INVITE_SHARE_COPY);
    const ok = await copyText(done.url);
    if (!isMounted.current) return;
    if (ok) {
      setCopyState("copied");
      button?.focus();
    } else {
      // "복사됨"이라고 하지 않는다. 주소를 골라 두어 사용자가 직접 복사하게 한다.
      setCopyState("failed");
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    }
  };

  /** 휴대폰 공유 창(카카오톡·문자 등). 사용자가 창을 닫으면(AbortError) 아무것도 하지 않는다. */
  const shareLink = (e) => {
    const done = createdRef.current;
    if (!done) return;
    recordShareAttempt(done.tableId, CLARITY_EVENTS.INVITE_SHARE_NATIVE);
    navigator
      .share({ title: done.title, text: `${done.title} — 가능한 시간을 표시해 주세요.`, url: done.url })
      .catch((err) => {
        if (err?.name === "AbortError" || !isMounted.current) return;
        copyLink(e, { track: false });
      });
  };

  // 공유 창은 휴대폰·태블릿(손가락 입력)에서만 주 버튼으로 쓴다. PC(맥 크롬·사파리)에도 공유 창이 있지만
  // 카카오톡 PC에 붙여 넣는 것이 흔해서 PC는 링크 복사가 주 버튼이다.
  const canShare =
    Boolean(created) &&
    isTouchDevice &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    (typeof navigator.canShare !== "function" || navigator.canShare({ url: created.url }));

  const handleCreate = async () => {
    if (!isValid || isLoading) return;
    trackEvent(EVENTS.CREATE_SUBMIT, undefined, "landing");
    setIsLoading(true);
    const res = await createTable(title.trim(), selectedDates, startHour, endHour, banedCells);
    // 화면을 떠났더라도 성공 응답은 기록한다. 화면 갱신은 아래에서 중단한다.
    const tableId = res?.data?.tableId;
    if (res?.success && tableId) {
      trackEvent(EVENTS.CREATE_SUCCESS, tableId, "landing");
    }
    // 응답을 기다리는 사이에 사용자가 페이지를 떠났으면 여기서 끝낸다.
    // 아니면 다른 화면 위에 성공 모달이 뜨고, 확인을 누르면 엉뚱한 곳으로 이동한다.
    if (!isMounted.current) return;
    setIsLoading(false);
    closeLock();

    if (res?.isRateLimit) return;
    if (!res?.success || !tableId) {
      Swal.fire("생성 실패", res?.message || "테이블 생성 중 오류가 발생했습니다.", "error");
      return;
    }

    const url = `${window.location.origin}/table/${tableId}`;
    try {
      localStorage.setItem("title", title.trim());
    } catch {
      // 저장소를 못 써도 완료 창은 떠야 한다.
    }

    // 예전에는 기본 알림창에 주소 글자와 '링크 복사'뿐이었다. 휴대폰 공유 창을 주 버튼으로 둔 완료 창으로 바꾼다.
    setCopyState("idle");
    setCreated({ tableId, url, title: title.trim() });
  };

  /**
   * 만들기 버튼. 넓은 화면은 미리보기 아래, 좁은 화면은 폼 끝과 화면 하단 고정 막대에 둔다.
   * 화면마다 하나만 보이므로 안내 문구 id는 자리마다 따로 둔다.
   */
  const renderCta = (hintId, { announce = true } = {}) => (
    <>
      <CreateButton
        type="button"
        onClick={openLock}
        disabled={!isValid || isLoading}
        aria-describedby={hintId}
        data-create-cta
      >
        {isLoading ? "만드는 중…" : "이대로 만들기"}
      </CreateButton>
      {/* 못 누르는 이유를 색이 아니라 글로 말한다. */}
      <Hint id={hintId} role={announce ? "status" : undefined} style={{ textAlign: "center" }}>
        {ctaHint}
      </Hint>
    </>
  );

  return (
    <>
      <Seo
        title="타임테이블 | 10초 만에 시간 조율표 만들고 공유하자! - 약속 시간 정하기"
        description="번거로운 시간 조율은 링크 하나로 끝내세요. 참여자가 가능한 시간만 표시하면 가장 많이 모일 수 있는 시간 약속을 추천해 드려요."
      />

      <PageWrapper>
        {/* 넓은 화면 양옆은 AdSense 자동 광고(사이드 레일) 자리다. 이 칸 위로는 광고가 겹치지 않게 한다. */}
        <StartShell google-side-rail-overlap="false">
          {/* 카카오톡 단체 톡방 화면 윗부분을 줄여 옮긴 그림. 방 모양은 사람이 준 실제 아이폰 카카오톡 캡처를 따른다.
              그림이라 스크린리더는 건너뛰고(aria-hidden) 뜻은 제목이 말한다. 제목(h1) 밖에 두어
              방 이름·보낸 사람 같은 그림 속 글자가 제목에 섞이지 않게 한다. 링크 글자는 CSS로 그린다.
              좁은 화면은 방 → 제목 → 미리보기 → 폼 순으로 쌓고, 넓은 화면은 방을 오른쪽 미리보기 위에 둔다
              (링크 말풍선 바로 아래에 그 링크로 만들어질 화면이 온다). */}
          {/* data-nosnippet: 그림 속 가짜 글자(방 이름·"언제 시간 돼?")가 검색결과 요약으로 뽑히지 않게 한다. 색인에는 영향이 없다. */}
          <ChatRoom
            ref={roomRef}
            aria-hidden="true"
            data-nosnippet
            style={
              isStacked && !reduceMotion
                ? { scale: roomScale, opacity: roomOpacity, originY: 0 }
                : isStacked
                  ? { opacity: roomOpacity }
                  : { scale: 1, opacity: 1 }
            }
          >
            <RoomHeader>
              <RoomAvatars>
                <RoomAvatar $kind="default">
                  <FaUser />
                </RoomAvatar>
                <RoomAvatar $kind="dark" />
                <RoomAvatar $kind="warm" />
                <RoomAvatar $kind="gold" />
              </RoomAvatars>
              <RoomInfo>
                {/* "ㅇㅇ 단체 톡방"은 자모 ㅇ이 어떤 글꼴에서도 작고 낮게 그려져 "oo"처럼 읽혔다.
                    아래 미리보기 기본 제목(팀 프로젝트 회의)과 이어지는 실제 방 이름으로 바꾼다. */}
                <RoomName>팀플 단체 톡방</RoomName>
                <RoomCount>
                  <FaUser size={11} />
                  {MOCK_MEMBERS.length}
                </RoomCount>
              </RoomInfo>
              <RoomTools>
                <FiSearch />
                <FiPhone />
                <FiVideo />
                <FiMenu />
              </RoomTools>
            </RoomHeader>
            {/* 친구(민준)가 묻고, 내가 표 링크로 답한다. 제목의 "이 링크"가 바로 위 노란 말풍선이다. */}
            <RoomBody>
              <Received>
                <RoomAvatar $kind="default" $large>
                  <FaUser />
                </RoomAvatar>
                <ReceivedBody>
                  <SenderName>민준</SenderName>
                  <ReceivedBubble>언제 시간 돼?</ReceivedBubble>
                </ReceivedBody>
              </Received>
              <SentBubble>
                <LinkText />
              </SentBubble>
            </RoomBody>
          </ChatRoom>
          <TitleWrap>
            <PageTitle
              style={
                showsPrompt
                  ? { opacity: titleOpacity, y: reduceMotion ? 0 : titleY }
                  : { opacity: 1, y: 0 }
              }
            >
              단체 약속 잡기,{" "}
              <br />
              이 링크 하나면 끝
            </PageTitle>
            {/* 제목 위에 겹친 입력 유도 문구. 누르면 입력칸으로 간다.
                키보드·스크린리더는 입력칸에 바로 갈 수 있어 이 문구는 건너뛴다(aria-hidden, 초점 없음). */}
            {showsPrompt && (
              <TitlePrompt
                aria-hidden="true"
                data-nosnippet
                onClick={focusTitle}
                style={{
                  opacity: promptOpacity,
                  y: reduceMotion ? 0 : promptY,
                  pointerEvents: isPromptShown ? "auto" : "none",
                }}
              >
                {TITLE_PROMPT}
                <FiArrowDown size={20} />
              </TitlePrompt>
            )}
          </TitleWrap>

        {/* data-nosnippet: 미리보기의 예시 이름·시간·"예시 데이터입니다…"가 검색결과 요약으로 뽑히지 않게 한다. */}
        <PreviewColumn data-nosnippet>
            {/* 실제 /table 화면을 가짜 데이터로 재현한 미리보기.
                누를 수 있는 것이 생겼으므로 통짜 role="img"로 감싸지 않는다.
                격자는 장식으로 감추고, 격자가 말하는 내용은 아래 요약에 글로 남긴다. */}
            <PreviewCard
              as="section"
              aria-labelledby="start-preview-heading"
              aria-describedby="start-preview-summary"
              onKeyDown={handlePreviewKeyDown}
            >
              {/* 실제 화면을 보여주는 미리보기라는 표시. 칸 속 이름·시간은 지어낸 것이라
                  스크린리더 요약("예시 데이터입니다…")에는 예시라고 그대로 밝힌다. */}
              <MockTag>
                <FiEye size={12} aria-hidden="true" />
                미리보기
              </MockTag>
              {mock ? (
                <PreviewLayout>
                  {/* 왼쪽: 전체 시간표 (table 페이지의 LeftPanel) */}
                  <PreviewPane>
                    <PaneHeading id="start-preview-heading">
                      <TabClearance aria-hidden="true" />
                      {previewTitle} <em>타임테이블</em>
                    </PaneHeading>
                    <PaneNote>{previewName ? `${previewName} 님의` : "전체"} 시간표</PaneNote>

                    {previewWeeks.length > 1 && (
                      <WeekNav>
                        <NavButton
                          type="button"
                          onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                          disabled={previewIndex === 0}
                          aria-label="이전 주 미리보기"
                        >
                          <FiChevronRight size={13} style={{ transform: "rotate(180deg)" }} />
                        </NavButton>
                        <span>
                          {previewIndex + 1} / {previewWeeks.length}주
                        </span>
                        <NavButton
                          type="button"
                          onClick={() =>
                            setPreviewIndex((i) => Math.min(previewWeeks.length - 1, i + 1))
                          }
                          disabled={previewIndex >= previewWeeks.length - 1}
                          aria-label="다음 주 미리보기"
                        >
                          <FiChevronRight size={13} />
                        </NavButton>
                      </WeekNav>
                    )}

                    {/* 후보에서 뺀 날은 열이 사라지는 게 아니라 비활성으로 남는다.
                        실제 /table 화면도 한 주를 통째로 그리고 후보 밖 날을 흐리게 둔다. */}
                    {/* 칸이 눌러지므로 격자를 통째로 aria-hidden 하지 않는다.
                        (focus 가능한 요소를 aria-hidden 안에 두면 스크린리더에서 길을 잃는다) */}
                    <PreviewScroll>
                      <PreviewGrid
                        $cols={DAYS_PER_WEEK}
                        role="group"
                        aria-label="예시 시간표 — 칸을 누르면 그 시간에 가능한 사람이 나옵니다"
                      >
                        <PreviewCorner aria-hidden="true" />
                        {shownWeek.map((d, i) => (
                          <PreviewHead
                            key={d ? d.key : `off-${i}`}
                            aria-hidden="true"
                            $off={!d || !d.selected}
                            $col={i}
                          >
                            {DAY_SHORT[i]}
                            <em>{d ? d.date.getDate() : ""}</em>
                          </PreviewHead>
                        ))}
                        {shownHours.map((h) => (
                          <PreviewRowGroup key={h}>
                            <PreviewTime aria-hidden="true">{`${String(h).padStart(2, "0")}:00`}</PreviewTime>
                            {shownWeek.map((d, i) => {
                              const off = !d || !d.selected;
                              const cellKey = d ? `${d.key}|${h}` : null;
                              const members = off ? [] : mock.cells[cellKey] || [];
                              // 개인 모드는 실제 TimeGrid와 같이 단색 1.0으로 칠한다.
                              const opacity = previewName
                                ? members.includes(previewName)
                                  ? 1
                                  : 0
                                : members.length
                                  ? 0.2 + (members.length / mock.maxCount) * 0.8
                                  : 0;
                              // 움직임은 골든타임 칸에만 둔다. 개인 모드에서는 모든 칸이 최다가 되므로 끈다.
                              const isGolden =
                                !previewName && members.length > 0 && members.length === mock.maxCount;
                              return (
                                <PreviewCell
                                  key={d ? `${d.key}-${h}` : `off-${i}-${h}`}
                                  as={members.length ? "button" : "div"}
                                  type={members.length ? "button" : undefined}
                                  $off={off}
                                  data-cell={cellKey || undefined}
                                  $clickable={members.length > 0}
                                  aria-label={
                                    members.length
                                      ? `${d.date.getMonth() + 1}월 ${d.date.getDate()}일 ${String(h).padStart(2, "0")}시 · ${members.length}명 가능`
                                      : undefined
                                  }
                                  onClick={
                                    members.length
                                      ? () => {
                                          setTapHintDismissed(true);
                                          setOpenCell((v) => (v === cellKey ? null : cellKey));
                                        }
                                      : undefined
                                  }
                                >
                                  {opacity > 0 && <CellFill style={{ opacity }} />}
                                  {isGolden && <CellShine />}
                                  {/* 가장 위 골든타임 칸을 누르게 하는 안내. 명단이 열려 있으면 감춘다.
                                      앞쪽 요일(월~수)이면 왼쪽 공간이 없어 오른쪽에 둔다.
                                      칸 버튼 안에 있어 안내를 눌러도 이 칸의 명단이 열린다. */}
                                  {cellKey === goldenKey && !openCell && !isTapHintDismissed && (
                                    <TapHint $side={i >= 3 ? "left" : "right"} aria-hidden="true">
                                      눌러서 명단 보기
                                    </TapHint>
                                  )}
                                </PreviewCell>
                              );
                            })}
                          </PreviewRowGroup>
                        ))}
                      </PreviewGrid>
                    </PreviewScroll>

                    <Legend aria-hidden="true">
                      {previewName ? (
                        <>
                          <LegendSwatch />
                          <span>{previewName} 님이 가능한 시간</span>
                        </>
                      ) : (
                        <>
                          <span>적음</span>
                          <LegendBar />
                          <span>많음</span>
                        </>
                      )}
                    </Legend>

                    {/* 눈으로는 짧게, 스크린리더에는 격자가 말하는 내용을 전부 남긴다. */}
                    <SrOnly as="p" id="start-preview-summary">
                      {previewSummary}
                    </SrOnly>
                  </PreviewPane>

                  {/* 오른쪽: 헤더·순위·참여자 (table 페이지의 RightPanel) */}
                  <PreviewPane $side>
                    {dateRangeLabel && (
                      <MiniBadge>
                        <FiCalendar size={11} aria-hidden="true" />
                        {dateRangeLabel}
                      </MiniBadge>
                    )}
                    <MiniTitle>{previewTitle}</MiniTitle>

                    <MiniInvite
                      type="button"
                      onClick={openInviteToast}
                      aria-label="예시 초대 링크 — 이 링크를 초대할 팀원에게 공유합니다. 예시라서 복사되지 않습니다."
                    >
                      <MiniInviteLabel aria-hidden="true">
                        <FiShare2 size={10} />
                        초대 링크
                      </MiniInviteLabel>
                      <MiniInviteRow aria-hidden="true">
                        <MiniInviteUrl>{`${previewOrigin}/table/${MOCK_TABLE_ID}`}</MiniInviteUrl>
                        <MiniCopy>복사하기</MiniCopy>
                      </MiniInviteRow>
                    </MiniInvite>

                    <MiniResult
                      type="button"
                      onClick={() => setRankingOpen((v) => !v)}
                      aria-expanded={isRankingOpen}
                      aria-controls="start-preview-ranking"
                    >
                      <FiAward size={15} aria-hidden="true" />
                      <MiniResultLabel>골든타임 순위</MiniResultLabel>
                      <em>최대 {mock.maxCount}명</em>
                      <Chevron $open={isRankingOpen} aria-hidden="true">
                        <FiChevronRight size={14} />
                      </Chevron>
                    </MiniResult>

                    <AnimatePresence initial={false}>
                      {isRankingOpen && (
                        <RankingPanel
                          id="start-preview-ranking"
                          role="region"
                          aria-label="예시 골든타임 상위 3개"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeInOut" }}
                        >
                          <RankingInner>
                            {mock.ranking.length === 0 && <RankEmpty>겹치는 시간이 없습니다.</RankEmpty>}
                            {mock.ranking.map((b) => (
                              <RankRow key={b.id} $top={b.displayRank === 1}>
                                <RankTop>
                                  <RankBadge $top={b.displayRank === 1}>{b.displayRank}</RankBadge>
                                  <RankTime>{b.label}</RankTime>
                                </RankTop>
                                <RankGauge aria-hidden="true">
                                  <i style={{ width: `${(b.count / mock.total) * 100}%` }} />
                                </RankGauge>
                                <RankCaption>
                                  예시 {mock.total}명 중 {b.count}명 가능
                                </RankCaption>
                                <RankMembers>
                                  <FiUsers size={11} aria-hidden="true" />
                                  {b.members.join(", ")}
                                </RankMembers>
                              </RankRow>
                            ))}
                          </RankingInner>
                        </RankingPanel>
                      )}
                    </AnimatePresence>

                    <MiniMembers
                      role="group"
                      aria-label="예시 참여자 — 누르면 그 사람의 시간만 표시됩니다"
                    >
                      <MiniSectionTitle>참여자 ({mock.total})</MiniSectionTitle>
                      <MiniChips>
                        <MiniChip
                          type="button"
                          $active={previewName === null}
                          aria-pressed={previewName === null}
                          onClick={() => selectPreviewName(null)}
                        >
                          전체
                        </MiniChip>
                        {MOCK_MEMBERS.map((m) => (
                          <MiniChip
                            key={m}
                            type="button"
                            $active={previewName === m}
                            aria-pressed={previewName === m}
                            onClick={() => selectPreviewName(previewName === m ? null : m)}
                          >
                            {m}
                          </MiniChip>
                        ))}
                      </MiniChips>
                    </MiniMembers>
                  </PreviewPane>
                </PreviewLayout>
              ) : (
                <>
                  <PreviewEmpty id="start-preview-summary">{previewSummary}</PreviewEmpty>
                  <SrOnly as="h3" id="start-preview-heading">
                    미리보기
                  </SrOnly>
                </>
              )}

              <AnimatePresence>
                {isToastOpen && (
                  <Toast
                    role="status"
                    onMouseEnter={holdToast("hover")}
                    onMouseLeave={releaseToast("hover")}
                    onFocus={holdToast("focus")}
                    onBlur={releaseToast("focus")}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <FiInfo size={14} aria-hidden="true" />
                    <ToastText>
                      이 링크를 초대할 팀원에게 공유하면 됩니다.
                      <br />
                      지금은 예시라서 실제로 복사되지 않습니다.
                    </ToastText>
                    <ToastClose type="button" aria-label="안내 닫기" onClick={closeToast}>
                      <FiX size={14} />
                    </ToastClose>
                  </Toast>
                )}
              </AnimatePresence>
            </PreviewCard>
            {/* 넓은 화면: 미리보기를 보고 바로 누르도록 미리보기 아래에 붙여 함께 고정한다. */}
            <SideCta>{renderCta("start-cta-hint-side")}</SideCta>
        </PreviewColumn>

        <Builder aria-busy={isLoading}>
          <SrOnly role="status">{presetAnnounce}</SrOnly>

          <FieldBlock>
            <FieldLabel htmlFor="start-title">모임 이름</FieldLabel>
            <TitleField>
              <TitleInput
                id="start-title"
                value={title}
                maxLength={25}
                onChange={(e) => {
                  setTitleTouched(true);
                  setTitle(e.target.value);
                }}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTitleFocused(false)}
                $nudge={promptActive}
                placeholder="예: 팀 프로젝트 회의"
                aria-describedby="start-title-count"
              />
              <TitleCount id="start-title-count">
                {title.length}/25
              </TitleCount>
            </TitleField>

            {/* 빠른 제목 입력. 칩에 적힌 제목이 그대로 들어가고, 시간 범위도 그 모임에 맞게 바뀐다.
                날짜는 건드리지 않는다. */}
            {PRESETS.length > 0 && (
              <QuickTitles
                ref={quickRef}
                role="group"
                aria-label="빠른 제목 입력"
                onScroll={updateQuickFade}
                $fadeStart={quickFade.start}
                $fadeEnd={quickFade.end}
              >
                {PRESETS.map((p) => (
                  <QuickTitle
                    key={p.key}
                    type="button"
                    disabled={isLoading}
                    aria-disabled={isLoading}
                    onClick={() => applyPreset(p.key)}
                  >
                    {p.title}
                  </QuickTitle>
                ))}
              </QuickTitles>
            )}
          </FieldBlock>

          <DateFieldset disabled={isLoading}>
            <DateLegend>후보 날짜</DateLegend>
            <SrOnly id="start-dates-hint">눌러서 켜고 끄기 · 최소 하루</SrOnly>
            <DateSummary>
              <b>{selectedDays.length}일</b> 선택 · {weekCount}주
            </DateSummary>

            {/* quick-create 의 Calendar 와 같은 시각 언어 — 테두리 없는 7열, 원형 셀,
                선택은 원이 스프링으로 붙는다. 조작 방식(눌러 토글)은 그대로다. */}
            <DateCalendar $invalid={selectedDays.length === 0}>
              <DateGridScroll>
                <DateGrid role="group" aria-describedby="start-dates-hint start-dates-error">
                  {DAY_SHORT.map((w, i) => (
                    <DayHead key={w} aria-hidden="true" $col={i}>
                      {w}
                    </DayHead>
                  ))}
                  {/* 첫 날을 자기 요일 칸에 맞추기 위한 빈 칸 */}
                  {Array.from({ length: dates.length ? colOf(dates[0].date) : 0 }, (_, i) => (
                    <DatePad key={`lead-${i}`} aria-hidden="true" />
                  ))}
                  <AnimatePresence initial={false}>
                    {dates.map((d, i) => {
                      const dow = d.date.getDay();
                      const tag =
                        i === 0 ? "내일" : d.date.getDate() === 1 ? `${d.date.getMonth() + 1}월` : "";
                      return (
                        <DateCell
                          key={d.key}
                          type="button"
                          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: theme.motion.riseY }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: theme.duration.sec.fast,
                            ease: theme.easing.arr.out,
                            delay: reduceMotion
                              ? 0
                              : Math.min(Math.floor(i / 7) * theme.motion.stagger, theme.motion.staggerMax),
                          }}
                          $active={d.selected}
                          aria-pressed={d.selected}
                          aria-label={`${i === 0 ? "내일, " : ""}${d.date.getMonth() + 1}월 ${d.date.getDate()}일 ${DAY_FULL[dow]}`}
                          data-date={d.key}
                          onPointerDown={startDrag(d.key, d.selected)}
                          // 포인터로 이미 처리했다. 키보드(Enter/Space)로 온 클릭만 받는다.
                          onClick={(e) => e.detail === 0 && toggleDate(d.key)}
                        >
                          <CircleWrap data-circle>
                            <AnimatePresence>
                              {d.selected && (
                                <SelectedCircle
                                  initial={reduceMotion ? { opacity: 0 } : { scale: 0 }}
                                  animate={reduceMotion ? { opacity: 1 } : { scale: 1 }}
                                  exit={reduceMotion ? { opacity: 0 } : { scale: 0 }}
                                  transition={
                                    reduceMotion
                                      ? { duration: theme.duration.sec.fast }
                                      : theme.motion.select
                                  }
                                />
                              )}
                            </AnimatePresence>
                            <DateNumber $active={d.selected}>{d.date.getDate()}</DateNumber>
                          </CircleWrap>
                          <DateTag $strong={i === 0}>{tag}</DateTag>
                        </DateCell>
                      );
                    })}
                  </AnimatePresence>
                  {dates.length > 0 &&
                    Array.from(
                      { length: (7 - ((colOf(dates[0].date) + dates.length) % 7)) % 7 },
                      (_, i) => <DatePad key={`trail-${i}`} aria-hidden="true" />
                    )}
                </DateGrid>
              </DateGridScroll>
            </DateCalendar>

            {/* 후보 기간은 주 단위로만 늘리고 줄인다. 달력 격자가 한 줄씩 붙고 떨어진다. */}
            <WeekControls>
              <WeekButton
                type="button"
                onClick={removeWeek}
                disabled={weekCount <= MIN_WEEKS}
                aria-label="후보 기간 한 주 줄이기"
              >
                <FiMinus size={16} aria-hidden="true" />
              </WeekButton>
              <WeekCount aria-live="polite">{weekCount}주</WeekCount>
              <WeekButton
                type="button"
                onClick={addWeek}
                disabled={weekCount >= MAX_WEEKS}
                aria-label="후보 기간 한 주 늘리기"
              >
                <FiPlus size={16} aria-hidden="true" />
              </WeekButton>
            </WeekControls>
            {/* 눌러보기 전에 왜 비활성인지 알 수 있어야 한다. */}
            <Hint style={{ textAlign: "center" }}>
              {MIN_WEEKS}주 ~ {MAX_WEEKS}주 사이에서 조절합니다
            </Hint>

            {selectedDays.length === 0 && (
              <Warning id="start-dates-error" role="alert">
                <FiAlertCircle size={14} aria-hidden="true" />
                하루 이상 선택해 주세요.
              </Warning>
            )}
            {isLoading && <Hint role="status">만드는 중에는 후보 날짜를 바꿀 수 없습니다.</Hint>}
          </DateFieldset>

          <FieldBlock>
            <FieldLabel as="span">시간 범위</FieldLabel>
            <TimeRow>
              <TimeSelect
                aria-label="시작 시간"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
              >
                {HOURS.slice(0, -1).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </TimeSelect>
              <span aria-hidden="true">~</span>
              <TimeSelect
                aria-label="종료 시간"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
              >
                {HOURS.slice(1).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </TimeSelect>
            </TimeRow>
            {startHour >= endHour && (
              <Warning role="alert">
                <FiAlertCircle size={14} aria-hidden="true" />
                종료 시간이 시작 시간보다 늦어야 합니다.
              </Warning>
            )}
          </FieldBlock>
        </Builder>

        {/* 좁은 화면: 폼을 다 고친 자리에서 누르는 버튼. 여기가 보이면 하단 고정 막대를 거둔다. */}
        <CtaBlock ref={inlineCtaRef}>
          {renderCta("start-cta-hint")}
        </CtaBlock>
        </StartShell>

        {/* 좁은 화면 하단 고정 버튼. 첫 화면에서 미리보기·입력창과 함께 보이게 한다. */}
        {isInlineCtaBelow && !isLockOpen && !created && !(isTouchDevice && isTitleFocused) && (
          <MobileCtaBar>
            <MobileCtaInner>{renderCta("start-cta-hint-bar", { announce: false })}</MobileCtaInner>
          </MobileCtaBar>
        )}

        {/* 열린 칸 옆에 붙는 팝업. /table 의 셀 팝업과 같은 구성이다.
            포털로 body 에 붙여야 미리보기 카드의 overflow 에 잘리지 않는다. */}
        {/* 잠금 팝업이 떠 있는 동안에는 감춘다. 포털이라 모달 위로 뜬다. */}
        {openCellInfo &&
          !isLockOpen &&
          !created &&
          popupPos.visible &&
          createPortal(
            /* AnimatePresence 를 쓰지 않는다. 조건이 꺼지면 이 블록 자체가 사라져
               exit 애니메이션이 돌 자리가 없고, PopChild 가 ref 를 가로채 경고를 낸다. */
            (
              <CellPopup
                key={openCell}
                ref={popupRef}
                style={{ top: popupPos.top, left: popupPos.left }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                role="dialog"
                aria-label="예시 시간대 참여 명단"
              >
                <CellInfoHead>
                  <div>
                    <CellInfoTime>
                      {openCellInfo.day.date.getMonth() + 1}월 {openCellInfo.day.date.getDate()}일 (
                      {formatDayLabel(openCellInfo.day.date)}){" "}
                      {String(openCellInfo.hour).padStart(2, "0")}:00 ~{" "}
                      {String(openCellInfo.hour + 1).padStart(2, "0")}:00
                    </CellInfoTime>
                    {/* 색 띠 대신 한 줄 글로 알린다. */}
                    {openCellInfo.isGolden && (
                      <CellInfoGolden>
                        <LabelMark $can aria-hidden="true" />
                        가장 많이 모이는 시간
                      </CellInfoGolden>
                    )}
                  </div>
                  <CellInfoClose
                    type="button"
                    aria-label="닫기"
                    onClick={() => {
                      setTapHintDismissed(true);
                      setOpenCell(null);
                    }}
                  >
                    <FiX size={15} />
                  </CellInfoClose>
                </CellInfoHead>
                <CellInfoRow>
                  <CellInfoLabel>
                    <LabelMark $can aria-hidden="true" />
                    참여 가능 {openCellInfo.can.length}명
                  </CellInfoLabel>
                  <NameChips>
                    {openCellInfo.can.length ? (
                      openCellInfo.can.map((m) => (
                        <NameChip key={m} $can>
                          {m}
                        </NameChip>
                      ))
                    ) : (
                      <NoName>없음</NoName>
                    )}
                  </NameChips>
                </CellInfoRow>
                <CellInfoRow>
                  <CellInfoLabel>
                    <LabelMark aria-hidden="true" />
                    참여 불가 {openCellInfo.cannot.length}명
                  </CellInfoLabel>
                  <NameChips>
                    {openCellInfo.cannot.length ? (
                      openCellInfo.cannot.map((m) => <NameChip key={m}>{m}</NameChip>)
                    ) : (
                      <NoName>없음</NoName>
                    )}
                  </NameChips>
                </CellInfoRow>
              </CellPopup>
            ),
            document.body
          )}

        {/* 만들기 전 확인 창. 만들어질 내용을 한 번 보여주고, 시간 잠금(선택)을 여기서만 고른다.
            흐름은 예전과 같다(이대로 만들기 → 이 창 → 링크 만들기). 잠금은 건너뛰어도 되므로 접힌 채로 열린다. */}
        <AnimatePresence>
          {isLockOpen && (
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: theme.duration.sec.fast }}
              onClick={() => !isLoading && closeLock()}
            >
              <LockModal
                ref={lockRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="start-lock-title"
                aria-describedby="start-lock-summary"
                tabIndex={-1}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: theme.motion.riseY }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: theme.motion.riseY }}
                transition={{ duration: theme.duration.sec.base, ease: theme.easing.arr.out }}
                onClick={(e) => e.stopPropagation()}
              >
                <LockBody>
                  <LockHead>
                    <LockTitle id="start-lock-title">이대로 만들까요?</LockTitle>
                    <CellInfoClose type="button" aria-label="닫기" onClick={closeLock} disabled={isLoading}>
                      <FiX size={18} />
                    </CellInfoClose>
                  </LockHead>

                  <LockSummary id="start-lock-summary">
                    <div>
                      <dt>모임 이름</dt>
                      <dd>{title.trim()}</dd>
                    </div>
                    <div>
                      <dt>후보 날짜</dt>
                      <dd>{dateSummary}</dd>
                    </div>
                    <div>
                      <dt>시간 범위</dt>
                      <dd>
                        {startHour} ~ {endHour}
                      </dd>
                    </div>
                  </LockSummary>

                  {/* 시간 잠금(선택). 제목·설명 왼쪽, 펼침 화살표 오른쪽. 펼쳐야 격자가 나온다. */}
                  <LockSection>
                    <LockAccordion
                      type="button"
                      onClick={() => setLockExpanded((v) => !v)}
                      aria-expanded={isLockExpanded}
                      aria-controls="start-lock-grid"
                      disabled={isLoading}
                    >
                      <LockIcon aria-hidden="true">
                        <FiLock size={16} />
                      </LockIcon>
                      <LockText>
                        <LockName>
                          시간 잠금
                          <LockOptional>선택</LockOptional>
                          {banedCells.length > 0 && <LockCount>{banedCells.length}칸 잠금</LockCount>}
                        </LockName>
                        <LockDesc>잠근 시간대는 참여자가 고를 수 없습니다.</LockDesc>
                      </LockText>
                      <AccordionIcon $open={isLockExpanded} aria-hidden="true">
                        <FiChevronDown size={18} />
                      </AccordionIcon>
                    </LockAccordion>

                    <AnimatePresence initial={false}>
                      {isLockExpanded && (
                        <LockGridWrap
                          id="start-lock-grid"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: reduceMotion ? 0 : theme.duration.sec.base }}
                        >
                          <LockGridInner>
                            <LockGridHint>막을 칸을 누르거나 끌어서 고르세요.</LockGridHint>
                            <TimeGrid
                              dates={selectedDates}
                              startHour={startHour}
                              endHour={endHour}
                              selectedCells={banedCells}
                              setSelectedCells={setBanedCells}
                              selectedCellColor={theme.text.gamma[700]}
                            />
                          </LockGridInner>
                        </LockGridWrap>
                      )}
                    </AnimatePresence>
                  </LockSection>
                </LockBody>

                <LockActions>
                  <LockGhost type="button" onClick={closeLock} disabled={isLoading}>
                    취소
                  </LockGhost>
                  <CreateButton
                    ref={lockPrimaryRef}
                    type="button"
                    onClick={handleCreate}
                    disabled={isLoading}
                  >
                    {isLoading ? "만드는 중…" : "링크 만들기"}
                  </CreateButton>
                </LockActions>
              </LockModal>
            </ModalOverlay>
          )}
        </AnimatePresence>

        {/* 완료 창. 휴대폰에서는 공유 창(카카오톡·문자 등)이 주 버튼이다.
            공유 창이 없는 브라우저(대부분의 PC)에서는 링크 복사가 주 버튼이 된다.
            닫기(Esc·바깥 누르기)는 테이블로 이동과 같다. 예전 성공 알림도 닫으면 테이블로 갔다. */}
        <AnimatePresence>
          {created && (
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: theme.duration.sec.fast }}
              onClick={goToTable}
            >
              <DoneModal
                ref={doneRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="start-done-title"
                aria-describedby="start-done-desc"
                tabIndex={-1}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: theme.motion.riseY }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: theme.duration.sec.base, ease: theme.easing.arr.out }}
                onClick={(e) => e.stopPropagation()}
              >
                <DoneMark aria-hidden="true">
                  <FiCheck size={22} />
                </DoneMark>
                <DoneTitle id="start-done-title">링크가 만들어졌습니다</DoneTitle>
                <DoneDesc id="start-done-desc">
                  단톡방에 보내면 각자 가능한 시간을 표시합니다.
                </DoneDesc>

                <LinkField>
                  <LinkInput
                    ref={linkInputRef}
                    type="text"
                    readOnly
                    value={created.url}
                    aria-label="테이블 링크"
                    onFocus={(e) => e.target.select()}
                  />
                  {/* 공유 창이 주 버튼일 때만 따로 둔다. 아니면 주 버튼이 곧 복사다. */}
                  {canShare && (
                    <LinkCopy type="button" onClick={copyLink} $done={copyState === "copied"}>
                      {copyState === "copied" ? (
                        <>
                          <FiCheck size={14} aria-hidden="true" />
                          복사됨
                        </>
                      ) : (
                        "복사"
                      )}
                    </LinkCopy>
                  )}
                </LinkField>
                <DoneStatus role="status" $failed={copyState === "failed"}>
                  {copyState === "copied"
                    ? "링크를 복사했습니다. 단톡방에 붙여 넣으세요."
                    : copyState === "failed"
                      ? "자동 복사가 되지 않았습니다. 위 링크를 직접 복사해 주세요."
                      : ""}
                </DoneStatus>

                <DoneActions>
                  {canShare ? (
                    <CreateButton ref={donePrimaryRef} type="button" onClick={shareLink}>
                      <FiShare size={18} aria-hidden="true" />
                      링크 공유하기
                    </CreateButton>
                  ) : (
                    <CreateButton ref={donePrimaryRef} type="button" onClick={copyLink}>
                      {copyState === "copied" ? (
                        <FiCheck size={18} aria-hidden="true" />
                      ) : (
                        <FiCopy size={18} aria-hidden="true" />
                      )}
                      {copyState === "copied" ? "복사했습니다" : "링크 복사하기"}
                    </CreateButton>
                  )}
                  <DoneSecondary type="button" onClick={goToTable}>
                    테이블로 이동
                    <FiArrowRight size={16} aria-hidden="true" />
                  </DoneSecondary>
                </DoneActions>
              </DoneModal>
            </ModalOverlay>
          )}
        </AnimatePresence>

        {/* 검색엔진이 읽을 본문. 도구만 있고 글이 없으면 이 페이지가 무엇인지 판단할 근거가 없다.
            접어 둬도 HTML에 남아 있으면 구글은 내용으로 본다(details는 닫혀도 DOM에 있다).
            답은 실제 /table 화면의 안내 문구·이용 가이드와 맞춘다. 화면에 없는 기능은 적지 않는다. */}
        <Faq aria-labelledby="start-faq-heading" google-side-rail-overlap="false">
          <h2 id="start-faq-heading">약속 시간 정하기, 자주 묻는 질문</h2>
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q}>
              <summary>
                <span>{item.q}</span>
                <FiChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </FaqItem>
          ))}
          <FaqMore>
            자세한 사용법은 <Link to="/guide">이용 가이드</Link>를 참고하세요.
          </FaqMore>
        </Faq>
      </PageWrapper>
    </>
  );
}

/* ------------------------------------------------------------------ 스타일 */

const PageWrapper = styled.main`
  width: 100%;
  padding: 48px 20px 90px;
  box-sizing: border-box;
  /* 격자 bleed가 본문 가로 스크롤을 만들지 않게 한다.
     hidden은 이 요소를 스크롤 상자로 만들어 오른쪽 미리보기의 sticky가 창 스크롤을 따라가지 못하고
     24px(이 요소의 위 여백) 밀려 있었다. clip은 스크롤 상자를 만들지 않는다. clip을 모르는 브라우저는 hidden을 쓴다. */
  overflow-x: hidden;
  overflow-x: clip;

  @media (max-width: 480px) {
    padding: 16px 12px 64px;
  }

  @media (min-width: ${theme.breakpoint.lg}) {
    padding-top: 24px;
  }
  background: ${theme.text.gamma[950]};
`;

/**
 * 넓은 화면 양옆은 AdSense 자동 광고(사이드 레일, 세로 160px) 자리로 비워 둔다(2026-09-27 사람 결정).
 * 1536px부터만 비운다. 더 좁은 화면에서 비우면 왼쪽 폼이 좁아져 후보 날짜 줄이 잘렸다(1440px에서 일요일).
 */
const AD_RAIL_MIN_WIDTH = "1536px";
const AD_RAIL_SPACE = `(160px + ${theme.space[8]})`;
/**
 * 폼 칸의 최소 폭. 후보 날짜 격자(최소 324px) + 격자 여백(8px×2) + 달력 여백(12px×2)
 * + 폼 카드 여백(좌우)을 더한 값에 여유를 둔다. 이보다 좁아지면 날짜 줄이 가로로 잘린다.
 */
const FORM_MIN_WIDTH = "460px";

/* AdSense가 읽는 속성을 DOM까지 넘긴다. emotion은 모르는 속성을 걸러 낸다. */
const withRailAttr = {
  shouldForwardProp: (prop) => isPropValid(prop) || prop === "google-side-rail-overlap",
};

/**
 * 페이지 본체. 좁은 화면에서는 단톡방 → 제목 → 미리보기 → 폼 → 만들기 버튼 순으로 쌓는다.
 * 1024px부터는 왼쪽에 제목·폼, 오른쪽에 단톡방 → 미리보기 → 만들기 버튼(미리보기부터 고정)을 둔다.
 * (단톡방이 제목과 함께 왼쪽에 있을 때는 왼쪽이 915px, 오른쪽이 488px로 길이가 크게 달라 어색했다.)
 * 단톡방은 1~2행, 폼은 2~3행에 걸쳐 제목 바로 아래에 폼이, 단톡방 바로 아래에 미리보기가 붙는다.
 * 좁은 화면의 폭 제한(720px)을 여기서 건다. 폼 카드에 margin: auto를 주면
 * 그리드 칸을 채우지 않고 내용 폭으로 줄어든다.
 */
const StartShell = styled("div", withRailAttr)`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${theme.space[3]};
  max-width: 720px;
  margin: 0 auto;

  @media (min-width: ${theme.breakpoint.sm}) {
    gap: ${theme.space[6]};
  }

  @media (min-width: ${theme.breakpoint.lg}) {
    max-width: 1240px;
    grid-template-columns: 440px minmax(0, 1fr);
    grid-template-rows: auto auto 1fr;
    grid-template-areas:
      "title room"
      "form room"
      "form preview";
    column-gap: ${theme.space[6]};
    /* 높이 768px 노트북에서도 만들기 버튼까지 첫 화면에 들어오게 간격을 줄인다. */
    row-gap: ${theme.space[4]};
    align-items: start;
  }

  @media (min-width: ${theme.breakpoint.xl}) {
    grid-template-columns: 500px minmax(0, 1fr);
    column-gap: ${theme.space[8]};
  }

  /* 양옆 광고 자리를 뺀 폭만 쓴다(최대 1240px). 폼 칸은 FORM_MIN_WIDTH 아래로 줄이지 않고 미리보기 칸이 줄어든다. */
  @media (min-width: ${AD_RAIL_MIN_WIDTH}) {
    max-width: min(1240px, calc(100% - 2 * ${AD_RAIL_SPACE}));
    grid-template-columns: clamp(${FORM_MIN_WIDTH}, 40%, 500px) minmax(0, 1fr);
  }
`;

const PreviewColumn = styled.div`
  min-width: 0;

  @media (min-width: ${theme.breakpoint.lg}) {
    grid-area: preview;
    align-self: start;
    position: sticky;
    /* 사이트 헤더도 위에 붙어 있다. 그 아래에 붙여야 미리보기 윗부분이 헤더에 가리지 않는다. */
    top: calc(${HEADER_HEIGHT} + ${theme.space[6]});
    /* 00:00~24:00을 고르면 격자만 720px이라 화면보다 길어진다. 그때는 이 칸 안에서 스크롤한다. */
    max-height: calc(100vh - ${HEADER_HEIGHT} - ${theme.space[6]} * 2);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
`;

const CtaBlock = styled.div`
  @media (min-width: ${theme.breakpoint.lg}) {
    display: none;
  }
`;

/* 좌우로 갈라진 화면 전용. 미리보기 아래에 붙어 미리보기와 함께 고정된다. */
const SideCta = styled.div`
  display: none;

  @media (min-width: ${theme.breakpoint.lg}) {
    display: block;
    margin-top: ${theme.space[3]};
  }
`;

/* 좁은 화면 하단 고정 막대. 안내 문구까지 넣으면 첫 화면의 입력창을 가려 버튼만 둔다. */
const MobileCtaBar = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 900;
  padding: ${theme.space[3]} ${theme.space[4]} calc(${theme.space[3]} + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);

  p {
    display: none;
  }

  @media (max-width: 640px) {
    padding-top: 10px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));

    button {
      min-height: 48px;
    }
  }

  @media (min-width: ${theme.breakpoint.lg}) {
    display: none;
  }
`;

const MobileCtaInner = styled.div`
  max-width: 720px;
  margin: 0 auto;
`;

/* 제목과 그 위에 겹치는 입력 유도 문구를 같은 자리에 둔다. 제목과 아래 미리보기 사이 간격도 여기서 준다. */
const TitleWrap = styled.div`
  position: relative;
  margin-bottom: 14px;

  @media (max-width: 640px) {
    margin-bottom: 0;
  }

  @media (min-width: ${theme.breakpoint.lg}) {
    grid-area: title;
    margin-bottom: 0;
  }
`;

/* 제목 두 줄 자리 한가운데에 한 줄로 뜬다. 화살표만 강조색으로 입력칸 쪽(아래)을 가리킨다. */
const TitlePrompt = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[1]};
  font-family: ${theme.font.family.bold};
  font-size: 22px;
  line-height: 1.3;
  color: ${theme.text.gamma[100]};
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  svg {
    flex-shrink: 0;
    color: ${theme.color.primary};
  }

  @media (min-width: ${theme.breakpoint.sm}) {
    font-size: ${theme.font.size.title2};
  }
`;

const PageTitle = styled(motion.h1)`
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.title1};
  line-height: 1.3;
  color: ${theme.text.gamma[100]};
  margin: 0;
  text-align: center;

  @media (min-width: ${theme.breakpoint.lg}) {
    text-align: left;
  }

  @media (max-width: 768px) {
    font-size: ${theme.font.size.title2};
  }

  @media (max-width: 640px) {
    font-size: 22px;
  }

  @media (min-width: ${theme.breakpoint.xl}) {
    font-size: 30px;
  }
`;

/* 카카오톡 색. 둘 다 사람이 준 실제 카카오톡 캡처에서 뽑았다. */
const KAKAO_ROOM = "#BECDDE"; // 채팅방 배경
const KAKAO_BUBBLE = "#FAE64D"; // 보낸 메시지

/* 단톡방 창. 제목과의 간격은 StartShell의 gap이 맡는다. 넓은 화면에서는 오른쪽 미리보기 위 칸 전체 폭이다.
   한 줄로 쌓이는 화면에서는 스크롤에 맞춰 작아지고 옅어진다(style로 받는 모션 값). */
const ChatRoom = styled(motion.div)`
  margin: 0;

  @media (min-width: ${theme.breakpoint.lg}) {
    grid-area: room;
  }
  border-radius: ${theme.radius.lg};
  overflow: hidden;
  background: ${KAKAO_ROOM};
  text-align: left;
`;

/* 방 윗부분: 프로필 묶음 · 방 이름과 인원 · 검색·전화·영상·메뉴 아이콘(그림일 뿐 누를 수 없다). */
const RoomHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[3]};
  padding: ${theme.space[3]} ${theme.space[4]} ${theme.space[2]};

  /* 휴대폰은 첫 화면에 입력창까지, 넓은 화면은 높이 768px에서도 만들기 버튼까지 들어가게 여백을 줄인다. */
  @media (max-width: 640px) {
    padding: 10px ${theme.space[3]} ${theme.space[1]};
  }

  @media (min-width: ${theme.breakpoint.lg}) {
    padding: 10px ${theme.space[4]} ${theme.space[1]};
  }
`;

const RoomAvatars = styled.div`
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(2, 16px);
  gap: 2px;
`;

/* 실제 친구 사진 대신 단색 프로필. 기본 프로필은 카카오톡처럼 하늘색 바탕에 흰 사람 모양. */
const AVATAR_BG = { default: "#C3E0EB", dark: "#1D1D1D", warm: "#8C7A6B", gold: "#C9A443" };

const RoomAvatar = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: ${({ $large }) => ($large ? "36px" : "16px")};
  height: ${({ $large }) => ($large ? "36px" : "16px")};
  border-radius: 38%;
  overflow: hidden;
  background: ${({ $kind }) => AVATAR_BG[$kind]};
  color: ${theme.color.surface};
  font-size: ${({ $large }) => ($large ? "26px" : "12px")};

  svg {
    margin-bottom: -12%;
  }
`;

const RoomInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const RoomName = styled.span`
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.body};
  color: ${theme.text.gamma[100]};
  white-space: nowrap;
`;

const RoomCount = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  color: #5f666f;
`;

const RoomTools = styled.div`
  display: flex;
  gap: ${theme.space[3]};
  margin-left: auto;
  font-size: 19px;
  color: ${theme.text.gamma[100]};
`;

const RoomBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]};
  padding: ${theme.space[2]} ${theme.space[4]} ${theme.space[4]};

  @media (max-width: 640px) {
    padding: ${theme.space[1]} ${theme.space[3]} ${theme.space[3]};
  }

  @media (min-width: ${theme.breakpoint.lg}) {
    padding: ${theme.space[1]} ${theme.space[4]} ${theme.space[3]};
  }
`;

/**
 * 보낸 메시지(내 답장): 오른쪽 노란 말풍선, 꼬리는 오른쪽 위. 꼬리가 붙는 모서리는 직각이다.
 * 안의 링크 글자는 LinkText가 CSS로 그린다.
 */
const SentBubble = styled.span`
  position: relative;
  align-self: flex-end;
  margin-right: 7px;
  padding: ${theme.space[2]} ${theme.space[3]};
  border-radius: 14px 0 14px 14px;
  background: ${KAKAO_BUBBLE};
  color: ${theme.text.gamma[100]};
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.body};
  line-height: 1.4;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    right: -7px;
    width: 9px;
    height: 11px;
    background: ${KAKAO_BUBBLE};
    clip-path: polygon(0 0, 100% 0, 0 100%);
  }

  @media (max-width: 640px) {
    padding: 6px ${theme.space[3]};
    font-size: ${theme.font.size.label};
  }

  @media (min-width: ${theme.breakpoint.lg}) {
    padding: 6px ${theme.space[3]};
  }
`;

/* 받은 메시지: 왼쪽에 프로필, 위에 보낸 사람 이름, 아래 흰 말풍선. */
const Received = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.space[2]};
`;

const ReceivedBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${theme.space[1]};
  min-width: 0;
`;

const SenderName = styled.span`
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[300]};
`;

/* 받은 메시지(민준의 질문): 채팅방 배경 위라 테두리 없이 흰 말풍선. 꼬리는 왼쪽 위. */
const ReceivedBubble = styled.span`
  position: relative;
  margin-left: 7px;
  color: ${theme.text.gamma[100]};
  padding: ${theme.space[2]} ${theme.space[3]};
  border-radius: 0 14px 14px 14px;
  background: ${theme.color.surface};
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.body};
  line-height: 1.4;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: -7px;
    width: 9px;
    height: 11px;
    background: ${theme.color.surface};
    clip-path: polygon(0 0, 100% 0, 100% 100%);
  }

  @media (max-width: 640px) {
    padding: 6px ${theme.space[3]};
    font-size: ${theme.font.size.label};
  }

  @media (min-width: ${theme.breakpoint.lg}) {
    padding: 6px ${theme.space[3]};
  }
`;

/**
 * 내 답장 속 표 링크. 사람이 준 실제 표 주소의 뒷부분을 줄여 보여준다.
 * 글자는 HTML이 아니라 CSS content로 그린다. 검색엔진이 본문 글자로 읽지 않게 하려는 것이고,
 * 눌러도 아무 데도 가지 않는 그림이라 링크(a)로 만들지 않는다. 파란 글자색은 캡처의 링크 색(#3371D5)이다.
 */
const LinkText = styled.span`
  &::before {
    content: "https://timetable2.com/table/f2d4…";
    color: #3371d5;
    text-decoration: underline;
    white-space: nowrap;
  }
`;

const Builder = styled.section`
  background: white;
  border: 1px solid ${theme.text.gamma[900]};
  border-radius: ${theme.radius.xl};
  padding: 34px;

  /* 좌우 패딩을 space[3]으로 맞춰야 DateGridScroll의 bleed가 정확히 상쇄된다. */
  @media (max-width: 639px) {
    padding: ${theme.space[4]} ${theme.space[3]} ${theme.space[6]};
    border-radius: 18px;
  }

  /* 좌우로 갈라진 화면에서 폼 칸이 가장 좁을 때(440px)도 후보 날짜 격자가 잘리지 않게 여백을 줄인다. */
  @media (min-width: ${theme.breakpoint.lg}) {
    grid-area: form;
    padding: 28px;
  }
`;

const FieldBlock = styled.div`
  margin-bottom: 26px;
`;

const FieldLabel = styled.label`
  display: block;
  font-family: "Pretendard-Bold";
  font-size: ${theme.font.size.body};
  color: ${theme.text.gamma[100]};
  margin-bottom: 10px;
`;

const Hint = styled.p`
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};
  margin: ${theme.space[2]} 0 0;

  /* 버튼 아래 안내는 비어 있을 때가 많다. 알림 영역(role=status)은 남겨 두되 자리는 차지하지 않는다. */
  &:empty {
    margin: 0;
  }
`;

/* 오류는 색만으로 말하지 않는다. 아이콘과 문장을 함께 붙인다. */
const Warning = styled.p`
  display: flex;
  align-items: center;
  gap: ${theme.space[1]};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.small};
  color: ${theme.color.primary};
  margin: ${theme.space[2]} 0 0;
`;

const SrOnly = styled.span`
  ${theme.styles.srOnly}
`;

/**
 * 빠른 제목 칩. 선택이 아니라 동작이다. 누른 뒤 제목을 고치면 "선택됨" 표시가 거짓말이 되므로
 * 지속 선택 상태(aria-pressed)를 두지 않는다. 현재 값은 입력칸이 보여준다.
 * 한 줄로 두고 넘치면 가로로 민다. 두 줄이 되면 첫 화면에서 입력창 아래가 밀린다.
 * 가려진 쪽 끝은 흐리게 해 더 있다는 것을 보여준다($fadeStart·$fadeEnd).
 * 스크롤 상자는 칩의 초점 테두리(바깥 4px)를 자르므로 사방 4px 안쪽 여백을 두고 같은 만큼 바깥 여백을 당긴다.
 * 좌우로 갈라진 넓은 화면은 첫 화면 높이에 여유가 있어 줄을 바꾼다(마우스로는 옆으로 밀기 어렵다).
 */
const QUICK_FADE = "28px";
const QuickTitles = styled.div`
  display: flex;
  gap: ${theme.space[2]};
  margin: calc(${theme.space[3]} - 4px) -4px -4px;
  padding: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 ${({ $fadeStart }) => ($fadeStart ? QUICK_FADE : "0px")},
    #000 calc(100% - ${({ $fadeEnd }) => ($fadeEnd ? QUICK_FADE : "0px")}),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 ${({ $fadeStart }) => ($fadeStart ? QUICK_FADE : "0px")},
    #000 calc(100% - ${({ $fadeEnd }) => ($fadeEnd ? QUICK_FADE : "0px")}),
    transparent 100%
  );

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: ${theme.breakpoint.lg}) {
    flex-wrap: wrap;
    overflow-x: visible;
    -webkit-mask-image: none;
    mask-image: none;
  }
`;

const QuickTitle = styled.button`
  flex-shrink: 0;
  min-height: 34px;
  padding: 0 ${theme.space[3]};
  border: 0;
  border-radius: ${theme.radius.pill};
  background: ${theme.text.gamma[900]};
  color: ${theme.text.gamma[200]};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.small};
  white-space: nowrap;
  cursor: pointer;
  transition:
    background ${theme.duration.fast} ${theme.easing.standard},
    transform 100ms ${theme.easing.standard};

  &:hover:not(:disabled) {
    background: ${theme.text.gamma[800]};
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }

  &:disabled {
    color: ${theme.text.gamma[600]};
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    &:active:not(:disabled) {
      transform: none;
    }
  }
`;

/* 글자 수는 입력칸 안 오른쪽 끝에 둔다. 입력 글자가 겹치지 않도록 입력칸 오른쪽 여백을 넓힌다. */
const TitleField = styled.div`
  position: relative;
`;

const TitleCount = styled.span`
  position: absolute;
  top: 50%;
  right: ${theme.space[4]};
  transform: translateY(-50%);
  pointer-events: none;
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
`;

const TitleInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  min-height: 52px;
  padding: 0 64px 0 16px;
  border: 1px solid ${theme.text.gamma[600]};
  border-radius: ${theme.radius.md};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.bodyLg};
  color: ${theme.text.gamma[100]};
  background: ${theme.color.surface};
  transition: border-color ${theme.duration.fast} ${theme.easing.standard};
  /* 제목 자리에 입력 유도 문구가 떠 있는 동안 테두리를 강조색으로. 반짝이지 않고 색만 바뀐다. */
  ${({ $nudge }) => ($nudge ? `border-color: ${theme.color.primary};` : "")}

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
    border-color: ${theme.color.primary};
  }
`;

/* ---- 후보 날짜: 요일 고정 7열 달력 격자 ----
   날짜 개수가 5·7·10으로 변해도 요일 열이 고정이라 그림이 흔들리지 않는다. */

const DateFieldset = styled.fieldset`
  border: 0;
  padding: 0;
  margin: 0 0 ${theme.space[6]};
  min-width: 0;
`;

const DateLegend = styled.legend`
  padding: 0;
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.label};
  color: ${theme.text.gamma[100]};
  margin-bottom: ${theme.space[2]};
`;

const DateSummary = styled.p`
  margin: ${theme.space[2]} 0 ${theme.space[3]};
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};

  b {
    font-family: ${theme.font.family.bold};
    color: ${theme.text.gamma[100]};
  }
`;

/* 오류일 때만 옅은 면으로 감싼다. padding은 두 상태가 같아 격자가 밀리지 않는다. */
const DateCalendar = styled.div`
  padding: ${theme.space[3]};
  border-radius: ${theme.radius.lg};
  transition:
    background ${theme.duration.fast} ${theme.easing.standard},
    box-shadow ${theme.duration.fast} ${theme.easing.standard};

  ${({ $invalid }) =>
    $invalid &&
    `
    background: ${theme.color.primarySurface};
    box-shadow: inset 0 0 0 1px ${theme.color.primary};
  `}

  @media (max-width: 639px) {
    margin-inline: calc(-1 * ${theme.space[3]});
  }
`;

/* 테두리도 헤어라인도 없다. quick-create 캘린더와 같은 공기감. */
const DateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  column-gap: ${theme.space[2]};
  row-gap: ${theme.space[2]};
  min-width: 300px; /* 7 × 36px + 6 × 8px */
  max-width: 436px;
  margin: 0 auto;

  @media (min-width: ${theme.breakpoint.sm}) {
    column-gap: ${theme.space[3]};
    row-gap: ${theme.space[3]};
    min-width: 324px;
  }
`;

const WeekControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[3]};
  margin-top: ${theme.space[3]};
`;

const WeekButton = styled.button`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: ${theme.radius.pill};
  background: white;
  border: 1px solid ${theme.text.gamma[600]};
  color: ${theme.text.gamma[300]};
  transition:
    background ${theme.duration.fast} ${theme.easing.standard},
    border-color ${theme.duration.fast} ${theme.easing.standard};

  &:hover:not(:disabled) {
    background: ${theme.color.primarySurface};
    border-color: ${theme.color.primary};
    color: ${theme.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }

  &:disabled {
    background: ${theme.text.gamma[950]};
    border-color: ${theme.text.gamma[800]};
    color: ${theme.text.gamma[700]};
    cursor: not-allowed;
  }
`;

const WeekCount = styled.span`
  min-width: 40px;
  text-align: center;
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.label};
  color: ${theme.text.gamma[100]};
`;

/* 격자가 좁은 화면에서 넘칠 때만 스크롤한다.
   좌우 4px 여백은 셀의 히트 영역(±4px)이 삐져나와 가짜 스크롤을 만들지 않게 하는 자리다. */
const DateGridScroll = styled.div`
  overflow-x: auto;
  /* 셀 히트 영역이 좌우로 4px 씩 삐져나온다. 여유를 줘야 1px 짜리 가짜 스크롤바가 안 생긴다. */
  padding-inline: ${theme.space[2]};
`;

const DayHead = styled.div`
  min-height: 20px;
  text-align: center;
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.label};
  color: ${({ $col }) =>
    $col === 6
      ? theme.color.primary
      : $col === 5
        ? theme.color.weekdaySat
        : theme.text.gamma[400]};
`;

const DatePad = styled.div``;

/**
 * 원형 셀. 셀 = 원(정사각 비율) + 아래 캡션 한 줄.
 * 캡션 자리는 비어 있어도 예약해 두어 행 높이가 흔들리지 않는다.
 */
const DateCell = styled(motion.button, {
  shouldForwardProp: (p) => !p.startsWith("$"),
})`
  display: grid;
  grid-template-rows: auto auto;
  gap: 2px;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  border-radius: ${theme.radius.md};
  -webkit-tap-highlight-color: transparent;
  /* 드래그 중 브라우저가 스크롤을 가져가지 않게 한다. 모바일에서 필수다. */
  touch-action: none;

  /* 원을 키우지 않고 히트 영역만 좌우로 넓힌다. gap의 절반이라 이웃과 겹치지 않는다. */
  ${theme.styles.hitArea("0px", theme.space[1])}

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }

  /* 컴포넌트 셀렉터는 emotion babel 플러그인이 있어야 동작한다. 여기서는 안 쓴다. */
  @media (hover: hover) {
    &:hover:not(:disabled) [data-circle] {
      box-shadow: ${({ $active }) =>
        $active
          ? `0 0 0 2px ${theme.color.surface}, 0 0 0 4px ${theme.color.primary}`
          : `inset 0 0 0 2px ${theme.text.gamma[600]}`};
    }
  }
`;

const CircleWrap = styled.span`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 52px;
  margin-inline: auto;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  transition: box-shadow ${theme.duration.fast} ${theme.easing.standard};
`;

const SelectedCircle = styled(motion.span)`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: ${theme.color.primary};
  pointer-events: none;
`;

const DateNumber = styled.span`
  position: relative;
  z-index: 1;
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.bodyLg};
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: ${({ $active }) => ($active ? theme.color.surface : theme.text.gamma[200])};
  transition: color ${theme.duration.fast} ${theme.easing.standard};
  pointer-events: none;
`;

/* height가 아니라 min-height — 200% 확대에서 글자가 잘리지 않게. */
const DateTag = styled.span`
  min-height: 16px;
  line-height: 1.2;
  text-align: center;
  font-size: ${theme.font.size.footnote};
  word-break: keep-all;
  font-family: ${({ $strong }) =>
    $strong ? theme.font.family.semiBold : theme.font.family.medium};
  color: ${({ $strong }) => ($strong ? theme.text.gamma[300] : theme.text.gamma[400])};
`;

const TimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[3]};
  font-family: ${theme.font.family.regular};
  color: ${theme.text.gamma[400]};
`;

/* 모바일에서는 두 셀렉트가 남는 폭을 반씩 나눠 갖는다. */
const TimeSelect = styled.select`
  min-height: 48px;
  padding: 0 14px;

  @media (max-width: 480px) {
    flex: 1;
    min-width: 0;
  }
  border: 1px solid ${theme.text.gamma[600]};
  border-radius: ${theme.radius.md};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.body};
  color: ${theme.text.gamma[100]};
  background: ${theme.color.surface};
  cursor: pointer;
  transition: border-color ${theme.duration.fast} ${theme.easing.standard};

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
    border-color: ${theme.color.primary};
  }
`;

/* 미리보기는 만들어질 화면을 그대로 축소한 그림이다.
   실제 /table 페이지의 좌(시간표)-우(헤더·순위·참여자) 구성을 그대로 따른다. */
const PreviewCard = styled.div`
  position: relative; /* 토스트가 이 카드 안에 갇히도록 */
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: ${theme.radius.lg};
  overflow: hidden;
  background: ${theme.color.surface};
`;

/**
 * "미리보기" 표시. 박스 왼쪽 위 모서리에 붙은 탭이다(눈 아이콘 + 글자).
 * 알약 배지 대신 위·왼쪽은 박스 테두리에 맞닿고 오른쪽 아래만 둥글게 해 박스의 일부처럼 보이게 한다.
 * 박스가 overflow: hidden이라 박스 모서리 곡선에 맞춰 잘린다.
 */
const MockTag = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px 5px 10px;
  border-right: 1px solid ${theme.text.gamma[800]};
  border-bottom: 1px solid ${theme.text.gamma[800]};
  border-radius: 0 0 ${theme.radius.sm} 0;
  background: ${theme.text.gamma[950]};
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.caption};
  line-height: 1.3;
  letter-spacing: 0.02em;
  color: ${theme.text.gamma[400]};
`;

const PreviewLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: ${theme.space[4]};
  padding: ${theme.space[3]};

  @media (min-width: ${theme.breakpoint.sm}) {
    padding: ${theme.space[5]};
  }

  /* 오른쪽 칸(순위·참여자)은 1280px부터만 보인다. 그보다 좁은 화면에서 두 칸으로 나누면
     오른쪽 칸 자리가 빈 채로 남아 시간표가 왼쪽으로 쏠렸다(1024px에서 720px 중 407px만 사용). */
  @media (min-width: ${theme.breakpoint.xl}) {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  }
`;

/* 카드 안에 또 카드를 두지 않는다. 넓은 화면에서 두 칸은 세로선 하나로 나눈다. */
const PreviewPane = styled.div`
  padding: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ $side }) => ($side ? "10px" : "8px")};
  align-items: ${({ $side }) => ($side ? "center" : "stretch")};

  @media (min-width: ${theme.breakpoint.xl}) {
    border-left: ${({ $side }) => ($side ? `1px solid ${theme.text.gamma[900]}` : "0")};
    padding-left: ${({ $side }) => ($side ? theme.space[4] : "0")};
  }

  /* 1280px 미만은 오른쪽 칸 없이 시간표만 남긴다. */
  @media (max-width: ${parseInt(theme.breakpoint.xl, 10) - 1}px) {
    display: ${({ $side }) => ($side ? "none" : "flex")};
  }
`;

/**
 * 모서리 "미리보기" 탭 자리를 제목 첫 줄에서만 비운다. 긴 모임 이름이 두 줄이 되면 첫 줄이 탭 밑으로
 * 들어가던 것을 막는다. 첫 줄은 탭 오른쪽 공간 안에서 가운데 정렬되어 요일 열의 가운데와 맞는다.
 */
const TabClearance = styled.span`
  float: left;
  width: 42px;
  height: 10px;
`;

const PaneHeading = styled.p`
  margin: 0;
  padding: 0 ${theme.space[8]};
  text-align: center;
  font-family: "Pretendard-SemiBold";
  font-size: ${theme.font.size.body};
  color: ${theme.text.primary};

  em {
    font-style: normal;
    color: ${theme.color.primary};
  }
`;

/* 참여자를 고른 결과를 알리는 라벨이라 장식이 아니다. 본문 대비를 지킨다. */
const PaneNote = styled.p`
  margin: 0 0 2px;
  text-align: center;
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};

  @media (max-width: ${parseInt(theme.breakpoint.xl, 10) - 1}px) {
    display: none;
  }
`;

/* 넓은 콘텐츠는 자기 컨테이너 안에서만 가로 스크롤한다. */
const PreviewScroll = styled.div`
  overflow-x: auto;
`;

/* 날짜가 한둘만 남아도 칸이 과하게 넓어지지 않도록 위쪽을 막아 둔다. */
const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: 40px repeat(${({ $cols }) => $cols || 1}, minmax(30px, 1fr));
  min-width: ${({ $cols }) => 40 + ($cols || 1) * 30}px;
  max-width: ${({ $cols }) => 48 + ($cols || 1) * 64}px;
  margin: 0 auto;

  @media (min-width: ${theme.breakpoint.sm}) {
    grid-template-columns: 48px repeat(${({ $cols }) => $cols || 1}, minmax(36px, 1fr));
    min-width: ${({ $cols }) => 48 + ($cols || 1) * 36}px;
  }
`;

const PreviewCorner = styled.div``;

/* $off = 후보에서 뺐거나 그 주에 없는 날. 열을 지우지 않고 흐리게 남긴다. */
/* 요일 글자는 위 달력(DayHead)과 같은 규칙: 토요일 파랑, 일요일 빨강. 후보 밖 날은 흐리게. */
const PreviewHead = styled.div`
  text-align: center;
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.small};
  color: ${({ $off, $col }) =>
    $off
      ? theme.text.gamma[700]
      : $col === 6
        ? theme.color.primary
        : $col === 5
          ? theme.color.weekdaySat
          : theme.text.gamma[400]};
  padding-bottom: 5px;

  em {
    display: block;
    font-family: ${theme.font.family.bold};
    font-size: ${theme.font.size.bodyLg};
    font-style: normal;
    color: ${({ $off }) => ($off ? theme.text.gamma[700] : theme.text.primary)};
  }
`;

const PreviewRowGroup = styled.div`
  display: contents;
`;

const PreviewTime = styled.div`
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
  text-align: center;
  line-height: 20px;

  @media (min-width: ${theme.breakpoint.sm}) {
    line-height: 30px;
  }

  /* 미리보기 아래 만들기 버튼까지 노트북·태블릿 가로 첫 화면(768~800px)에 들어오게 낮춘다. */
  @media (min-width: ${theme.breakpoint.lg}) {
    line-height: 24px;
  }
`;

/**
 * 실제 /table 의 Cell 과 같은 모양이다 — 오른쪽·아래 헤어라인만 있고 그 밖의 테두리는 없다.
 *
 * 누를 수 있는 칸은 `as="button"` 으로 그려지는데, 버튼 기본 스타일을 지우지 않으면
 * 브라우저가 `2px outset black` 테두리와 패딩을 얹는다. 그것이 검은 테두리의 정체였다.
 */
const PreviewCell = styled.div`
  position: relative;
  height: 20px;
  margin: 0;
  padding: 0;
  font: inherit;
  appearance: none;
  border: 0;
  border-right: 1px solid ${theme.text.gamma[900]};
  border-bottom: 1px solid ${theme.text.gamma[900]};
  background: ${({ $off }) => ($off ? theme.text.gamma[900] : theme.color.surface)};
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  -webkit-tap-highlight-color: transparent;

  @media (min-width: ${theme.breakpoint.sm}) {
    height: 30px;
  }

  @media (min-width: ${theme.breakpoint.lg}) {
    height: 24px;
  }

  /* 키보드로 왔을 때만 보이는 표시. 검정 대신 브랜드색을 쓴다. */
  &:focus-visible {
    outline: 2px solid ${theme.color.primary};
    outline-offset: -2px;
    z-index: 1;
  }
`;

const WeekNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[2]};
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};

  /* 줄인 미리보기(한 줄로 쌓이는 화면)는 골든타임이 있는 주만 보여준다. */
  @media (max-width: ${parseInt(theme.breakpoint.lg, 10) - 1}px) {
    display: none;
  }
`;

const NavButton = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: ${theme.radius.pill};
  background: white;
  border: 1px solid ${theme.text.gamma[600]};
  color: ${theme.text.gamma[300]};

  ${theme.styles.hitArea("8px", "8px")}

  &:hover:not(:disabled) {
    background: ${theme.color.primarySurface};
    border-color: ${theme.color.primary};
    color: ${theme.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }

  &:disabled {
    border-color: ${theme.text.gamma[800]};
    color: ${theme.text.gamma[700]};
    cursor: not-allowed;
  }
`;

/* 실제 시간표의 ColoringLayer와 같은 규칙 — 인원이 많을수록 진해진다. */
const CellFill = styled.div`
  position: absolute;
  inset: 0;
  transition: opacity ${theme.duration.base} ${theme.easing.standard};
  background: ${theme.color.primary};
`;

const shine = keyframes`
  0%   { opacity: 0; transform: translateX(-100%) skewX(-20deg); }
  50%  { opacity: 0.45; }
  100% { opacity: 0; transform: translateX(300%) skewX(-20deg); }
`;

/**
 * 골든타임 칸에만 도는 반짝임(2026-08-02 사람 지시로 계속 돈다).
 * 다른 등장 움직임은 모두 뺐으므로 눈이 가는 곳이 여기 하나뿐이다.
 * 기본 opacity를 0으로 둬야 한다. 1이면 애니메이션 사이에 흰 띠가 칸 위에 남는다.
 * prefers-reduced-motion 에서는 끈다.
 */
const CellShine = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden; /* 칸은 안내 말풍선 때문에 자르지 않으므로, 흰 띠는 여기서 자른다. */

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 100%;
    opacity: 0;
    background: rgba(255, 255, 255, 0.6);
    animation: ${shine} 1.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
    }
  }
`;

/* 골든타임 첫 칸 옆 검은 말풍선. 날짜 숫자를 가리지 않도록 위가 아니라 옆에 둔다. */
const TapHint = styled.span`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === "left" ? "right" : "left")}: calc(100% + 7px);
  z-index: 3;
  transform: translateY(-50%);
  padding: 5px 9px;
  border-radius: 7px;
  background: ${theme.text.gamma[100]};
  color: ${theme.color.surface};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.footnote};
  line-height: 1.1;
  white-space: nowrap;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    ${({ $side }) => ($side === "left" ? "left" : "right")}: 100%;
    margin-top: -5px;
    border: 5px solid transparent;
    border-${({ $side }) => ($side === "left" ? "left" : "right")}-color: ${theme.text.gamma[100]};
  }
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[2]};
  margin-top: 10px;
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};

  @media (max-width: ${parseInt(theme.breakpoint.lg, 10) - 1}px) {
    display: none;
  }
`;

const LegendBar = styled.span`
  width: 88px;
  height: 8px;
  border-radius: ${theme.radius.pill};
  /* 칸 농도(인원 수)를 읽는 눈금이라 같은 색의 농도만 바꾼다. */
  background: linear-gradient(90deg, ${theme.color.primary}33, ${theme.color.primary});
`;

const LegendSwatch = styled.span`
  width: 16px;
  height: 8px;
  border-radius: ${theme.radius.pill};
  background: ${theme.color.primary};
`;

const MiniBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${theme.radius.pill};
  background: ${theme.color.primarySurface};
  color: ${theme.color.primary};
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.footnote};
`;

const MiniTitle = styled.p`
  margin: 0;
  text-align: center;
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.title3};
  color: ${theme.text.primary};
  word-break: keep-all;
`;

/* 카드 전체가 버튼이다. 안의 '복사하기'는 시각 요소일 뿐이라 중첩 버튼을 두지 않는다. */
const MiniInvite = styled.button`
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  cursor: pointer;
  background: ${theme.color.primarySurface};
  border: 1px solid ${theme.color.primary};
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: background ${theme.duration.fast} ${theme.easing.standard};

  &:hover:not(:disabled) {
    background: ${theme.color.primarySurfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }

  &:disabled {
    background: ${theme.text.gamma[950]};
    border-color: ${theme.text.gamma[800]};
    cursor: not-allowed;
  }
`;

const MiniInviteLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.footnote};
  color: ${theme.color.primary};
`;

const MiniInviteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 8px;
  background: ${theme.color.surface};
  border: 1px solid ${theme.color.primary};
  border-radius: 7px;
`;

const MiniInviteUrl = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: "Pretendard-Regular";
  font-size: 10px;
  color: ${theme.text.gamma[500]};
`;

const MiniCopy = styled.span`
  flex-shrink: 0;
  padding: 4px 9px;
  border-radius: 6px;
  background: ${theme.color.primary};
  color: white;
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.footnote};
`;

const MiniResult = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.space[2]};
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  padding: 0 ${theme.space[3]};
  cursor: pointer;
  border: 1px solid ${theme.text.gamma[600]};
  border-radius: ${theme.radius.sm};
  background: white;
  color: ${theme.color.primary};
  transition:
    background ${theme.duration.fast} ${theme.easing.standard},
    border-color ${theme.duration.fast} ${theme.easing.standard};

  em {
    flex-shrink: 0;
    font-style: normal;
    font-family: ${theme.font.family.medium};
    font-size: ${theme.font.size.footnote};
    color: ${theme.text.gamma[400]};
    white-space: nowrap;
  }

  &:hover:not(:disabled) {
    background: ${theme.color.primarySurface};
    border-color: ${theme.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }

  &:disabled {
    background: ${theme.text.gamma[950]};
    color: ${theme.text.gamma[600]};
    cursor: not-allowed;
  }
`;

/* 예전에는 버튼 안의 모든 span에 flex: 1을 줘서 화살표(Chevron)도 남는 폭을 반씩 가져갔다.
   그래서 글자 칸이 63px로 줄어 "골든타임 순 / 위"로 줄이 바뀌었다. 글자 칸만 늘리고 줄을 바꾸지 않는다. */
const MiniResultLabel = styled.span`
  flex: 1;
  min-width: 0;
  text-align: left;
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[200]};
  white-space: nowrap;
`;

/* 회전은 연출이 아니라 상태 표시다. reduced-motion에서도 각도는 유지하고 전환만 끈다. */
const Chevron = styled.span`
  display: flex;
  align-items: center;
  color: ${theme.text.gamma[500]};
  transform: rotate(${({ $open }) => ($open ? 90 : 0)}deg);
  transition: transform ${theme.duration.fast} ${theme.easing.standard};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const RankingPanel = styled(motion.div)`
  width: 100%;
  overflow: hidden;
`;

const RankingInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]};
  padding: ${theme.space[2]} 0 0;
`;

const RankRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[1]};
  padding: ${theme.space[3]};
  border-radius: ${theme.radius.sm};
  background: ${({ $top }) => ($top ? theme.color.primarySurface : "white")};
  border: 1px solid ${({ $top }) => ($top ? theme.color.primary : theme.text.gamma[800])};
`;

const RankTop = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[2]};
`;

/* 순위는 색이 아니라 배지 숫자로 전달된다. */
const RankBadge = styled.span`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.radius.pill};
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.footnote};
  background: ${({ $top }) => ($top ? theme.color.primary : theme.text.gamma[900])};
  color: ${({ $top }) => ($top ? "white" : theme.text.gamma[300])};
`;

const RankTime = styled.span`
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.small};
  font-variant-numeric: tabular-nums;
  color: ${theme.text.gamma[100]};
  word-break: keep-all;
`;

const RankGauge = styled.div`
  height: 6px;
  border-radius: ${theme.radius.pill};
  background: ${theme.text.gamma[800]};
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: ${theme.radius.pill};
    background: ${theme.color.primary};
  }
`;

const RankCaption = styled.span`
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
`;

const RankMembers = styled.span`
  display: flex;
  align-items: center;
  gap: ${theme.space[1]};
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
  word-break: keep-all;
`;

const RankEmpty = styled.p`
  margin: 0;
  padding: ${theme.space[3]};
  text-align: center;
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};
`;

const MiniMembers = styled.div`
  width: 100%;
  box-sizing: border-box;
  border-top: 1px solid ${theme.text.gamma[900]};
  padding: 10px;
`;

const MiniSectionTitle = styled.p`
  margin: 0 0 8px;
  font-family: "Pretendard-Bold";
  font-size: 13px;
  color: ${theme.text.primary};
`;

const MiniChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  column-gap: ${theme.space[2]};
  row-gap: ${theme.space[4]}; /* 히트 영역이 위아래 8px씩 넓어져 겹치지 않게 */
`;

/* 시각 높이는 28px이지만 히트 영역은 44px을 확보한다. */
const MiniChip = styled.button`
  position: relative;
  height: 32px;
  padding: 0 ${theme.space[3]};
  cursor: pointer;
  border-radius: ${theme.radius.pill};
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.small};
  background: ${({ $active }) => ($active ? theme.color.primary : "white")};
  border: 1px solid ${({ $active }) => ($active ? theme.color.primary : theme.text.gamma[600])};
  color: ${({ $active }) => ($active ? "white" : theme.text.gamma[400])};
  transition:
    background ${theme.duration.fast} ${theme.easing.standard},
    border-color ${theme.duration.fast} ${theme.easing.standard},
    color ${theme.duration.fast} ${theme.easing.standard},
    transform 100ms ${theme.easing.standard};

  ${theme.styles.hitArea("6px", "2px")}

  &:hover:not(:disabled) {
    background: ${({ $active }) => ($active ? theme.color.primary : theme.color.primarySurface)};
    border-color: ${theme.color.primary};
    color: ${({ $active }) => ($active ? "white" : theme.color.primary)};
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    &:active:not(:disabled) {
      transform: none;
    }
  }
`;

const PreviewEmpty = styled.p`
  text-align: center;
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};
  margin: 0;
  padding: ${theme.space[8]} ${theme.space[4]};
`;

/* 카드 안에 갇힌 토스트. PreviewCard의 overflow:hidden이 경계를 만든다. */
const Toast = styled(motion.div)`
  position: absolute;
  left: 50%;
  bottom: ${theme.space[3]};
  transform: translateX(-50%);
  max-width: calc(100% - ${theme.space[6]});
  display: flex;
  align-items: flex-start;
  gap: ${theme.space[2]};
  padding: ${theme.space[2]} ${theme.space[3]};
  border-radius: ${theme.radius.md};
  background: ${theme.text.gamma[100]};
  color: white;
  box-shadow: ${theme.shadow.toast};
  z-index: 5;
`;

const ToastText = styled.span`
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  line-height: ${theme.font.lineHeight.snug};
  word-break: keep-all;
`;

const ToastClose = styled.button`
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 0;
  cursor: pointer;
  color: white;
  border-radius: ${theme.radius.pill};

  ${theme.styles.hitArea("12px", "12px")}

  &:hover {
    background: rgba(255, 255, 255, 0.16);
  }

  /* 어두운 표면 위에서는 focusRing이 보이지 않는다. 여기만 흰 링을 쓴다. */
  &:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }
`;

const CreateButton = styled.button`
  width: 100%;
  min-height: 56px;
  border: none;
  border-radius: ${theme.radius.md};
  background: ${theme.color.primary};
  color: ${theme.color.surface};
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.bodyLg};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[2]};
  cursor: pointer;
  transition: filter ${theme.duration.fast} ${theme.easing.standard};

  &:hover:not(:disabled) {
    filter: brightness(0.95);
  }

  &:active:not(:disabled) {
    filter: brightness(0.9);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 3px;
  }

`;

const Faq = styled("section", withRailAttr)`
  max-width: 720px;
  margin: 56px auto 0;

  /* 제목만 가운데. 질문 목록은 읽기 쉽게 왼쪽 정렬 그대로 둔다(2026-09-27 사람 지시). */
  h2 {
    font-family: ${theme.font.family.bold};
    font-size: ${theme.font.size.title3};
    color: ${theme.text.gamma[100]};
    margin: 0 0 ${theme.space[2]};
    text-align: center;
  }

  a {
    color: ${theme.color.primary};
    text-decoration: underline;
  }
`;

const FaqItem = styled.details`
  border-bottom: 1px solid ${theme.text.gamma[900]};

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.space[3]};
    padding: ${theme.space[4]} 0;
    cursor: pointer;
    list-style: none;
    font-family: ${theme.font.family.semiBold};
    font-size: ${theme.font.size.body};
    color: ${theme.text.gamma[100]};
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
    border-radius: ${theme.radius.sm};
  }

  summary svg {
    flex-shrink: 0;
    color: ${theme.text.gamma[400]};
    transition: transform ${theme.duration.fast} ${theme.easing.standard};
  }

  &[open] summary svg {
    transform: rotate(180deg);
  }

  p {
    margin: 0 0 ${theme.space[4]};
    font-family: ${theme.font.family.regular};
    font-size: ${theme.font.size.body};
    line-height: ${theme.font.lineHeight.relaxed};
    color: ${theme.text.gamma[400]};
  }

  @media (prefers-reduced-motion: reduce) {
    summary svg {
      transition: none;
    }
  }
`;

const FaqMore = styled.p`
  margin: ${theme.space[4]} 0 0;
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};
`;

/* ---- 미리보기: 칸을 눌렀을 때 나오는 명단 (실제 /table 의 셀 팝업과 같은 정보) ---- */

/**
 * 색은 강조색 하나만 쓴다. 가능/불가는 초록·회색 칩 대신 시간표 칸과 같은 모양의 작은 네모로 구분하고,
 * 이름은 무채색 태그로 둔다. (이전 랜딩은 Tailwind 기본 초록 팔레트와 분홍 띠·분홍 머리가 겹쳐 있었다.)
 */
const CellPopup = styled(motion.div)`
  position: fixed;
  z-index: 9999;
  width: ${POPUP_WIDTH}px;
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: ${theme.radius.md};
  overflow: hidden;
  background: ${theme.color.surface};
  box-shadow: ${theme.shadow.card};
`;

const CellInfoHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.space[2]};
  padding: ${theme.space[3]} ${theme.space[4]};
  border-bottom: 1px solid ${theme.text.gamma[900]};
`;

const CellInfoTime = styled.p`
  margin: 0;
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.label};
  color: ${theme.text.gamma[100]};
  word-break: keep-all;
`;

const CellInfoGolden = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: ${theme.space[1]} 0 0;
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
`;

const CellInfoClose = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 0;
  cursor: pointer;
  border-radius: ${theme.radius.pill};
  color: ${theme.text.gamma[400]};

  ${theme.styles.hitArea("12px", "12px")}

  &:hover:not(:disabled) {
    background: ${theme.text.gamma[900]};
  }
  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const CellInfoRow = styled.div`
  padding: ${theme.space[3]} ${theme.space[4]};

  & + & {
    border-top: 1px solid ${theme.text.gamma[900]};
  }
`;

const CellInfoLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: ${theme.space[2]};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[200]};
`;

/* 시간표 칸을 줄인 네모. 가능 = 칠한 칸(강조색), 불가 = 빈 칸. */
const LabelMark = styled.span`
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: ${({ $can }) => ($can ? theme.color.primary : theme.text.gamma[800])};
`;

const NameChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.space[1]};
`;

const NameChip = styled.span`
  padding: 2px ${theme.space[2]};
  border-radius: 4px;
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  ${({ $can }) =>
    $can
      ? `background: ${theme.text.gamma[900]}; color: ${theme.text.gamma[200]};`
      : `color: ${theme.text.gamma[400]}; box-shadow: inset 0 0 0 1px ${theme.text.gamma[900]};`}
`;

const NoName = styled.span`
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
`;

/* ---- 만들기 전 확인 창(시간 잠금) · 완료 창 ---- */

/* 두 창이 같이 쓴다. 사이트 헤더(z-index 1000)보다 위에 뜬다. */
const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.space[4]};
  background: rgba(0, 0, 0, 0.45);
`;

/* 시간표가 길어지면 본문만 스크롤하고 버튼은 바닥에 붙어 있어야 한다.
   안 그러면 '링크 만들기'가 화면 밖으로 밀려 안 보인다. */
const LockModal = styled(motion.div)`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - ${theme.space[8]});
  border-radius: ${theme.radius.lg};
  background: ${theme.color.surface};
  box-shadow: ${theme.shadow.popover};
  overflow: hidden;

  &:focus {
    outline: none;
  }
`;

const LockBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${theme.space[6]} ${theme.space[6]} ${theme.space[5]};

  @media (max-width: 480px) {
    padding: ${theme.space[5]} ${theme.space[4]} ${theme.space[4]};
  }
`;

const LockHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.space[3]};
  margin-bottom: ${theme.space[4]};
`;

const LockTitle = styled.h2`
  margin: 0;
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.title3};
  color: ${theme.text.gamma[100]};
`;

/* 만들어질 내용. 첫 화면에서 날짜·시간을 보지 않고 눌렀어도 여기서 한 번 확인한다. */
const LockSummary = styled.dl`
  display: grid;
  gap: ${theme.space[2]};
  margin: 0 0 ${theme.space[5]};
  padding: ${theme.space[3]} ${theme.space[4]};
  border-radius: ${theme.radius.md};
  background: ${theme.text.gamma[950]};

  div {
    display: flex;
    gap: ${theme.space[3]};
    align-items: baseline;
  }

  dt {
    flex-shrink: 0;
    width: 64px;
    font-family: ${theme.font.family.medium};
    font-size: ${theme.font.size.small};
    color: ${theme.text.gamma[400]};
  }

  dd {
    margin: 0;
    min-width: 0;
    font-family: ${theme.font.family.semiBold};
    font-size: ${theme.font.size.label};
    color: ${theme.text.gamma[100]};
    word-break: keep-all;
    overflow-wrap: anywhere;
    font-variant-numeric: tabular-nums;
  }
`;

/* 시간 잠금(선택) 묶음. 요약과 구분되게 테두리 한 줄로 감싼다. */
const LockSection = styled.div`
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: ${theme.radius.md};
`;

const LockAccordion = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.space[3]};
  width: 100%;
  padding: ${theme.space[3]} ${theme.space[4]};
  border: 0;
  border-radius: ${theme.radius.md};
  background: none;
  cursor: pointer;
  text-align: left;

  &:hover:not(:disabled) {
    background: ${theme.text.gamma[950]};
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const LockIcon = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${theme.radius.sm};
  background: ${theme.text.gamma[900]};
  color: ${theme.text.gamma[300]};
`;

const LockText = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const LockName = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.space[1]} ${theme.space[2]};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.body};
  color: ${theme.text.gamma[100]};
`;

const LockOptional = styled.span`
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
`;

const LockCount = styled.span`
  padding: 1px ${theme.space[2]};
  border-radius: 4px;
  background: ${theme.text.gamma[200]};
  color: ${theme.color.surface};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.footnote};
`;

const LockDesc = styled.span`
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};
  word-break: keep-all;
`;

/* 회전은 상태 표시다. reduced-motion에서도 각도는 유지하고 전환만 끈다. */
const AccordionIcon = styled.span`
  flex-shrink: 0;
  display: flex;
  color: ${theme.text.gamma[400]};
  transition: transform ${theme.duration.base} ${theme.easing.standard};
  transform: rotate(${({ $open }) => ($open ? 180 : 0)}deg);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const LockGridWrap = styled(motion.div)`
  overflow: hidden;
`;

const LockGridInner = styled.div`
  padding: 0 ${theme.space[4]} ${theme.space[4]};
`;

const LockGridHint = styled.p`
  margin: 0 0 ${theme.space[3]};
  padding-top: ${theme.space[3]};
  border-top: 1px solid ${theme.text.gamma[900]};
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};
`;

const LockActions = styled.div`
  flex-shrink: 0;
  display: flex;
  gap: ${theme.space[2]};
  padding: ${theme.space[4]} ${theme.space[6]} ${theme.space[6]};
  border-top: 1px solid ${theme.text.gamma[900]};
  background: ${theme.color.surface};

  @media (max-width: 480px) {
    padding: ${theme.space[3]} ${theme.space[4]} ${theme.space[4]};
  }
`;

const LockGhost = styled.button`
  flex-shrink: 0;
  min-height: 56px;
  padding: 0 ${theme.space[5]};
  cursor: pointer;
  border: 1px solid ${theme.text.gamma[600]};
  border-radius: ${theme.radius.md};
  background: ${theme.color.surface};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.body};
  color: ${theme.text.gamma[300]};

  &:hover:not(:disabled) {
    background: ${theme.text.gamma[950]};
  }
  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

/* 완료 창. 가운데 정렬, 주 버튼(공유 또는 복사) 하나에 눈이 가게 한다. */
const DoneModal = styled(motion.div)`
  width: 100%;
  max-width: 420px;
  max-height: calc(100vh - ${theme.space[8]});
  overflow-y: auto;
  box-sizing: border-box;
  padding: ${theme.space[8]} ${theme.space[6]} ${theme.space[6]};
  border-radius: ${theme.radius.lg};
  background: ${theme.color.surface};
  box-shadow: ${theme.shadow.popover};
  text-align: center;

  &:focus {
    outline: none;
  }

  @media (max-width: 480px) {
    padding: ${theme.space[6]} ${theme.space[4]} ${theme.space[4]};
  }
`;

const DoneMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-bottom: ${theme.space[3]};
  border-radius: 50%;
  background: ${theme.color.primarySurface};
  color: ${theme.color.primary};
`;

const DoneTitle = styled.h2`
  margin: 0 0 ${theme.space[2]};
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.title3};
  color: ${theme.text.gamma[100]};
`;

const DoneDesc = styled.p`
  margin: 0 0 ${theme.space[5]};
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.body};
  color: ${theme.text.gamma[400]};
  word-break: keep-all;
`;

/* 주소 한 줄. 읽기 전용 입력칸이라 자동 복사가 막혀도 길게 눌러(또는 선택해) 직접 복사할 수 있다. */
const LinkField = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[2]};
  padding: ${theme.space[1]} ${theme.space[1]} ${theme.space[1]} ${theme.space[3]};
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: ${theme.radius.md};
  background: ${theme.text.gamma[950]};
`;

const LinkInput = styled.input`
  flex: 1;
  min-width: 0;
  min-height: 40px;
  padding: 0;
  border: 0;
  background: none;
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[200]};
  text-overflow: ellipsis;

  &:focus-visible {
    outline: none;
  }
`;

const LinkCopy = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 40px;
  padding: 0 ${theme.space[3]};
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: ${theme.radius.sm};
  background: ${theme.color.surface};
  cursor: pointer;
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.small};
  color: ${({ $done }) => ($done ? theme.text.gamma[100] : theme.text.gamma[300])};

  &:hover {
    background: ${theme.text.gamma[950]};
  }
  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }
`;

const DoneStatus = styled.p`
  min-height: 18px;
  margin: ${theme.space[2]} 0 ${theme.space[4]};
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.small};
  line-height: ${theme.font.lineHeight.snug};
  color: ${({ $failed }) => ($failed ? theme.color.primary : theme.text.gamma[400])};
  word-break: keep-all;
`;

const DoneActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]};
`;

const DoneSecondary = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[1]};
  min-height: 48px;
  border: 0;
  border-radius: ${theme.radius.md};
  background: none;
  cursor: pointer;
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.body};
  color: ${theme.text.gamma[300]};

  &:hover {
    background: ${theme.text.gamma[950]};
  }
  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }
`;
