import styled from "@emotion/styled/macro";
import { keyframes, css } from "@emotion/react";
import theme from "../../theme";
import InviteSection from "./components/InviteSection";
import DashboardPanel from "./components/DashboardPanel";
import PersonalSchedule from "./components/PersonalSchedule";
import JoinForm from "./components/JoinForm";
import RankingModal from "./components/RankingModal";
import { useEffect, useState, useCallback, useMemo, useRef, Fragment, Suspense } from "react";
import { useParams } from "react-router-dom";
import { getTableInfo } from "../../api/table";
import { getAllSchedule } from "../../api/user";
import Loader from "./components/Loading";
import NotFoundTable from "../NotFoundTable";
import Seo from "../../Seo";
import { trackVisit } from "../../api/visit";
import {
  trackEvent, trackEventKeepalive, EVENTS, trackClarityEvent, CLARITY_EVENTS, setActiveTableUi, getActiveTableUi,
} from "../../utils/analytics";
import { experimentVisitorId, resolveTableUi, switchTableUi, tagTableUi } from "../../utils/tableExperiment";
import { getTableAbState } from "../../api/experiment";
import useUiSegment from "./useUiSegment";
import { clearTableScopedStorage, readStorage, writeStorage } from "../../utils/storage";
import { readTableState, writeTableState, timeInfoOf, validCellsOf } from "../../utils/tableSession";
import TimeGridModal from "./components/TimeGridModal";
import { AnimatePresence, motion } from "framer-motion";
import { FiUserPlus, FiShare2, FiCalendar, FiGrid, FiUsers, FiAward, FiChevronRight } from "react-icons/fi";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import GroupTimeGrid from "./components/GroupTimeGrid";
import AdSense from "../../component/AdSense";
import Arrow from "../../assets/svg/Arrow";
import TableUiBand from "./components/TableUiBand";
import { lazyPage } from "../../utils/lazyPage";

// 새 화면(B)은 B를 볼 때만 받는다(기존 화면만 보는 사람의 첫 로딩에 넣지 않는다). 조각을 못 받으면 한 번 새로고침하고,
// 그래도 안 되면 앱의 불러오기 실패 안내가 뜬다(utils/lazyPage.js). 기존 화면으로 대신 그리면 B 배정 기록과 어긋난다.
// 표 화면 A/B 2회차: 조각을 못 받아 새로고침하기 직전(chunk_retry)과 끝내 못 받았을 때(chunk_failed)를 남긴다(실험 중일 때만).
const reportBLoadFail = (reason) => {
  const active = getActiveTableUi();
  if (!active) return;
  if (reason === "chunk_retry") trackEventKeepalive(EVENTS.UI_LOAD_FAIL, active.tableId, { reason, uiVersion: "B" });
  else trackEvent(EVENTS.UI_LOAD_FAIL, active.tableId, undefined, { reason, uiVersion: "B" });
};
const TableB = lazyPage(() => import("./b/TableB"), {
  onRetry: () => reportBLoadFail("chunk_retry"),
  onFail: () => reportBLoadFail("chunk_failed"),
});

// component/Header.jsx 의 sticky 헤더 높이. 내 일정 요일·날짜 줄이 그 밑에 붙는다.
const SITE_HEADER_HEIGHT = "72px";

const TOGGLE_TIPS = {
  인원: {
    emoji: "👥",
    description:
      "참여한 멤버들의 일정을 한눈에 확인하세요. 멤버 이름을 클릭하면 해당 멤버만의 가능 시간을 시간표에서 따로 확인할 수 있습니다.",
    tips: [
      {
        title: "멤버 이름을 클릭해보세요",
        desc: "멤버 이름을 클릭하면 해당 멤버의 가능 시간만 시간표에 강조됩니다. 특정 인원의 스케줄을 빠르게 파악할 수 있어요.",
      },
      {
        title: "아직 참여 안 한 분을 초대하세요",
        desc: "상단 '초대' 버튼을 누르면 고유 링크가 복사됩니다. 카카오톡이나 단체 채팅방에 공유해 더 많은 멤버를 초대하세요.",
      },
      {
        title: "참여 인원이 많을수록 정확해요",
        desc: "모든 구성원이 일정을 입력해야 가장 정확한 골든타임을 찾을 수 있습니다. 아직 참여하지 않은 분들에게 독려해보세요.",
      },
    ],
    lastP:
      "모두가 입력을 마치면 '순위' 탭에서 가장 많은 인원이 모일 수 있는 최적의 시간을 바로 확인할 수 있습니다.",
  },
  "내 일정": {
    emoji: "📝",
    description:
      "가능한 시간대를 드래그로 빠르게 선택하세요. PC와 모바일 모두 드래그를 지원합니다.",
    tips: [
      {
        title: "드래그로 한 번에 입력하세요",
        desc: "셀을 드래그하면 여러 시간대를 한꺼번에 선택할 수 있습니다. 하나씩 누를 필요 없이 쭉 밀면 돼요.",
      },
      {
        title: "저장 버튼을 꼭 눌러주세요",
        desc: "시간을 선택한 뒤 반드시 저장 버튼을 눌러야 그룹 시간표에 반영됩니다. 저장하지 않은 시간은 새로고침해도 남지만, 창을 닫으면 사라져요.",
      },
      {
        title: "언제든 수정할 수 있어요",
        desc: "이름과 비밀번호로 다시 로그인하면 기존 일정을 수정하거나 삭제할 수 있습니다. 일정이 바뀌어도 걱정 없어요.",
      },
    ],
    lastP:
      "가능한 시간대를 넉넉하게 선택할수록 그룹 일정 조율이 더 수월해집니다. 애매한 시간도 일단 선택해두는 걸 추천해요.",
  },
  순위: {
    emoji: "🏆",
    description:
      "가장 많은 인원이 모일 수 있는 최적의 시간(골든타임)을 자동으로 계산해 순위별로 보여줍니다.",
    tips: [
      {
        title: "1위가 골든타임이에요",
        desc: "가장 많은 멤버가 참여 가능한 시간대가 상위에 표시됩니다. 1~3위 시간대를 비교해 최적의 약속 시간을 결정하세요.",
      },
      {
        title: "항목을 눌러 참여자를 확인하세요",
        desc: "순위 항목을 클릭하면 해당 시간에 가능한 멤버 목록을 볼 수 있습니다. 누가 되고 안 되는지 한눈에 파악할 수 있어요.",
      },
      {
        title: "모두 입력 후 최종 결정하세요",
        desc: "아직 일정을 입력하지 않은 멤버가 있다면 순위가 바뀔 수 있습니다. 모두가 입력을 마친 뒤 최종 결정을 내리세요.",
      },
    ],
    lastP:
      "순위 화면을 캡처해 단체 채팅방에 공유하면 모두가 한눈에 확인할 수 있어 빠른 의사결정이 가능합니다.",
  },
  default: {
    emoji: "🚀",
    description:
      "회원가입 없이 이름(닉네임)과 비밀번호를 입력해 참여할 수 있습니다. 링크를 가진 사람은 참여자의 이름과 가능 시간을 볼 수 있어요.",
    tips: [
      {
        title: "공유할 이름을 정해주세요",
        desc: "이메일이나 전화번호는 입력하지 않습니다. 함께 일정을 조율할 사람들이 알아볼 수 있는 이름이나 닉네임을 사용하세요.",
      },
      {
        title: "비밀번호로 내 일정 관리",
        desc: "비밀번호를 설정하면 나중에 다시 로그인해 일정을 수정하거나 삭제할 수 있습니다.",
      },
      {
        title: "가능한 시간을 선택하고 저장하세요",
        desc: "이름과 비밀번호 입력 → 시간 선택 → 저장 순서로 일정을 등록하세요. 저장한 시간이 전체 시간표에 반영됩니다.",
      },
    ],
    lastP:
      "참여 후 '내 일정' 탭에서 드래그로 가능 시간을 입력하고, '순위' 탭에서 골든타임을 확인해보세요.",
  },
};

/**
 * 처음 보일 오른쪽 화면. 이 표에 참여한 이름이 없으면 참여 화면, 새 화면에서 보기 모드였으면 인원,
 * 그 밖에는 내 일정(표 화면 A/B 공유 상태 editing).
 */
const screenFor = (tableId) => {
  const storedName =
    readStorage("tableId") === tableId ? readStorage("name") : null;
  if (!storedName) return { screen: "JoinForm", toggle: null };
  const shared = readTableState(tableId);
  if (shared.name === storedName && !shared.editing) return { screen: "DashboardPanel", toggle: "인원" };
  return { screen: "PersonalSchedule", toggle: "내 일정" };
};

// 표가 바뀌면 화면을 새로 만든다. 같은 화면을 이어 쓰면 앞 표의 고른 사람·오른쪽 화면·저장 안 한 칸이
// 새 표의 공유 상태에 섞여 들어갔다(Codex 최종 검증, 2026-09-30).
export default function TimetablePage() {
  const { tableId } = useParams();
  return <TimetablePageView key={tableId} />;
}

function TimetablePageView() {
  const { tableId } = useParams();
  const [tableInfo, setTableInfo] = useState(null);
  const [usersScheduleList, setUsersScheduleList] = useState([]);
  const { startHour, endHour, dates, title, banedCells } = tableInfo || {};
  const [saveButtonState, setSaveButtonState] = useState(true);
  const [scheduleStatus, setScheduleStatus] = useState("loading");
  // 칸마다 되는 사람: 참여자 목록으로 세고 표 칸(범위 안, 막은 칸 밖)만 둔다. 격자·명단 창·순위·최대 인원·
  // 입력 배경·광고 조건이 모두 이 값을 쓴다. 새 화면과 같은 규칙이라 두 화면이 같은 칸·명단·순위를 보인다.
  // 전에는 서버 집계를 그대로 써서 집계가 명단 없이 저장되거나(POST /api/schedules/generation) 목록과 어긋나면
  // 두 화면이 달랐고, 막은 칸·표 밖 칸도 순위에 들어갈 수 있었다(Codex 재검증 2026-09-30).
  const validCells = useMemo(
    () => validCellsOf({ dates, startHour, endHour, banedCells }),
    [dates, startHour, endHour, banedCells],
  );
  const timeInfo = useMemo(() => timeInfoOf(usersScheduleList, validCells), [usersScheduleList, validCells]);
  const [tableLoadError, setTableLoadError] = useState(false);
  // 표 화면 A/B 공유 상태(utils/tableSession.js). 같은 탭에서 새 화면을 쓰다 왔으면 그 상태로 연다.
  const [initialScreen] = useState(() => screenFor(tableId));
  const [rightScreen, setRightScreen] = useState(initialScreen.screen);
  const [selectedToggle, setSelectedToggle] = useState(initialScreen.toggle);
  // 골라 보는 사람들. 여기서는 한 명씩 고르지만 새 화면에서 여러 명을 골라 왔으면 그대로 보여 준다(공유 상태 picks).
  const [picks, setPicks] = useState([]);
  const selectedName = picks.length === 1 ? picks[0] : null;
  const setSelectedName = useCallback((next) => setPicks(next ? [next] : []), []);
  // 보고 있는 주는 여기 한 곳에서 들고 모든 격자에 준다(데스크톱 두 격자·휴대폰 전체 시간표·내 일정이 같은 주).
  const [weekKey, setWeekKey] = useState(() => readTableState(tableId).weekKey);
  const handleWeekChange = useCallback(
    (key) => {
      setWeekKey(key);
      writeTableState(tableId, { weekKey: key });
    },
    [tableId],
  );
  const [name, setName] = useState("");
  const [isValidTableId, setIsValidTableId] = useState(null);
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasClickedMembers, setHasClickedMembers] = useState(() => {
    return readStorage("hasClickedMembers") === "true";
  });

  const trackedTableId = useRef(null);
  const tableRequestId = useRef(0);
  const scheduleRequestId = useRef(0);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isTipsOpen, setIsTipsOpen] = useState(() => {
    const saved = readStorage("isTipsOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    writeStorage("isTipsOpen", JSON.stringify(isTipsOpen));
  }, [isTipsOpen]);

  // 저장 후 테이블 구조 제외, 일정 데이터만 갱신.
  // 칸별 인원은 참여자 목록으로 센다(아래 timeInfo). 서버 집계(GET /api/schedules)는 더 부르지 않는다
  // (새 화면과 같은 자료, Codex 재검증·계획 검토 2026-09-30).
  // keepOnError: 실패해도 목록을 비우지 않는다(저장 직후·다시 불러오기). 참여자가 바뀐 뒤의 갱신은 비워
  // 지워진 사람이 남지 않게 한다.
  const refreshScheduleData = useCallback(async ({ keepOnError = false } = {}) => {
    const requestId = ++scheduleRequestId.current;
    setScheduleStatus("loading");
    try {
      const membersSchedule = await getAllSchedule(tableId);
      if (requestId !== scheduleRequestId.current) return false;

      const members = membersSchedule?.code === 201 ? [] : membersSchedule?.data;
      if (
        membersSchedule?.success === false ||
        ![200, 201].includes(membersSchedule?.code) ||
        !Array.isArray(members)
      ) {
        throw new Error("Schedule data unavailable");
      }
      setUsersScheduleList(members);
      setScheduleStatus("ready");
      return true;
    } catch {
      if (requestId !== scheduleRequestId.current) return false;
      if (!keepOnError) setUsersScheduleList([]);
      setScheduleStatus("error");
      return false;
    }
  }, [tableId]);

  // 새 화면(B)의 1분 새로고침·참여·참여 취소 뒤: 표와 참여자를 조용히 다시 불러온다. 불러오는 동안 화면을 바꾸지 않고,
  // 실패하면 이전 자료를 그대로 둔다(확정 시안과 같다). 참여자 목록은 늦게 온 옛 응답을 버린다(같은 순번을 쓴다).
  // 결과 { ok, users }: 새 화면이 막 참여한 이름이 목록에 들었는지 본다.
  const reloadQuietly = useCallback(async () => {
    const requestId = ++scheduleRequestId.current;
    const [tableRes, membersSchedule] = await Promise.all([getTableInfo(tableId), getAllSchedule(tableId)]);
    if (requestId !== scheduleRequestId.current) return { ok: false, users: [] };
    const tableData = tableRes?.data;
    const members = membersSchedule?.code === 201 ? [] : membersSchedule?.data;
    const tableOk =
      tableRes?.success === true &&
      tableData?.tableId === tableId &&
      Array.isArray(tableData?.dates) &&
      tableData.dates.length > 0;
    const usersOk =
      membersSchedule?.success !== false && [200, 201].includes(membersSchedule?.code) && Array.isArray(members);
    if (!tableOk || !usersOk) {
      // 이 불러오기에 밀려난 다른 새로고침이 "불러오는 중"으로 남지 않게 한다.
      setScheduleStatus((status) => (status === "loading" ? "error" : status));
      return { ok: false, users: [] };
    }
    setTableInfo(tableData);
    setUsersScheduleList(members);
    setScheduleStatus("ready");
    return { ok: true, users: members };
  }, [tableId]);

  // 저장이 확인되면 내 시간을 먼저 목록에 넣고 다시 불러온다. 다시 불러오기가 늦거나 실패해도
  // 서버가 확인한 저장 시간이 남는다(새 화면과 같다, Codex 계획 검토 2026-09-30).
  // 막 참여해 목록에 아직 없으면 더한다(새 화면도 참여 직후 목록에 먼저 넣는다, Codex 최종 검증 2026-09-30).
  const handleSaveSuccess = useCallback(
    (saved) => {
      if (saved?.name && Array.isArray(saved.availableTimes)) {
        const times = [...saved.availableTimes];
        setUsersScheduleList((list) =>
          list.some((user) => user.name === saved.name)
            ? list.map((user) => (user.name === saved.name ? { ...user, availableTimes: times } : user))
            : [...list, { name: saved.name, availableTimes: times }],
        );
      }
      return refreshScheduleData({ keepOnError: true });
    },
    [refreshScheduleData],
  );

  const fetchAllData = useCallback(async () => {
    const requestId = ++tableRequestId.current;
    ++scheduleRequestId.current;
    setIsValidTableId(null);
    setTableLoadError(false);
    setScheduleStatus("loading");
    try {
      const res = await getTableInfo(tableId);
      if (requestId !== tableRequestId.current) return;
      if (res?.status === 404) {
        setTableInfo(null);
        setIsValidTableId(false);
        return;
      }
      const tableData = res?.data;
      if (
        res?.success !== true ||
        tableData?.tableId !== tableId ||
        !Array.isArray(tableData?.dates) ||
        tableData.dates.length === 0
      ) {
        throw new Error("Table data unavailable");
      }
      setTableInfo(tableData);
      setIsValidTableId(true);
      await refreshScheduleData();
    } catch {
      if (requestId !== tableRequestId.current) return;
      setTableInfo(null);
      setUsersScheduleList([]);
      setTableLoadError(true);
      setIsValidTableId(false);
    }
  }, [tableId, refreshScheduleData]);

  useEffect(() => () => {
    ++tableRequestId.current;
    ++scheduleRequestId.current;
  }, [tableId]);

  // 표 화면 A/B 2회차(하네스 specs/table-ab-2.md). 켜짐 여부는 서버 상태(매니저 [시작]·[중단])다.
  // 1.5초 안에 못 받으면 이번 화면은 꺼짐(모두 A, 띠 없음)으로 그리고 ab_state_fail만 남긴다. 받은 값은 이 화면 동안 쓴다.
  // 배정은 브라우저(visitorId) 단위, 띠로 바꾼 화면은 이 브라우저의 모든 표에 쓴다. 저장소를 못 쓰는 브라우저는 실험에서 뺀다.
  const [abState, setAbState] = useState(null);
  const [visitorId] = useState(experimentVisitorId);
  const [uiChoice, setUiChoice] = useState(null);
  const [bRendered, setBRendered] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.resolve(getTableAbState())
      .then((res) => {
        // 값이 없으면(예상 밖 응답) 실패 기록 없이 꺼짐으로 본다.
        if (alive) setAbState(res || { ok: true, running: false, state: "off" });
      })
      .catch(() => {
        if (alive) setAbState({ ok: false, running: false, reason: "error" });
      });
    return () => {
      alive = false;
    };
  }, []);
  const stateFailSent = useRef(false);
  useEffect(() => {
    if (!abState || abState.ok || !visitorId || stateFailSent.current) return;
    stateFailSent.current = true;
    trackEvent(EVENTS.AB_STATE_FAIL, tableId, undefined, { reason: abState.reason });
  }, [abState, visitorId, tableId]);

  const abOn = Boolean(abState?.running && visitorId && isValidTableId === true && tableInfo?.tableId === tableId);
  const uiVersion = abOn ? uiChoice || resolveTableUi({ running: true, visitorId }) : "A";

  useEffect(() => {
    if (!abOn) return undefined;
    setActiveTableUi(tableId, uiVersion);
    tagTableUi(uiVersion);
    return () => setActiveTableUi(null);
  }, [abOn, tableId, uiVersion]);

  // 화면 기록(ui_view)은 그 화면의 내용이 보이는 상태에서 남긴다. 로딩·오류 화면만 본 것은 세지 않는다(Codex 2026-10-02).
  // A는 참여자 자료가 지금 준비돼 있을 때(B에서 재조회가 실패한 채 A로 바꾸면 A는 오류 안내뿐이라 세지 않는다),
  // B는 TableB가 자료를 받아 그렸다고 알린 뒤. 다시 불러오는 동안 잠깐 꺼졌다 켜지는 것은 useUiSegment가 다시 보내지 않는다.
  useEffect(() => {
    if (uiVersion !== "B" && bRendered) setBRendered(false);
  }, [uiVersion, bRendered]);
  const currentViewId = useUiSegment({
    tableId,
    uiVersion,
    active: abOn && (uiVersion === "A" ? scheduleStatus === "ready" : bRendered),
  });

  const handleSwitchUi = (next) => {
    switchTableUi(tableId, next, { viewId: currentViewId() });
    setUiChoice(next);
    if (next === "A") {
      // 새 화면에서 참여·로그아웃했거나 입력 중이었으면 그대로 이어서 보인다(표 화면 A/B 공유 상태).
      const screen = screenFor(tableId);
      setName(readStorage("name") || "");
      setRightScreen(screen.screen);
      setSelectedToggle(screen.toggle);
    }
  };

  const isAdReady =
    isValidTableId === true &&
    scheduleStatus === "ready" &&
    usersScheduleList.length >= 2 &&
    usersScheduleList.some((user) => Array.isArray(user.availableTimes) && user.availableTimes.length > 0) &&
    timeInfo.length > 0;

  useEffect(() => {
    if (tableId && trackedTableId.current !== tableId) {
      trackedTableId.current = tableId;
      trackVisit("table");
      trackEvent(EVENTS.TABLE_VIEW, tableId);
    }
  }, [tableId]);

  useEffect(() => {
    if (tableId !== readStorage("tableId")) {
      // 관리자 인증과 방문자 ID는 테이블과 무관하므로 유지한다.
      clearTableScopedStorage();
      writeStorage("tableId", tableId);
    }
    // 정리한 뒤에 읽는다. 전에는 정리 전에 읽어 다른 표에서 쓰던 이름이 이 표의 이름으로 남았다(2026-09-30).
    setName(readStorage("name") || "");
    fetchAllData();
  }, [tableId, saveButtonState, fetchAllData]);

  // 목록을 불러온 뒤: 새 화면에서 골라 보던 사람들을 그대로 보이고, 목록에 없는 사람은 뺀다(새 화면과 같다).
  const pickRestoredRef = useRef(false);
  useEffect(() => {
    if (scheduleStatus !== "ready") return;
    const names = usersScheduleList.map((user) => user.name);
    if (!pickRestoredRef.current) {
      pickRestoredRef.current = true;
      setPicks(readTableState(tableId).picks.filter((pick) => names.includes(pick)));
      return;
    }
    setPicks((current) =>
      current.every((pick) => names.includes(pick)) ? current : current.filter((pick) => names.includes(pick)),
    );
  }, [scheduleStatus, usersScheduleList, tableId]);

  // 복원한 뒤부터 고른 사람들을 공유 상태에 남긴다(여러 명이어도 그대로 남아 새 화면으로 돌아가도 같다).
  useEffect(() => {
    if (!pickRestoredRef.current) return;
    writeTableState(tableId, { picks });
  }, [picks, tableId]);

  // 내 시간을 고치는 화면인지 남긴다(새 화면은 이 값으로 입력 모드를 연다). 새 화면을 쓰는 동안은 새 화면이 남긴다.
  // 표 정보를 받기 전에는 어느 화면인지 모르므로 쓰지 않는다. 전에는 B로 배정된 표도 받기 전 잠깐의 A 값으로
  // "입력 중"을 남겨, 이름이 있는 사람이 새 화면을 열면 입력 모드로 열렸다(2026-10-01 B 구현 중 발견).
  useEffect(() => {
    if (!name || isValidTableId !== true || uiVersion !== "A") return;
    writeTableState(tableId, { name, editing: rightScreen === "PersonalSchedule" });
  }, [name, rightScreen, tableId, uiVersion, isValidTableId]);

  // 격자에 줄 시간: 전체면 모두의 시간, 사람을 골랐으면 칸마다 고른 사람 중 되는 수(0인 칸은 뺀다).
  // 격자는 고른 인원을 가장 진한 값으로 칠해 모두 되는 칸이 가장 진하다. 명단 창은 그 칸의 전체 명단을 보인다.
  const gridTimeInfo = useMemo(() => {
    if (picks.length === 0) return timeInfo;
    return timeInfo
      .map((item) => ({ ...item, count: picks.filter((pick) => item.members.includes(pick)).length }))
      .filter((item) => item.count > 0);
  }, [picks, timeInfo]);

  const handleToggleClick = (screen, toggle) => {
    const storedName = readStorage("name");

    if (screen === "PersonalSchedule" && !storedName) {
      setRightScreen("JoinForm");
      setSelectedToggle(null);
      return;
    }

    setRightScreen(screen);
    setSelectedToggle(toggle);
    // 탭을 바꿔도 고른 사람은 그대로 둔다. 새 화면도 입력 모드로 들어갈 때 고른 사람을 지키고
    // "전체"를 눌러야 비운다(Codex 재검증, 2026-09-30). 전에는 탭을 누를 때마다 비웠다.
  };

  // 휴대폰 전체 시간표 모달은 버튼·참여자 칩·순위 이름 세 곳에서 열린다. 여는 곳을 하나로 모으고,
  // 이미 열려 있을 때 다시 불려도 세지 않도록 닫힘에서 열림으로 바뀔 때만 남긴다.
  const openGridModal = () => {
    if (!isGridModalOpen) trackClarityEvent(CLARITY_EVENTS.TIMETABLE_OPEN);
    setIsGridModalOpen(true);
  };

  const handleUserClickWrapper = (newName, forceOpen = false) => {
    setSelectedName(newName);
    if (!isDesktop && (newName || forceOpen)) {
      openGridModal();
    }
  };

  const handleCopyInvite = useCallback(() => {
    const url = `${process.env.REACT_APP_DOMAIN_URL}/table/${tableId}`;
    // invite_share는 누른 순간의 복사 시도다(계약서). 클립보드 호출이 바로 예외를 던져도 빠지지 않게 먼저 남긴다.
    // 서버의 invite_share는 랜딩 완료 창과 합산된다. 표 화면 복사는 Clarity에서 따로 본다.
    trackEvent(EVENTS.INVITE_SHARE, tableId);
    trackClarityEvent(CLARITY_EVENTS.INVITE_SHARE_TABLE);
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [tableId]);

  const renderContent = () => {
    if (scheduleStatus === "error") {
      return (
        <DataNotice role="alert">
          <p>참여자와 일정을 불러오지 못했습니다.</p>
          <p>연결 상태를 확인하고 다시 시도해 주세요.</p>
          <RetryButton type="button" onClick={() => refreshScheduleData({ keepOnError: true })}>다시 불러오기</RetryButton>
        </DataNotice>
      );
    }
    if (scheduleStatus === "loading") return <Loader />;
    switch (rightScreen) {
      case "JoinForm":
        return (
          <JoinForm
            setRightScreen={setRightScreen}
            setName={setName}
            name={name}
            tableId={tableId}
            setSelectedToggle={setSelectedToggle}
            refreshData={fetchAllData}
          />
        );
      case "InviteSection":
        return <InviteSection tableId={tableId} title={title} />;
      case "DashboardPanel":
        return (
          <DashboardPanel
            setRightScreen={setRightScreen}
            selectedName={selectedName}
            selectedNames={picks}
            setSelectedName={handleUserClickWrapper}
            usersSchedule={usersScheduleList}
            name={name}
            tableId={tableId}
          />
        );
      case "PersonalSchedule":
        return tableInfo ? (
          <PersonalSchedule
            dates={dates}
            startHour={startHour}
            endHour={endHour}
            setRightScreen={setRightScreen}
            tableId={tableId}
            saveButtonState={saveButtonState}
            setSaveButtonState={setSaveButtonState}
            usersScheduleList={usersScheduleList}
            banedCells={banedCells}
            bgTimeInfo={timeInfo}
            onSaveSuccess={handleSaveSuccess}
            weekKey={weekKey}
            onWeekChange={handleWeekChange}
            // 휴대폰에서는 페이지째 스크롤되므로 사이트 헤더 바로 밑에 요일·날짜 줄을 붙인다.
            stickyHeaderTop={isDesktop ? undefined : SITE_HEADER_HEIGHT}
          />
        ) : (
          <Loader />
        );
      default:
        return (
          <DashboardPanel
            usersSchedule={usersScheduleList}
            tableId={tableId}
            setSelectedName={handleUserClickWrapper}
          />
        );
    }
  };

  const HeaderContent = () => {
    const tableUrl = `${process.env.REACT_APP_DOMAIN_URL}/table/${tableId}`;
    return (
      <HeaderSection>
        {dates && dates.length > 0 && dates[0] && dates[0].includes("-") && (
          <DateBadge>
            <FiCalendar />
            <span>
              {`${dates[0].split("-")[1]}.${dates[0].split("-")[2]} - ${
                dates[dates.length - 1].split("-")[1]
              }.${dates[dates.length - 1].split("-")[2]}`}
            </span>
          </DateBadge>
        )}
        <Title>{title}</Title>
        <InviteCard>
          <InviteCardLabel>
            <FiShare2 size={12} />
            초대 링크
          </InviteCardLabel>
          <InviteRow>
            <InviteUrl>{tableUrl}</InviteUrl>
            <CopyBtn $copied={isCopied} onClick={handleCopyInvite}>
              {isCopied ? "✓ 복사됨" : "복사하기"}
            </CopyBtn>
          </InviteRow>
        </InviteCard>
      </HeaderSection>
    );
  };

  const StepBar = () => {
    const hasMySchedule = !!usersScheduleList.find(
      (u) => u.name === name && u.availableTimes?.length > 0,
    );
    const steps = [
      {
        id: "join",
        label: "참여/삭제",
        icon: <FiUserPlus size={16} />,
        done: !!name,
        active: rightScreen === "JoinForm",
        disabled: false,
        pulse: !name && rightScreen !== "JoinForm",
        onClick: () => {
          setRightScreen("JoinForm");
          setSelectedToggle(null);
        },
      },
      {
        id: "schedule",
        label: "내 일정",
        icon: <FiCalendar size={16} />,
        done: hasMySchedule,
        active: selectedToggle === "내 일정",
        disabled: !name,
        onClick: () => handleToggleClick("PersonalSchedule", "내 일정"),
      },
      {
        id: "members",
        label: usersScheduleList.length > 0 ? `인원 (${usersScheduleList.length})` : "인원",
        icon: <FiUsers size={16} />,
        done: false,
        active: selectedToggle === "인원",
        disabled: false,
        pulse: !!name && !hasClickedMembers && selectedToggle !== "인원",
        onClick: () => {
          if (!hasClickedMembers) {
            writeStorage("hasClickedMembers", "true");
            setHasClickedMembers(true);
          }
          trackClarityEvent(CLARITY_EVENTS.MEMBERS_OPEN);
          handleToggleClick("DashboardPanel", "인원");
        },
      },
    ];
    return (
      <>
        <StepBarWrapper>
          {steps.map((step, i) => (
            <Fragment key={step.id}>
              <StepItemWrapper
                onClick={!step.disabled ? step.onClick : undefined}
                $disabled={step.disabled}
              >
                <StepCircle
                  $done={step.done && !step.active}
                  $active={step.active}
                  $disabled={step.disabled}
                  $pulse={!!step.pulse}
                >
                  <StepIcon>{step.icon}</StepIcon>
                </StepCircle>
                <StepLabel
                  $active={step.active}
                  $done={step.done && !step.active}
                  $disabled={step.disabled}
                >
                  {step.label}
                </StepLabel>
              </StepItemWrapper>
              {i < steps.length - 1 && <StepLine $filled={step.done} />}
            </Fragment>
          ))}
        </StepBarWrapper>
      </>
    );
  };

  const ResultCard = () => {
    const topTime =
      Array.isArray(timeInfo) && timeInfo.length > 0
        ? [...timeInfo].sort((a, b) => (b.count || 0) - (a.count || 0))[0]
        : null;
    return (
      <ResultCardButton
        type="button"
        $active={isRankingOpen}
        onClick={() => {
          trackEvent(EVENTS.RANKING_OPEN, tableId);
          setIsRankingOpen(true);
        }}
      >
        <ResultBadge>
          <FiAward size={18} />
        </ResultBadge>
        <ResultTitle>골든타임 순위</ResultTitle>
        {topTime && <ResultCount>최대 {topTime.count}명</ResultCount>}
        <ResultArrow>
          <FiChevronRight size={18} />
        </ResultArrow>
      </ResultCardButton>
    );
  };

  if (tableLoadError) {
    return (
      <LoaderLayout role="alert">
        <h1>표 정보를 불러오지 못했습니다.</h1>
        <p>연결 상태를 확인하고 다시 시도해 주세요.</p>
        <RetryButton type="button" onClick={fetchAllData}>다시 불러오기</RetryButton>
      </LoaderLayout>
    );
  }

  // 실험 상태를 받기 전에는 화면을 정하지 않는다(A를 그렸다 B로 바꾸며 깜빡이지 않게, 최대 1.5초).
  if (isValidTableId === null || abState === null) {
    return (
      <LoaderLayout>
        <Loader />
        <h1>테이블 정보를 불러오는 중입니다...</h1>
        <p>연결 상태에 따라 시간이 걸릴 수 있습니다.</p>
      </LoaderLayout>
    );
  }

  if (isValidTableId && uiVersion === "B") {
    // 새 화면(B). 자료·공유 상태는 여기서 들고 화면·흐름은 TableB가 맡는다(확정 시안, 2026-10-01).
    return (
      <>
        <TableUiBand version="B" onSwitch={handleSwitchUi} />
        <Seo
          title={`${title || "테이블"}`}
          description="팀 일정 조율이 더 쉬워집니다. 최적의 시간을 선택해 보세요."
        />
        <Suspense
          fallback={
            <LoaderLayout>
              <Loader />
            </LoaderLayout>
          }
        >
          <TableB
            tableId={tableId}
            table={tableInfo}
            users={usersScheduleList}
            scheduleStatus={scheduleStatus}
            me={name}
            onMeChange={setName}
            picks={picks}
            onPicksChange={setPicks}
            weekKey={weekKey}
            onWeekKeyChange={handleWeekChange}
            setUsers={setUsersScheduleList}
            onSaved={handleSaveSuccess}
            onReload={reloadQuietly}
            onRetry={() => refreshScheduleData({ keepOnError: true })}
            isAdReady={isAdReady}
            onRendered={() => setBRendered(true)}
          />
        </Suspense>
      </>
    );
  }

  return isValidTableId ? (
    <>
      {abOn && <TableUiBand version="A" onSwitch={handleSwitchUi} />}
      <PageWrapper>
        <Seo
          title={`${title || "테이블"}`}
          description="팀 일정 조율이 더 쉬워집니다. 최적의 시간을 선택해 보세요."
        />

        {isDesktop ? (
          <DesktopContainer>
            <LeftPanel>
              {tableInfo && (
                <GroupTimeGrid
                  banedCells={banedCells}
                  title={title}
                  dates={dates}
                  startHour={startHour}
                  endHour={endHour}
                  timeInfo={gridTimeInfo}
                  selectedName={selectedName}
                  selectedNames={picks}
                  setSelectedName={setSelectedName}
                  setTableInfo={setTableInfo}
                  tableId={tableId}
                  usersSchedule={usersScheduleList}
                  onRefresh={fetchAllData}
                  weekKey={weekKey}
                  onWeekChange={handleWeekChange}
                />
              )}
            </LeftPanel>
            <RightPanel>
              <HeaderContent />
              <ResultCard />
              <StepBar />
              <ContentPanel>
                <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
              </ContentPanel>
              <AdSense
                slot="7512892307"
                layout="in-article"
                format="fluid"
                isReady={isAdReady}
              />
            </RightPanel>
          </DesktopContainer>
        ) : (
          <>
            <MainContent>
              <HeaderContent />
              <ResultCard />
              <ViewTimetableButton
                type="button"
                disabled={scheduleStatus !== "ready" || usersScheduleList.length === 0}
                onClick={openGridModal}
              >
                <FiGrid size={20} />
                전체 시간표 보기
              </ViewTimetableButton>
              <StepBar />
              <ContentPanel>
                <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
              </ContentPanel>
              <AdSense
                slot="7512892307"
                layout="in-article"
                format="fluid"
                isReady={isAdReady}
              />
            </MainContent>
          </>
        )}

        <TableFooterSection>
          {(() => {
            const tips = TOGGLE_TIPS[selectedToggle] || TOGGLE_TIPS.default;
            return (
              <>
                <div
                  className="accordion-header"
                  onClick={() => {
                    trackClarityEvent(isTipsOpen ? CLARITY_EVENTS.TIPS_CLOSE : CLARITY_EVENTS.TIPS_OPEN);
                    setIsTipsOpen(!isTipsOpen);
                  }}
                >
                  <h3>{tips.emoji} 모임 시간 조율을 위한 팁</h3>
                  <motion.div animate={{ rotate: isTipsOpen ? 180 : 0 }}>
                    <Arrow width={16} height={16} angle={90} />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {isTipsOpen && (
                    <motion.div
                      key={selectedToggle}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="accordion-content">
                        <p>{tips.description}</p>
                        <div className="tip-grid">
                          {tips.tips.map((tip, i) => (
                            <div key={i} className="tip-item">
                              <h4>{tip.title}</h4>
                              <p>{tip.desc}</p>
                            </div>
                          ))}
                        </div>
                        <p className="last-p">{tips.lastP}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            );
          })()}
        </TableFooterSection>

        {tableInfo && !isDesktop && (
          <TimeGridModal
            $isOpen={isGridModalOpen}
            onClose={() => setIsGridModalOpen(false)}
            banedCells={banedCells}
            title={title}
            dates={dates}
            startHour={startHour}
            endHour={endHour}
            timeInfo={gridTimeInfo}
            selectedName={selectedName}
            selectedNames={picks}
            setSelectedName={setSelectedName}
            setTableInfo={setTableInfo}
            tableId={tableId}
            usersSchedule={usersScheduleList}
            onRefresh={fetchAllData}
            weekKey={weekKey}
            onWeekChange={handleWeekChange}
          />
        )}

        <RankingModal
          isOpen={isRankingOpen}
          onClose={() => setIsRankingOpen(false)}
          timeInfo={timeInfo}
          selectedName={selectedName}
          selectedNames={picks}
          setSelectedName={(newName) => {
            setIsRankingOpen(false);
            handleUserClickWrapper(newName);
          }}
          usersCount={usersScheduleList.length}
          onGoJoin={(screen) => {
            setIsRankingOpen(false);
            setRightScreen(screen);
            setSelectedToggle(null);
          }}
        />
      </PageWrapper>
    </>
  ) : (
    <NotFoundTable />
  );
}

const TableFooterSection = styled.section`
  margin: 50px auto 0;
  max-width: 800px;
  width: 100%;
  padding: 0;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  text-align: left;
  font-family: "Pretendard-Regular";
  overflow: hidden;

  .accordion-header {
    padding: 24px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;

    @media (max-width: 480px) {
      padding: 20px;
    }

    &:hover {
      background-color: ${theme.text.gamma[950]};
    }

    h3 {
      font-family: "Pretendard-Bold";
      font-size: 22px;
      margin: 0;
      color: ${theme.color.primary};
      @media (max-width: 480px) {
        font-size: 18px;
      }
    }
  }

  .accordion-content {
    padding: 0 30px 30px;
    @media (max-width: 480px) {
      padding: 0 20px 24px;
    }
  }

  p {
    font-size: 15px;
    line-height: 1.6;
    color: ${theme.text.gamma[500]};
    margin-bottom: 25px;
    @media (max-width: 480px) {
      font-size: 14px;
    }
  }

  .tip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
    gap: 20px;
    margin-bottom: 30px;
    width: 100%;
    box-sizing: border-box;
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  .tip-item {
    padding: 20px;
    background-color: ${theme.text.gamma[950]};
    border-radius: 12px;
    min-width: 0; /* Grid overflow 방지 핵심 */
    width: 100%;
    box-sizing: border-box;
    word-break: keep-all;
    overflow-wrap: break-word;

    h4 {
      font-family: "Pretendard-Bold";
      font-size: 16px;
      margin-bottom: 10px;
      color: black;
      line-height: 1.4;
    }

    p {
      font-size: 14px;
      margin-bottom: 0;
      line-height: 1.6;
    }
  }

  .last-p {
    font-size: 13px;
    opacity: 0.8;
    margin-top: 20px;
    border-top: 1px solid ${theme.text.gamma[900]};
    padding-top: 20px;
  }
`;

const PageWrapper = styled.div`
  width: 100%;
  padding: 40px 24px 80px;
  box-sizing: border-box;
  background-color: #f8f9fa;
  min-height: calc(100vh - 72px); // Header height
  @media (max-width: 480px) {
    padding: 24px 16px 60px;
  }
`;

const MainContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const DesktopContainer = styled.div`
  display: flex;
  gap: 40px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  align-items: flex-start;
  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: center;
  }
`;

const LeftPanel = styled.div`
  flex: 1.4;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 24px;
  width: 100%;
  box-sizing: border-box;
  max-height: calc(100vh - 48px);
  overflow-y: auto;

  @media (max-width: 1024px) {
    position: static;
    max-height: none;
    overflow-y: visible;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 450px;
  flex-shrink: 0;
`;

const DateBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: ${theme.color.primary}12;
  color: ${theme.color.primary};
  padding: 6px 14px;
  border-radius: 99px;
  font-family: "Pretendard-Bold";
  font-size: 13px;
  margin-bottom: 8px;
`;

const HeaderSection = styled.header`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h1`
  font-family: "Pretendard-Bold";
  font-size: 36px;
  color: ${theme.text.gamma[100]};
  margin: 0;
  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const StepBarWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  background: white;
  border-radius: 14px;
  padding: 16px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const StepItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  flex: 0 0 auto;
  min-width: 64px;
  opacity: ${(p) => (p.$disabled ? 0.4 : 1)};
  transition: opacity 0.2s ease;

  &:hover {
    opacity: ${(p) => (p.$disabled ? 0.4 : 0.75)};
  }
`;

const memberPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 ${theme.color.primary}60; }
  50% { box-shadow: 0 0 0 9px ${theme.color.primary}00; }
`;

const StepCircle = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.25s ease,
    border-color 0.25s ease;

  ${(p) =>
    p.$active &&
    css`
      background: linear-gradient(135deg, ${theme.color.primaryTint}, ${theme.color.primary});
      color: white;
      box-shadow: 0 4px 12px ${theme.color.primary}40;
    `}
  ${(p) =>
    p.$done &&
    !p.$active &&
    css`
      background: white;
      color: ${theme.color.primary};
      border: 2px solid ${theme.text.gamma[900]};
    `}
  ${(p) =>
    !p.$done &&
    !p.$active &&
    !p.$pulse &&
    css`
      background: ${theme.text.gamma[900]};
      color: ${theme.text.gamma[500]};
      border: 2px solid ${theme.text.gamma[900]};
    `}
  ${(p) =>
    p.$pulse &&
    !p.$active &&
    css`
      background: ${theme.text.gamma[900]};
      color: ${theme.color.primary};
      border: 2px solid ${theme.text.gamma[900]};
      animation: ${memberPulse} 1.6s ease-in-out infinite;
    `}
`;

const StepIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StepLabel = styled.span`
  font-family: "Pretendard-SemiBold";
  font-size: 12px;
  white-space: nowrap;
  transition: color 0.2s;

  ${(p) => p.$active && `color: ${theme.color.primary};`}
  ${(p) => p.$done && !p.$active && `color: ${theme.color.primary};`}
  ${(p) => !p.$done && !p.$active && !p.$disabled && `color: ${theme.text.gamma[500]};`}
  ${(p) => p.$disabled && `color: ${theme.text.gamma[600]};`}
`;

const StepLine = styled.div`
  flex: 1;
  height: 2px;
  margin-top: 17px;
  border-radius: 2px;
  transition: background 0.3s ease;
  background: ${(p) =>
    p.$filled
      ? `linear-gradient(90deg, ${theme.color.primary}, ${theme.color.primaryTint})`
      : theme.text.gamma[900]};
`;

const ResultCardButton = styled("button", {
  shouldForwardProp: (prop) => prop !== "$active",
})`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 14px;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease;
  border: 1px solid ${(p) => (p.$active ? theme.color.primary : theme.text.gamma[800])};
  background: ${(p) => (p.$active ? `${theme.color.primary}0D` : "white")};

  &:hover {
    background: ${theme.text.gamma[900]};
  }
`;

const ResultBadge = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.color.primary};
`;

const ResultTitle = styled.span`
  flex: 1;
  font-family: "Pretendard-SemiBold";
  font-size: 14px;
  color: ${theme.text.primary};
`;

const ResultCount = styled.span`
  flex-shrink: 0;
  font-family: "Pretendard-Medium";
  font-size: 12px;
  color: ${theme.text.gamma[500]};
`;

const ResultArrow = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: ${theme.text.gamma[500]};
`;

const InviteCard = styled.div`
  width: 100%;
  background: ${theme.color.primary}08;
  border: 1.5px solid ${theme.color.primary}22;
  border-radius: 14px;
  padding: 12px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: ${theme.color.primary}44;
  }
`;

const InviteCardLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: "Pretendard-SemiBold";
  font-size: 12px;
  color: ${theme.color.primary};
`;

const InviteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 38px;
  padding: 0 12px;
  background: white;
  border: 1px solid ${theme.color.primary}20;
  border-radius: 9px;
  box-sizing: border-box;
`;

const InviteUrl = styled.span`
  flex: 1;
  font-family: "Pretendard-Regular";
  font-size: 12px;
  color: ${theme.text.gamma[500]};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
`;

const CopyBtn = styled.button`
  flex-shrink: 0;
  height: 28px;
  padding: 0 14px;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  font-family: "Pretendard-Bold";
  font-size: 12px;
  transition: all 0.2s ease;

  ${(p) =>
    p.$copied
      ? `
    background: #dcfce7;
    color: #16a34a;
  `
      : `
    background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
    color: white;
    box-shadow: 0 2px 8px ${theme.color.primary}30;
    &:hover { opacity: 0.9; transform: translateY(-1px); }
  `}
`;

const ViewTimetableButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[2]};
  padding: ${theme.space[4]};
  border: 1px solid ${theme.color.primaryBorder};
  border-radius: ${theme.radius.lg};
  background: ${theme.color.primarySurface};
  color: ${theme.color.primaryText};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.body};
  cursor: pointer;

  &:hover:not(:disabled) { background: ${theme.color.surface}; }
  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }
  &:disabled {
    border-color: ${theme.text.gamma[800]};
    background: ${theme.text.gamma[900]};
    color: ${theme.text.gamma[400]};
    cursor: not-allowed;
  }
`;

const DataNotice = styled.div`
  padding: ${theme.space[6]};
  border-radius: ${theme.radius.lg};
  background: ${theme.color.surface};
  color: ${theme.text.gamma[300]};
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.body};
  line-height: ${theme.font.lineHeight.normal};
  p { margin: 0 0 ${theme.space[3]}; }
`;

const RetryButton = styled.button`
  padding: ${theme.space[3]} ${theme.space[5]};
  border: 1px solid ${theme.color.primaryBorder};
  border-radius: ${theme.radius.md};
  background: ${theme.color.primarySurface};
  color: ${theme.color.primaryText};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.body};
  cursor: pointer;
  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
  }
`;

const ContentPanel = styled.main`
  width: 100%;
`;

const LoaderLayout = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 150px);
  text-align: center;

  h1 {
    font-family: "Pretendard-Bold";
    font-size: 24px;
  }
  p {
    font-family: "Pretendard-Regular";
    font-size: 16px;
    color: ${theme.text.gamma[400]};
  }
`;
