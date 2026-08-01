import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../Seo";

/**
 * 서비스 자체를 설명하는 구조화 데이터.
 * 블로그 글에는 `BlogPosting`이 따로 있고, 이건 "타임테이블이라는 도구"를 검색엔진에 알린다.
 * 랜딩(`/`, `/create`)에서만 렌더한다. 페이지마다 중복 선언하지 않는다.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "타임테이블",
  alternateName: "Timetable",
  url: `${SITE_URL}/`,
  description:
    "약속 조율을 링크 하나로 끝내는 무료 웹 서비스. 로그인 없이 30초 만에 만들고, 참여자들이 가능한 시간을 드래그로 표시하면 가장 많이 겹치는 골든타임을 자동으로 계산한다.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "All",
  browserRequirements: "최신 웹 브라우저",
  inLanguage: "ko-KR",
  image: `${SITE_URL}/og-image.png`,
  // 무료라는 사실은 경쟁 도구와 갈리는 지점이라 명시한다.
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
  featureList: [
    "로그인 없이 약속 조율",
    "드래그로 가능한 시간 선택",
    "실시간 참여자 집계",
    "골든타임 자동 계산",
  ],
};

// 검색 결과에 사이트명을 정확히 표기시키기 위한 선언. WebApplication과 역할이 다르다.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "타임테이블",
  alternateName: "Timetable",
  url: `${SITE_URL}/`,
  inLanguage: "ko-KR",
};

export default function ServiceJsonLd() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(siteJsonLd)}</script>
    </Helmet>
  );
}
