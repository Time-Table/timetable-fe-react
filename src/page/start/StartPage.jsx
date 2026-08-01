import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import styled from "@emotion/styled";
import { keyframes, css } from "@emotion/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { BsLightningChargeFill } from "react-icons/bs";
import {
  FiCalendar,
  FiShare2,
  FiAward,
  FiChevronRight,
  FiAlertCircle,
  FiUsers,
  FiInfo,
  FiX,
  FiPlus,
  FiMinus,
} from "react-icons/fi";
import theme from "../../theme";
import Seo from "../../Seo";
import { createTable } from "../../api/table";
import { trackVisit } from "../../api/visit";
import { trackEvent, EVENTS } from "../../utils/analytics";
import {
  PRESETS,
  buildDefaultDates,
  buildDatesAfter,
  HOURS,
  DAYS_PER_WEEK,
  MIN_WEEKS,
  MAX_WEEKS,
} from "./presets";
import { buildMockTimetable, buildMemberBlocks, MOCK_MEMBERS, MOCK_TABLE_ID } from "./mockPreview";

const DAY_FULL = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const DAY_SHORT = ["일", "월", "화", "수", "목", "금", "토"];
const TOAST_MS = 3000;
/** Hero 미끼 격자의 행 수. 아래 미리보기를 축소한 그림이므로 몇 줄만 보여준다. */
const TEASER_ROWS = 8;

/**
 * Hero 요소가 차례로 올라오며 나타난다. `order`가 순번이다.
 * 첫 화면 본문이라 whileInView(관찰자를 기다림) 대신 마운트 시퀀스를 쓴다.
 */
const rise = (reduce, order) => ({
  initial: reduce ? { opacity: 0 } : { opacity: 0, y: theme.motion.riseY },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: theme.duration.sec.base,
    ease: theme.easing.arr.out,
    delay: reduce ? 0 : order * theme.motion.stagger,
  },
});

/** 스크롤해 들어올 때 블록 단위로 올라온다. */
const riseInView = (reduce, tall) => ({
  initial: reduce ? { opacity: 0 } : { opacity: 0, y: theme.motion.riseYLarge },
  whileInView: { opacity: 1, y: 0 },
  // 뷰포트보다 높은 블록에 amount를 걸면 20%를 못 채워 영영 안 나타난다.
  viewport: tall ? { ...theme.motion.viewport, amount: 0 } : theme.motion.viewport,
  transition: { duration: theme.duration.sec.slow, ease: theme.easing.arr.out },
});

/**
 * 행동 유도형 진입 페이지.
 *
 * 기존 `/quick-create`는 빈 화면에서 시작해 사용자가 전부 채워야 한다.
 * 여기서는 그럴듯한 값이 이미 채워진 상태로 보여주고, 그 자리에서 고쳐 바로 만들게 한다.
 * "무엇을 만들게 되는지"를 먼저 보여주는 것이 목적이다.
 *
 * 홈(`/`)과 검색어가 겹치지 않도록 이 페이지는 '약속 시간 정하기' 쪽을 맡는다.
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
  const [isToastOpen, setToastOpen] = useState(false);
  const toastTimer = useRef(null);
  // 마우스와 포커스를 따로 센다. 하나로 합치면 "포커스는 남았는데 포인터만 나간"
  // 경우에 타이머가 되살아나 읽는 중에 토스트가 닫힌다.
  const toastHovered = useRef(false);
  const toastFocused = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    trackVisit("landing");
    trackEvent(EVENTS.LANDING_VIEW);
    // 이 페이지는 랜딩이자 생성 폼이다. 백엔드 퍼널은 앞 단계를 모두 거친 방문자만
    // 세므로(services/eventService.js), 두 단계를 빠뜨리면 여기서 만든 사람이
    // 생성 퍼널 완료에서 전원 0으로 집계된다.
    trackEvent(EVENTS.CREATE_CTA_CLICK);
    trackEvent(EVENTS.CREATE_VIEW);
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
    () => buildMockTimetable(selectedDays, startHour, endHour),
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

  const weekCount = Math.ceil(dates.length / DAYS_PER_WEEK);

  /**
   * 미리보기 격자를 달력 주(일~토) 단위로 자른다. 실제 /table 화면도 한 주씩 보여준다.
   * 후보가 8주까지 늘어날 수 있어 전부 한 줄에 늘어놓으면 읽을 수 없다.
   * 빈 자리는 `null` — 후보에 없는 날이라 비활성으로 그린다.
   */
  const previewWeeks = useMemo(() => {
    if (!dates.length) return [];
    const out = [];
    let week = new Array(dates[0].date.getDay()).fill(null);
    dates.forEach((d) => {
      week.push(d);
      if (d.date.getDay() === 6) {
        out.push(week);
        week = [];
      }
    });
    if (week.length) out.push([...week, ...new Array(DAYS_PER_WEEK - week.length).fill(null)]);
    return out;
  }, [dates]);

  const shownWeek = previewWeeks[Math.min(previewIndex, previewWeeks.length - 1)] || [];

  /**
   * Hero 미끼에 그릴 시간대. 앞에서부터 자르면 이른 아침처럼 아무도 없는 구간만 나와
   * 빈 격자가 된다. 골든타임을 가운데 두고 잘라 "겹치는 그림"이 바로 보이게 한다.
   */
  const teaserHours = useMemo(() => {
    if (!mock) return [];
    const all = mock.hours;
    if (all.length <= TEASER_ROWS) return all;
    const center = mock.golden ? all.indexOf(mock.golden.from) : Math.floor(all.length / 2);
    const start = Math.max(0, Math.min(center - 3, all.length - TEASER_ROWS));
    return all.slice(start, start + TEASER_ROWS);
  }, [mock]);

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

  // 미리보기에서 빠져나오는 탈출구. 개인 시간표와 토스트 모두 Esc로 닫힌다.
  const handlePreviewKeyDown = (e) => {
    if (e.key !== "Escape") return;
    if (isToastOpen) closeToast();
    else if (previewName) setPreviewName(null);
    else if (isRankingOpen) setRankingOpen(false);
  };

  const isValid = title.trim().length > 0 && selectedDates.length > 0 && startHour < endHour;

  // 버튼이 왜 비활성인지 글로 알린다. opacity만으로는 이유가 전달되지 않는다.
  const ctaHint = !title.trim()
    ? "모임 이름을 입력해 주세요."
    : selectedDates.length === 0
      ? "후보 날짜를 하루 이상 선택해 주세요."
      : startHour >= endHour
        ? "종료 시간이 시작 시간보다 늦어야 합니다."
        : isLoading
          ? "링크를 만드는 중입니다."
          : "가입 없이 생성 · 나중에 수정 가능";

  const handleCreate = async () => {
    if (!isValid || isLoading) return;
    trackEvent(EVENTS.CREATE_SUBMIT);
    setIsLoading(true);
    const res = await createTable(title.trim(), selectedDates, startHour, endHour, []);
    // 응답을 기다리는 사이에 사용자가 페이지를 떠났으면 여기서 끝낸다.
    // 아니면 다른 화면 위에 성공 모달이 뜨고, 확인을 누르면 엉뚱한 곳으로 이동한다.
    if (!isMounted.current) return;
    setIsLoading(false);

    if (res?.isRateLimit) return;
    if (!res?.success) {
      Swal.fire("생성 실패", res?.message || "테이블 생성 중 오류가 발생했습니다.", "error");
      return;
    }

    const tableId = res.data.tableId;
    const url = `${window.location.origin}/table/${tableId}`;
    localStorage.setItem("title", title.trim());
    trackEvent(EVENTS.CREATE_SUCCESS, tableId);

    Swal.fire({
      icon: "success",
      title: "만들어졌습니다",
      html: `링크를 공유하면 참여자가 가능한 시간을 표시할 수 있어요.<br><br><b>${url}</b>`,
      confirmButtonText: "링크 복사",
      showCancelButton: true,
      cancelButtonText: "테이블로 이동",
      preConfirm: () => {
        navigator.clipboard.writeText(url);
        trackEvent(EVENTS.INVITE_SHARE, tableId);
        Swal.showValidationMessage("링크가 복사되었습니다!");
      },
    }).then((result) => {
      if (!result.isConfirmed) navigate(`/table/${tableId}`);
    });
  };

  return (
    <>
      <Seo
        title="언제 만날까? 링크 하나로 끝내는 약속 시간 정하기"
        description="단톡방에서 '언제 시간 돼?'를 스무 번 주고받을 필요 없습니다. 링크를 보내면 각자 되는 시간만 칠하고, 모두가 되는 시간이 자동으로 계산됩니다. 로그인도 설치도 없이 30초."
      />

      <PageWrapper>
        <Hero>
          <Badge {...rise(reduceMotion, 0)}>로그인 없이 · 30초 · 무료</Badge>
          <PageTitle {...rise(reduceMotion, 1)}>
            &ldquo;언제 시간 돼?&rdquo;
            <br />
            이제 링크 하나로 끝냅니다
          </PageTitle>
          <Lead {...rise(reduceMotion, 2)}>
            각자 되는 시간만 칠하면, 모두가 되는 시간이 자동으로 계산됩니다.
          </Lead>

          {/* 스크롤하기 전에 "무엇이 만들어지는지"부터 보여주는 미끼.
              아래 미리보기의 축소판이라 정보는 그쪽에 다 있고, 여기서는 장식이다. */}
          {mock && (
            <Teaser {...rise(reduceMotion, 3)} aria-hidden="true">
              {/* 아래 '모임 이름' 입력과 같은 state를 보므로 고치는 즉시 따라 바뀐다. */}
              <TeaserTitle>{previewTitle}</TeaserTitle>

              {/* 아래 미리보기의 축소판이다. 같은 격자 형태를 그대로 줄인다. */}
              <TeaserGrid>
                {shownWeek.map((d, col) => (
                  <TeaserHead key={d ? d.key : `t-off-${col}`} $off={!d || !d.selected}>
                    {DAY_SHORT[col]}
                  </TeaserHead>
                ))}
                {teaserHours.map((h, row) =>
                  shownWeek.map((d, col) => {
                    const off = !d || !d.selected;
                    const n = off ? 0 : (mock.cells[`${d.key}|${h}`] || []).length;
                    const target = n ? 0.2 + (n / mock.maxCount) * 0.8 : 0;
                    return (
                      <TeaserCell key={`${row}-${col}`} $off={off}>
                        {target > 0 && (
                          <TeaserFill
                            initial={reduceMotion ? false : { scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: target }}
                            transition={{
                              duration: theme.duration.sec.fast,
                              ease: theme.easing.arr.out,
                              delay: 0.2 + Math.min(col * 0.025 + row * 0.008, 0.18),
                            }}
                          />
                        )}
                      </TeaserCell>
                    );
                  })
                )}
              </TeaserGrid>
              <TeaserCaption>
                <FiAward size={13} aria-hidden="true" />
                {mock.golden
                  ? `${mock.golden.label} · ${mock.total}명 중 ${mock.golden.count}명`
                  : "겹치는 시간 없음"}
              </TeaserCaption>
            </Teaser>
          )}
        </Hero>

        <StartShell>
        <Builder aria-busy={isLoading}>
          <SrOnly role="status">{presetAnnounce}</SrOnly>

          <FieldBlock {...riseInView(reduceMotion)}>
            <FieldLabel htmlFor="start-title">모임 이름</FieldLabel>
            <TitleInput
              id="start-title"
              value={title}
              maxLength={25}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 팀 프로젝트 회의"
            />
            <Hint>{title.length}/25자</Hint>

            {PRESETS.length > 0 && (
              <KeywordBlock role="group" aria-labelledby="start-keyword-label">
                <KeywordLabel id="start-keyword-label">추천 키워드</KeywordLabel>
                <KeywordRow>
                  {PRESETS.map((p) => (
                    <KeywordChip
                      key={p.key}
                      type="button"
                      disabled={isLoading}
                      aria-disabled={isLoading}
                      onClick={() => applyPreset(p.key)}
                    >
                      <span aria-hidden="true">#</span>
                      {p.label}
                    </KeywordChip>
                  ))}
                </KeywordRow>
              </KeywordBlock>
            )}
          </FieldBlock>

          <DateFieldset disabled={isLoading} {...riseInView(reduceMotion, true)}>
            <DateLegend>후보 날짜</DateLegend>
            <Hint id="start-dates-hint">눌러서 켜고 끄기 · 최소 하루</Hint>
            <DateSummary>
              <b>{selectedDays.length}일</b> 선택 · {weekCount}주
            </DateSummary>

            {/* quick-create 의 Calendar 와 같은 시각 언어 — 테두리 없는 7열, 원형 셀,
                선택은 원이 스프링으로 붙는다. 조작 방식(눌러 토글)은 그대로다. */}
            <DateCalendar $invalid={selectedDays.length === 0}>
              <DateGridScroll>
                <DateGrid role="group" aria-describedby="start-dates-hint start-dates-error">
                  {DAY_SHORT.map((w, i) => (
                    <DayHead key={w} aria-hidden="true" $dow={i}>
                      {w}
                    </DayHead>
                  ))}
                  {/* 첫 날을 자기 요일 칸에 맞추기 위한 빈 칸 */}
                  {Array.from({ length: dates.length ? dates[0].date.getDay() : 0 }, (_, i) => (
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
                          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                          $active={d.selected}
                          aria-pressed={d.selected}
                          aria-label={`${i === 0 ? "내일, " : ""}${d.date.getMonth() + 1}월 ${d.date.getDate()}일 ${DAY_FULL[dow]}`}
                          onClick={() => toggleDate(d.key)}
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
                      { length: (7 - ((dates[0].date.getDay() + dates.length) % 7)) % 7 },
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

          <FieldBlock {...riseInView(reduceMotion)}>
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

        <PreviewColumn {...riseInView(reduceMotion, true)}>
            <FieldLabel as="span">이렇게 만들어집니다</FieldLabel>

            {/* 실제 /table 화면을 가짜 데이터로 재현한 미리보기.
                누를 수 있는 것이 생겼으므로 통짜 role="img"로 감싸지 않는다.
                격자는 장식으로 감추고, 격자가 말하는 내용은 아래 요약에 글로 남긴다. */}
            <PreviewCard
              as="section"
              aria-labelledby="start-preview-heading"
              aria-describedby="start-preview-summary"
              onKeyDown={handlePreviewKeyDown}
            >
              <BrowserBar>
                <Dot $color={theme.color.mockWindow.close} aria-hidden="true" />
                <Dot $color={theme.color.mockWindow.minimize} aria-hidden="true" />
                <Dot $color={theme.color.mockWindow.zoom} aria-hidden="true" />
                <MockBadge>예시 · 실제 데이터 아님</MockBadge>
              </BrowserBar>

              {mock ? (
                <PreviewLayout>
                  {/* 왼쪽: 전체 시간표 (table 페이지의 LeftPanel) */}
                  <PreviewPane>
                    <PaneHeading id="start-preview-heading">
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
                    <PreviewScroll aria-hidden="true">
                      <PreviewGrid $cols={DAYS_PER_WEEK}>
                        <PreviewCorner />
                        {shownWeek.map((d, i) => (
                          <PreviewHead key={d ? d.key : `off-${i}`} $off={!d || !d.selected}>
                            {DAY_SHORT[i]}
                            <em>{d ? d.date.getDate() : ""}</em>
                          </PreviewHead>
                        ))}
                        {mock.hours.map((h) => (
                          <PreviewRowGroup key={h}>
                            <PreviewTime>{`${String(h).padStart(2, "0")}:00`}</PreviewTime>
                            {shownWeek.map((d, i) => {
                              const off = !d || !d.selected;
                              const members = off ? [] : mock.cells[`${d.key}|${h}`] || [];
                              // 개인 모드는 실제 TimeGrid와 같이 단색 1.0으로 칠한다.
                              const opacity = previewName
                                ? members.includes(previewName)
                                  ? 1
                                  : 0
                                : members.length
                                  ? 0.2 + (members.length / mock.maxCount) * 0.8
                                  : 0;
                              // 개인 모드에서는 모든 칸이 최다가 되므로 반짝임을 끈다.
                              const isGolden =
                                !previewName && members.length > 0 && members.length === mock.maxCount;
                              return (
                                <PreviewCell key={d ? `${d.key}-${h}` : `off-${i}-${h}`} $off={off}>
                                  {opacity > 0 && <CellFill style={{ opacity }} />}
                                  {isGolden && <CellShine />}
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
                    <GoldenNote>
                      {previewName
                        ? `${previewName} 님 가능 ${memberBlocks.length}구간`
                        : mock.golden
                          ? `골든타임 ${mock.golden.label} · ${mock.golden.count}/${mock.total}`
                          : "겹치는 시간 없음"}
                    </GoldenNote>
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
                      <span>골든타임 순위</span>
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
        </PreviewColumn>

        <CtaBlock {...riseInView(reduceMotion)}>
          <CreateButton
            type="button"
            onClick={handleCreate}
            disabled={!isValid || isLoading}
            aria-describedby="start-cta-hint"
          >
            <SparkIcon $spin={isLoading} $reduce={reduceMotion}>
              <BsLightningChargeFill size={20} aria-hidden="true" />
            </SparkIcon>
            {isLoading ? "만드는 중…" : "링크 만들기"}
          </CreateButton>
          {/* 못 누르는 이유를 색이 아니라 글로 말한다. */}
          <Hint id="start-cta-hint" role="status" style={{ textAlign: "center" }}>
            {ctaHint}
          </Hint>
        </CtaBlock>
        </StartShell>

        {/* 검색엔진이 읽을 본문. 도구만 있고 텍스트가 없으면 이 페이지가 무엇인지 판단할 근거가 없다. */}
        <Explainer>
          <h2>약속 시간 정하기, 왜 링크가 빠른가</h2>
          <p>
            단톡방에서 &ldquo;언제 시간 돼?&rdquo;를 주고받으면 답이 올 때마다 조건이 바뀝니다.
            인원이 늘수록 확인할 조합이 급격히 늘어 사람이 머리로 교집합을 찾기 어려워집니다.
            링크를 공유하는 방식은 각자가 자기 시간만 표시하면 되기 때문에, 취합하는 사람이
            병목이 되지 않습니다.
          </p>
          <h2>이 페이지에서 하는 일</h2>
          <ul>
            <li>모임 이름과 후보 날짜, 시간 범위를 정합니다</li>
            <li>버튼을 누르면 공유용 링크가 즉시 만들어집니다</li>
            <li>참여자는 로그인 없이 이름만 적고 가능한 시간을 드래그로 표시합니다</li>
            <li>가장 많은 인원이 겹치는 구간이 골든타임으로 자동 계산됩니다</li>
          </ul>
          <p>
            약속 조율 방법을 더 자세히 비교한 내용은{" "}
            <Link to="/appointment-scheduling-guide">약속 조율 완전 가이드</Link>에 정리해
            두었습니다. 사용법은 <Link to="/guide">이용 가이드</Link>를 참고하세요.
          </p>
        </Explainer>
      </PageWrapper>
    </>
  );
}

/* ------------------------------------------------------------------ 스타일 */

const PageWrapper = styled.main`
  width: 100%;
  padding: 48px 20px 90px;
  box-sizing: border-box;
  overflow-x: hidden; /* 격자 bleed가 본문 가로 스크롤을 만들지 않게 */

  @media (max-width: 480px) {
    padding: 28px 12px 64px;
  }
  background:
    radial-gradient(circle at top right, ${theme.color.primary}0a, transparent),
    radial-gradient(circle at bottom left, ${theme.color.button.blue}0a, transparent);
`;

const Hero = styled.header`
  max-width: 720px;
  margin: 0 auto 34px;
  text-align: center;
`;

/**
 * 페이지 본체. 넓은 화면에서는 폼(좌)과 미리보기(우)로 갈라진다.
 * Builder 안에 미리보기를 두면 720px 안에서 폭을 나눠야 해 미리보기가 계속 작다.
 */
const StartShell = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.space[8]};

  @media (min-width: ${theme.breakpoint.xl}) {
    max-width: 1240px;
    margin: 0 auto;
    grid-template-columns: 460px minmax(0, 1fr);
    grid-template-areas:
      "form preview"
      "cta preview";
    align-items: start;
  }
`;

const PreviewColumn = styled(motion.div)`
  min-width: 0;

  @media (min-width: ${theme.breakpoint.xl}) {
    grid-area: preview;
    position: sticky;
    top: ${theme.space[6]};
    /* 00:00~24:00을 고르면 격자만 720px이라 sticky가 깨진다. */
    max-height: calc(100vh - ${theme.space[6]} * 2);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
`;

const CtaBlock = styled(motion.div)`
  @media (min-width: ${theme.breakpoint.xl}) {
    grid-area: cta;
  }
`;

const Badge = styled(motion.span)`
  display: inline-block;
  padding: 6px 16px;
  background-color: ${theme.color.primarySurface};
  color: ${theme.color.primary};
  border-radius: 99px;
  font-family: "Pretendard-Bold";
  font-size: 13px;
  margin-bottom: 18px;
`;

const PageTitle = styled(motion.h1)`
  font-family: "Pretendard-Black";
  font-size: 40px;
  line-height: 1.25;
  color: ${theme.text.gamma[100]};
  margin-bottom: 14px;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Lead = styled(motion.p)`
  font-family: "Pretendard-Regular";
  font-size: 17px;
  line-height: 1.75;
  color: ${theme.text.gamma[400]};

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

/* ---- Hero 미끼 미리보기 ---- */

const Teaser = styled(motion.div)`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]};
  margin-top: ${theme.space[6]};
  padding: ${theme.space[4]};
  background: ${theme.color.surface};
  border: 1px solid ${theme.text.gamma[800]};
  /* 카드 모서리는 아래 PreviewCard와 같은 반경. 각진 건 칸이지 카드가 아니다. */
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadow.card};
`;

/* 제목이 길어지면 카드가 조금 넓어진다. 격자보다 넓어져도 가운데 정렬이라 어색하지 않다. */
const TeaserTitle = styled.p`
  margin: 0;
  max-width: 200px;
  text-align: center;
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.small};
  line-height: ${theme.font.lineHeight.snug};
  color: ${theme.text.gamma[100]};
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

/* 하단 미리보기와 같은 형태 — 간격 없이 붙은 격자, 각진 칸, 헤어라인 경계. */
const TeaserGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 18px);
  border-left: 1px solid ${theme.text.gamma[900]};
  border-top: 1px solid ${theme.text.gamma[900]};

  @media (max-width: 480px) {
    grid-template-columns: repeat(7, 16px);
  }
`;

const TeaserHead = styled.span`
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.micro};
  text-align: center;
  padding-bottom: 3px;
  border-right: 1px solid transparent;
  color: ${({ $off }) => ($off ? theme.text.gamma[800] : theme.text.gamma[400])};
`;

const TeaserCell = styled.span`
  position: relative;
  display: block;
  height: 10px;
  overflow: hidden;
  background: ${({ $off }) => ($off ? theme.text.gamma[900] : theme.color.surface)};
  border-right: 1px solid ${theme.text.gamma[900]};
  border-bottom: 1px solid ${theme.text.gamma[900]};

  @media (max-width: 480px) {
    height: 9px;
  }
`;

const TeaserFill = styled(motion.span)`
  position: absolute;
  inset: 0;
  transform-origin: bottom;
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
`;

const TeaserCaption = styled.span`
  display: flex;
  align-items: center;
  gap: ${theme.space[1]};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.footnote};
  color: ${theme.color.primary};
  word-break: keep-all;
`;

const Builder = styled.section`
  max-width: 720px;
  margin: 0 auto;
  background: white;
  border: 1px solid ${theme.text.gamma[900]};
  border-radius: 24px;
  padding: 34px;

  /* 좌우 패딩을 space[3]으로 맞춰야 DateGridScroll의 bleed가 정확히 상쇄된다. */
  @media (max-width: 639px) {
    padding: ${theme.space[6]} ${theme.space[3]};
    border-radius: 18px;
  }
`;

const FieldBlock = styled(motion.div)`
  margin-bottom: 26px;
`;

const FieldLabel = styled.label`
  display: block;
  font-family: "Pretendard-Bold";
  font-size: 15px;
  color: ${theme.text.gamma[100]};
  margin-bottom: 10px;
`;

const Hint = styled.p`
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.small};
  color: ${theme.text.gamma[400]};
  margin: ${theme.space[2]} 0 0;
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

const KeywordBlock = styled.div`
  margin-top: ${theme.space[4]};
`;

const KeywordLabel = styled.span`
  display: block;
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
  margin-bottom: ${theme.space[2]};
`;

const KeywordRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.space[2]};
`;

/**
 * 키워드는 선택이 아니라 동작이다. 누른 뒤 제목을 고치면 "선택됨" 표시가 거짓말이 되므로
 * 지속 선택 상태(aria-pressed)를 두지 않는다. 현재 값은 아래 입력 필드들이 이미 보여준다.
 */
const KeywordChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${theme.space[1]};
  min-height: 44px;
  padding: 0 ${theme.space[4]};
  border-radius: ${theme.radius.pill};
  cursor: pointer;
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.label};
  background: white;
  border: 1px solid ${theme.text.gamma[600]};
  color: ${theme.text.gamma[300]};
  transition:
    background ${theme.duration.fast} ${theme.easing.standard},
    border-color ${theme.duration.fast} ${theme.easing.standard},
    color ${theme.duration.fast} ${theme.easing.standard},
    transform 100ms ${theme.easing.standard};

  &:hover:not(:disabled) {
    background: ${theme.color.primarySurface};
    border-color: ${theme.color.primaryBorder};
    color: ${theme.color.primary};
  }

  &:active:not(:disabled) {
    background: ${theme.color.primarySurface};
    transform: scale(0.98);
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

  @media (prefers-reduced-motion: reduce) {
    &:active:not(:disabled) {
      transform: none;
    }
  }
`;

const TitleInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  min-height: 52px;
  padding: 0 16px;
  border: 1px solid ${theme.text.gamma[600]};
  border-radius: ${theme.radius.md};
  font-family: ${theme.font.family.semiBold};
  font-size: ${theme.font.size.bodyLg};
  color: ${theme.text.gamma[100]};
  background: ${theme.color.surface};
  transition: border-color ${theme.duration.fast} ${theme.easing.standard};

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 2px;
    border-color: ${theme.color.primaryBorder};
  }
`;

/* ---- 후보 날짜: 요일 고정 7열 달력 격자 ----
   날짜 개수가 5·7·10으로 변해도 요일 열이 고정이라 그림이 흔들리지 않는다. */

const DateFieldset = styled(motion.fieldset)`
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
    box-shadow: inset 0 0 0 1px ${theme.color.primaryBorder};
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
    border-color: ${theme.color.primaryBorder};
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
  padding-inline: ${theme.space[1]};
`;

const DayHead = styled.div`
  min-height: 20px;
  text-align: center;
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.label};
  color: ${({ $dow }) =>
    $dow === 0
      ? theme.color.primary
      : $dow === 6
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
          ? `0 0 0 2px ${theme.color.surface}, 0 0 0 4px ${theme.color.primaryBorder}`
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
    border-color: ${theme.color.primaryBorder};
  }
`;


/* 미리보기는 만들어질 화면을 그대로 축소한 그림이다.
   실제 /table 페이지의 좌(시간표)-우(헤더·순위·참여자) 구성을 그대로 따른다. */
const PreviewCard = styled.div`
  position: relative; /* 토스트가 이 카드 안에 갇히도록 */
  border: 1px solid ${theme.text.gamma[800]};
  border-radius: ${theme.radius.lg};
  overflow: hidden;
  background: ${theme.color.appSurface};
  box-shadow: ${theme.shadow.card};
`;

const BrowserBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: ${theme.text.gamma[900]};
  border-bottom: 1px solid ${theme.text.gamma[800]};
`;

const Dot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

/* 가짜 데이터임을 알리는 표시는 숨기지 않는다. 항상 보이는 글이어야 한다. */
const MockBadge = styled.span`
  margin-left: ${theme.space[2]};
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
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

  /* 카드 내부가 좌우로 갈라지는 지점. 페이지 분할(1280)과 다르다. */
  @media (min-width: ${theme.breakpoint.md}) {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  }
`;

const PreviewPane = styled.div`
  background: white;
  border-radius: 12px;
  padding: 14px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ $side }) => ($side ? "10px" : "8px")};
  align-items: ${({ $side }) => ($side ? "center" : "stretch")};

  /* 실제 모바일 /table 화면은 제목·순위·참여자가 먼저 오고 시간표가 뒤에 온다. */
  @media (max-width: 640px) {
    order: ${({ $side }) => ($side ? 0 : 1)};
  }
`;

const PaneHeading = styled.p`
  margin: 0;
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
const PreviewHead = styled.div`
  text-align: center;
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.small};
  color: ${({ $off }) => ($off ? theme.text.gamma[700] : theme.text.gamma[400])};
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
  line-height: 26px;

  @media (min-width: ${theme.breakpoint.sm}) {
    line-height: 30px;
  }
`;

const PreviewCell = styled.div`
  position: relative;
  height: 26px;

  @media (min-width: ${theme.breakpoint.sm}) {
    height: 30px;
  }
  overflow: hidden;
  background: ${({ $off }) => ($off ? theme.text.gamma[900] : "white")};
  border-right: 1px solid ${theme.text.gamma[900]};
  border-bottom: 1px solid ${theme.text.gamma[900]};
`;

const WeekNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[2]};
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.footnote};
  color: ${theme.text.gamma[400]};
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
    border-color: ${theme.color.primaryBorder};
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
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
`;

const shine = keyframes`
  0%   { opacity: 0; transform: translateX(-100%) skewX(-20deg); }
  50%  { opacity: 0.45; }
  100% { opacity: 0; transform: translateX(300%) skewX(-20deg); }
`;

/**
 * 3회로 끊는다. 5초를 넘는 자동 움직임은 WCAG 2.2.2 위반이다.
 *
 * 기본 opacity를 0으로 두고 `forwards`를 붙이는 게 핵심이다. 빠뜨리면 애니메이션이
 * 끝나는 순간 요소가 "애니메이션 이전 상태"로 돌아가는데, 그게 opacity 1이라
 * 폭 40%짜리 흰 띠가 칸 위에 영구히 남는다(칸이 반으로 쪼개져 보이던 원인).
 * 같은 이유로 reduced-motion에서도 base가 0이어야 한다.
 */
const CellShine = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  opacity: 0;
  background: rgba(255, 255, 255, 0.6);
  animation: ${shine} 1.2s ease-in-out 3 forwards;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
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
`;

const LegendBar = styled.span`
  width: 88px;
  height: 8px;
  border-radius: ${theme.radius.pill};
  background: linear-gradient(
    90deg,
    ${theme.color.primary}33,
    ${theme.color.primaryTint},
    ${theme.color.primary}
  );
`;

const LegendSwatch = styled.span`
  width: 16px;
  height: 8px;
  border-radius: ${theme.radius.pill};
  background: ${theme.color.primary};
`;

/* 격자는 aria-hidden이므로, 격자가 말하는 내용이 여기 글로 남아 있어야 한다. */
const GoldenNote = styled.p`
  margin: ${theme.space[2]} 0 0;
  text-align: center;
  font-family: ${theme.font.family.regular};
  font-size: ${theme.font.size.footnote};
  line-height: ${theme.font.lineHeight.snug};
  color: ${theme.text.gamma[400]};
  word-break: keep-all;
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
  border: 1px solid ${theme.color.primaryBorder};
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
  border: 1px solid ${theme.color.primaryBorder};
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

  span {
    flex: 1;
    text-align: left;
    font-family: ${theme.font.family.semiBold};
    font-size: ${theme.font.size.footnote};
    color: ${theme.text.gamma[200]};
  }

  em {
    font-style: normal;
    font-family: ${theme.font.family.medium};
    font-size: ${theme.font.size.footnote};
    color: ${theme.text.gamma[400]};
  }

  &:hover:not(:disabled) {
    background: ${theme.color.primarySurface};
    border-color: ${theme.color.primaryBorder};
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
  border: 1px solid ${({ $top }) => ($top ? theme.color.primaryBorder : theme.text.gamma[800])};
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
  border: 1px solid ${theme.text.gamma[900]};
  border-radius: 10px;
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
    border-color: ${theme.color.primaryBorder};
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
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
  color: ${theme.color.surface};
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.bodyLg};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[2]};
  cursor: pointer;
  transition:
    transform ${theme.duration.fast} ${theme.easing.standard},
    box-shadow ${theme.duration.fast} ${theme.easing.standard};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${theme.shadow.raised};
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.focusRing};
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover:not(:disabled),
    &:active:not(:disabled) {
      transform: none;
    }
  }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/* 로딩 회전은 장식이다. 상태는 버튼 라벨 "만드는 중…"과 aria-busy가 말한다. */
const SparkIcon = styled.span`
  display: flex;
  align-items: center;
  animation: ${({ $spin, $reduce }) =>
    $spin && !$reduce
      ? css`
          ${spin} 1s linear infinite
        `
      : "none"};
`;

const Explainer = styled.section`
  max-width: 720px;
  margin: 56px auto 0;

  h2 {
    font-family: "Pretendard-Bold";
    font-size: 21px;
    color: ${theme.text.gamma[100]};
    margin-bottom: 12px;
    margin-top: 28px;
  }

  p,
  li {
    font-family: "Pretendard-Regular";
    font-size: 16px;
    line-height: 1.85;
    color: ${theme.text.gamma[400]};
  }

  ul {
    padding-left: 20px;
    margin-bottom: 16px;
  }

  a {
    color: ${theme.color.primary};
    text-decoration: underline;
  }
`;
