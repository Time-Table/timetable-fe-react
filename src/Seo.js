import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

/**
 * 검색엔진에 노출할 정본 도메인. www 있는 형태 하나만 쓴다.
 * www 없는 주소와 있는 주소는 검색엔진에게 서로 다른 사이트라, 둘을 섞으면 신호가 쪼개진다.
 */
export const SITE_URL = "https://timetable2.com";

/** 같은 화면이 두 주소로 열릴 때 정본으로 삼을 주소. `/`와 `/create`는 둘 다 CreatePage다. */
const CANONICAL_ALIAS = { "/create": "/" };

/**
 * 색인하면 안 되는 경로.
 * `/table/`은 초대받은 사람만 보는 모임이고 참여자 이름이 들어 있다.
 * `/managerPage`는 관리자 콘솔이다. 라우터가 대소문자를 가리지 않으므로 비교도 그렇게 한다.
 */
const NOINDEX_PATTERNS = [/^\/table\//i, /^\/managerpage/i];

const canonicalFor = (pathname) => {
  const path = CANONICAL_ALIAS[pathname] || pathname;
  if (path === "/") return `${SITE_URL}/`;
  return SITE_URL + path.replace(/\/+$/, "");
};

const Seo = ({
  title = "타임테이블 - 쉽고 빠른 모임 일정 조율 서비스",
  description = "팀 일정 조율이 더 쉬워집니다. 최적의 시간을 찾아보세요.",
  image = `${SITE_URL}/og-image.png`,
  noindex,
}) => {
  const { pathname } = useLocation();
  const canonical = canonicalFor(pathname);
  const blocked = noindex === undefined ? NOINDEX_PATTERNS.some((re) => re.test(pathname)) : noindex;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {/* react-helmet-async는 자식에 false/null이 섞이면 블록 전체를 버린다. 조건부로 렌더하지 않는다. */}
      <meta name="robots" content={blocked ? "noindex, nofollow" : "index, follow"} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default Seo;
