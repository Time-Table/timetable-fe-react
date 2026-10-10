/**
 * 빌드 결과 build/index.html 의 og:image·twitter:image 를 최근 30일 참여 등록 건수에 맞는 이미지로 바꾼다.
 *
 * 왜 필요한가: 카카오톡·페이스북 크롤러는 JS를 실행하지 않아 정적 HTML의 og:image 만 읽는다.
 * 공유 미리보기 문구 "매달 N+명의 시간을 아끼고 있어요"의 N을 손으로 바꾸지 않도록, 빌드할 때 공개 집계
 * (BE GET /api/stats/landing, 어제까지 30일 참여 등록 건수)를 읽어 50 단위로 내린 이미지를 고른다.
 * 이미지는 public/og-image-100.png ~ og-image-500.png 9장이다. 숫자마다 파일명이 달라 카카오 캐시에 걸리지 않는다.
 *
 * 실행: npm run build 뒤 postbuild 로 자동 실행된다. 평소 배포에 더해
 * .github/workflows/weekly-og-image.yml 이 매주 월요일 02:00 KST 에 Netlify 빌드 훅으로 다시 빌드한다.
 *
 * 실패해도 빌드를 막지 않는다. 집계를 못 읽으면 public/index.html 에 적힌 이미지(og-image-v2.png, 200+명)를 그대로 둔다.
 * 100 미만이면 숫자 없는 옛 이미지(og-image.png)를 쓴다(랜딩도 100 이하는 숫자를 숨긴다).
 */
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://timetable2.com";
// public/index.html 의 og:image·twitter:image 기본값. 바꾸면 여기도 함께 바꾼다.
const DEFAULT_IMAGE = `${SITE_URL}/og-image-v2.png`;
const INDEX_HTML = path.join(__dirname, "..", "build", "index.html");
const STEP = 50;
const MIN = 100;
const MAX = 500;
const TIMEOUT_MS = 5000;

const pickOgImage = (count) => {
  if (count < MIN) return `${SITE_URL}/og-image.png`;
  const bucket = Math.min(MAX, Math.floor(count / STEP) * STEP);
  return `${SITE_URL}/og-image-${bucket}.png`;
};

// src/api/stats.js 의 모양 검사와 같은 기준. 하나라도 다르면 못 받은 것으로 본다.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const parseCount = (body) => {
  const data = body?.data;
  const valid =
    body?.success === true &&
    Boolean(data) &&
    Number.isInteger(data.count) &&
    data.count >= 0 &&
    data.days === 30 &&
    DATE.test(String(data.asOf)) &&
    DATE.test(String(data.startDate));
  return valid ? data.count : null;
};

// og:image·twitter:image 두 곳이 아니면 손대지 않는다(null).
const applyOgImage = (html, image) => {
  const parts = html.split(DEFAULT_IMAGE);
  return parts.length === 3 ? parts.join(image) : null;
};

const fetchCount = async (serverUrl) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${serverUrl.replace(/\/+$/, "")}/api/stats/landing`, { signal: controller.signal });
    return res.ok ? parseCount(await res.json()) : null;
  } finally {
    clearTimeout(timer);
  }
};

const main = async () => {
  const serverUrl = process.env.REACT_APP_SERVER_URL;
  if (!serverUrl) {
    console.warn("og-image: REACT_APP_SERVER_URL 이 없어 기본 이미지를 그대로 둔다");
    return;
  }
  const count = await fetchCount(serverUrl).catch((error) => {
    console.warn(`og-image: 집계 요청 실패(${error.message})`);
    return null;
  });
  if (count === null) {
    console.warn("og-image: 집계를 못 읽어 기본 이미지를 그대로 둔다");
    return;
  }
  const image = pickOgImage(count);
  const next = applyOgImage(fs.readFileSync(INDEX_HTML, "utf8"), image);
  if (next === null) {
    console.warn("og-image: build/index.html 에서 기본 이미지 주소 두 곳을 못 찾아 그대로 둔다");
    return;
  }
  fs.writeFileSync(INDEX_HTML, next);
  console.log(`og-image: 참여 등록 ${count}건 → ${image}`);
};

if (require.main === module) {
  main().catch((error) => console.warn(`og-image: 건너뜀(${error.message})`));
}

module.exports = { DEFAULT_IMAGE, pickOgImage, parseCount, applyOgImage };
