import { VISITOR_KEY } from "../../utils/storage";

// 백엔드 utils/constants.js의 VALIDATION_RULES.INQUIRY와 짝이다. 한쪽만 바꾸면 폼은 통과하는데 서버가 거절한다.
export const LIMITS = {
  EMAIL: 254,
  SUMMARY: 100,
  DETAIL_MIN: 10,
  DETAIL: 2000,
  HOPE: 1000,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 칸 이름은 유형과 상관없이 같고, 칸 안의 예시 문구만 유형에 맞춰 바꾼다(2026-09-28 사용자 선택 시안 A). */
export const INQUIRY_CATEGORIES = [
  {
    value: "bug",
    label: "버그",
    placeholders: {
      summary: "예: 시간 저장이 안 돼요",
      detail: "예: 어느 화면에서 무엇을 했더니 어떻게 됐는지 적어 주세요.",
      hope: "예: 원래 기대한 동작",
    },
  },
  {
    value: "suggestion",
    label: "건의",
    placeholders: {
      summary: "예: 결과를 이미지로 저장하고 싶어요",
      detail: "예: 어떤 상황에서 필요한지, 지금은 어떻게 하고 계신지 적어 주세요.",
      hope: "예: 이렇게 바뀌면 좋겠어요",
    },
  },
  {
    value: "partnership",
    label: "제휴",
    placeholders: {
      summary: "예: 광고 제휴 제안",
      detail: "예: 회사·단체명과 제안 내용을 적어 주세요.",
      hope: "예: 원하는 일정이나 조건",
    },
  },
  {
    value: "other",
    label: "기타",
    placeholders: {
      summary: "예: 궁금한 점을 한 줄로",
      detail: "예: 자세한 내용을 적어 주세요.",
      hope: "예: 덧붙일 말",
    },
  },
];

/** 유형을 아직 고르지 않았으면 '기타'의 예시를 보여 준다. */
export const placeholdersFor = (category) =>
  (INQUIRY_CATEGORIES.find((item) => item.value === category) || INQUIRY_CATEGORIES[3]).placeholders;

/** 칸 이름 → 오류 문구. 비어 있으면 보낼 수 있다. 서버 검증(validators.js)과 같은 기준이다. */
export const validateInquiry = ({ category, email, summary, detail, hope }) => {
  const errors = {};

  if (!INQUIRY_CATEGORIES.some((item) => item.value === category)) {
    errors.category = "문의 유형을 선택해 주세요.";
  }

  // 답장 받을 이메일은 선택이다(2026-09-28 사용자 지시). 적었다면 형식을 본다.
  const mail = email.trim();
  if (mail && (mail.length > LIMITS.EMAIL || !EMAIL_PATTERN.test(mail))) {
    errors.email = "이메일 형식이 올바르지 않습니다.";
  }

  const summaryLength = summary.trim().length;
  if (summaryLength === 0) {
    errors.summary = "어떤 문의인지 한 줄로 적어 주세요.";
  } else if (summaryLength > LIMITS.SUMMARY) {
    errors.summary = `${LIMITS.SUMMARY}자 이하로 적어 주세요.`;
  }

  const detailLength = detail.trim().length;
  if (detailLength < LIMITS.DETAIL_MIN) {
    errors.detail = `자세한 내용을 ${LIMITS.DETAIL_MIN}자 이상 적어 주세요.`;
  } else if (detailLength > LIMITS.DETAIL) {
    errors.detail = `${LIMITS.DETAIL.toLocaleString()}자 이하로 적어 주세요.`;
  }

  if (hope.trim().length > LIMITS.HOPE) {
    errors.hope = `${LIMITS.HOPE.toLocaleString()}자 이하로 적어 주세요.`;
  }

  return errors;
};

/**
 * /contact 페이지에서 쓰는 "문의를 누른 페이지". 푸터의 "문의하기" 링크가 화면 이동 정보(state.from)로 넘긴다.
 * 주소 뒤(?from=)에 싣지 않는 이유: 표 링크가 주소창과 GA 페이지 기록에 남는다.
 * 헤더 문의 모달은 페이지를 옮기지 않으므로 지금 경로를 그대로 쓴다(Header.jsx).
 */
export const readFromPath = (state) => {
  const from = state?.from;
  return typeof from === "string" && /^\/(?![/\\])/.test(from) ? from : null;
};

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * 문의와 함께 보내는 정보. 화면에는 보여 주지 않는다(2026-09-28 사용자 지시, 개인정보처리방침에 적혀 있다).
 * 브라우저·기기 정보는 서버가 요청에서 읽는다.
 *
 * 참여 이름은 마지막으로 들어간 표 하나의 것만 남아 있다(다른 표를 열면 지워진다, storage.js).
 * 그래서 이름은 그 표의 tableId와 짝일 때만 보낸다.
 * 화면 크기는 폼을 연 시점에 잰다. 휴대폰에서 입력 중에는 키보드가 높이를 줄이기 때문이다.
 */
export const collectContext = (fromPath) => {
  const name = readStorage("name");
  const tableId = readStorage("tableId");
  let timeZone;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }

  return {
    name: name && tableId ? name : undefined,
    tableId: name && tableId ? tableId : undefined,
    fromPath: fromPath || undefined,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timeZone: timeZone || undefined,
    visitorId: readStorage(VISITOR_KEY) || undefined,
  };
};
