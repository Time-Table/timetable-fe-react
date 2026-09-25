import { Fragment, useEffect } from "react";
import styled from "@emotion/styled";
import isPropValid from "@emotion/is-prop-valid";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import theme from "../../theme";
import Seo, { SITE_URL } from "../../Seo";
import { blogPosts } from "../../data/blogPosts";
import { LEGACY_SLUGS } from "../../data/blogRedirects";
import { IoArrowBack } from "react-icons/io5";
import AdSense from "../../component/AdSense";
import NotFound from "../NotFound";
import { trackBlogView } from "../../utils/analytics";
import { parseContent, planImageSlots } from "./blogContent";

export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 예전 주소는 /blog/1 처럼 숫자였다. 색인돼 있으므로 계속 받아주되 slug 주소로 넘긴다.
  const isLegacyId = /^\d+$/.test(id);
  const post = isLegacyId
    ? blogPosts.find((p) => p.id === parseInt(id, 10))
    : blogPosts.find((p) => p.slug === id);

  // 조회 기록은 slug 주소로 확정된 글에서만 남긴다. 숫자 id는 곧 slug로 리다이렉트되므로
  // 여기서 세면 한 번의 방문이 두 번 기록된다. 훅이라 early return보다 앞에 둔다.
  const trackedSlug = post && !isLegacyId ? post.slug : null;
  useEffect(() => {
    if (trackedSlug) trackBlogView(trackedSlug);
  }, [trackedSlug]);

  // 교체된 글의 옛 slug는 새 글로 보낸다. 운영은 _redirects 301이 먼저 처리하고, 여기는 그 뒤의 안전망이다.
  if (!post && Object.prototype.hasOwnProperty.call(LEGACY_SLUGS, id)) {
    return <Navigate to={`/blog/${LEGACY_SLUGS[id]}`} replace />;
  }
  if (!post) return <NotFound />;
  if (isLegacyId) return <Navigate to={`/blog/${post.slug}`} replace />;

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const blocks = parseContent(post.content);
  const images = post.images || [];
  const imageSlots = planImageSlots(blocks, images.slice(1));
  // 핵심 요약은 글의 첫 <p>여야 한다. 검색·AI 요약이 첫 문단을 답으로 집는다.
  const lead = post.lead || post.summary;
  const faq = Array.isArray(post.faq) ? post.faq : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    // publishedAt(시각 포함)이 있으면 그것을 쓴다. 표시용 date는 날짜만이다.
    datePublished: post.publishedAt || post.date,
    dateModified: post.updated || post.publishedAt || post.date,
    inLanguage: "ko-KR",
    image: post.images?.[0]?.url,
    author: {
      "@type": "Organization",
      name: post.author,
      description: post.authorBio,
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "타임테이블",
      url: `${SITE_URL}/`,
    },
    url: postUrl,
    mainEntityOfPage: postUrl,
  };

  // 화면에 보이는 FAQ만 구조화 데이터로 낸다. 화면에 없는 문답을 넣으면 정책 위반이다.
  const faqJsonLd = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;

  return (
    <>
      <Seo
        title={`${post.title} - 타임테이블`}
        description={post.summary}
        image={post.images?.[0]?.url}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      {/* react-helmet-async는 자식에 null이 섞이면 블록을 버리므로 Helmet 자체를 조건부로 둔다. */}
      {faqJsonLd && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        </Helmet>
      )}
      <PageWrapper>
        <BackButton onClick={() => navigate("/blog")}>
          <IoArrowBack size={24} /> 목록으로 돌아가기
        </BackButton>
        <Article>
          <Header>
            <Category>{post.category}</Category>
            <Title>{post.title}</Title>
            <Meta>
              <MetaDates>
                <MetaDate dateTime={post.publishedAt || post.date}>
                  {post.updated ? `발행 ${post.date}` : post.date}
                </MetaDate>
                {post.updated && (
                  <>
                    <MetaDivider>·</MetaDivider>
                    <MetaDate dateTime={post.updated}>수정 {post.updated}</MetaDate>
                  </>
                )}
              </MetaDates>
              <MetaDivider>·</MetaDivider>
              <MetaAuthor>
                <AuthorName>{post.author}</AuthorName>
                <AuthorBio>{post.authorBio}</AuthorBio>
              </MetaAuthor>
            </Meta>
          </Header>
          <Content>
            {lead && (
              <Lead>
                <LeadLabel>핵심 요약</LeadLabel>
                <LeadText>{lead}</LeadText>
              </Lead>
            )}
            {images[0] && (
              <ArticleImage
                src={images[0].url}
                alt={images[0].alt}
                width="800"
                height="420"
                loading="eager"
                fetchpriority="high"
              />
            )}
            {blocks.map((block, index) => (
              <Fragment key={index}>
                {block.type === "heading" ? (
                  <SubHeading>{block.text}</SubHeading>
                ) : (
                  <Paragraph>{block.text}</Paragraph>
                )}
                {(imageSlots.get(index) || []).map((image, i) => (
                  <ArticleImage
                    key={`img-${index}-${i}`}
                    src={image.url}
                    alt={image.alt}
                    width="800"
                    height="420"
                    loading="lazy"
                  />
                ))}
              </Fragment>
            ))}
            {faq.length > 0 && (
              <FaqSection>
                <SubHeading>자주 묻는 질문</SubHeading>
                {/* "Q. " "A. "는 CSS ::before가 아니라 텍스트다. 크롤러와 스크린리더가 읽어야 한다. */}
                {faq.map(({ q, a }) => (
                  <FaqItem key={q}>
                    <h3>{`Q. ${q}`}</h3>
                    <p>{`A. ${a}`}</p>
                  </FaqItem>
                ))}
              </FaqSection>
            )}
          </Content>
          <AdSense isReady={true} />
          <Footer>
            <p>
              이 정보가 도움이 되셨나요? 여러 명의 <Link to="/appointment-scheduling-guide">약속 조율</Link>이 필요하다면
              타임테이블에서 링크 하나로 끝낼 수 있습니다.{" "}
              <Link to="/guide">이용 가이드</Link>도 함께 보세요.
            </p>
            {/* 버튼이 아니라 링크여야 크롤러가 따라간다. */}
            <HomeButton as={Link} to="/">
              무료로 약속 시간 정하기
            </HomeButton>
          </Footer>
        </Article>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.main`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px 80px;
  background-color: ${theme.text.gamma[950]};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${theme.text.gamma[400]};
  font-family: "Pretendard-Medium";
  cursor: pointer;
  margin-bottom: 30px;
  &:hover {
    color: ${theme.color.primary};
  }
`;

const Article = styled.article`
  background: white;
  padding: 60px;
  border-radius: 24px;
  border: 1px solid ${theme.text.gamma[900]};
  @media (max-width: 480px) {
    padding: 30px;
  }
`;

const Header = styled.header`
  margin-bottom: 40px;
  text-align: center;
`;

const Category = styled.span`
  color: ${theme.color.primary};
  font-family: "Pretendard-Bold";
  font-size: 16px;
  margin-bottom: 12px;
  display: block;
`;

const Title = styled.h1`
  font-family: "Pretendard-Black";
  font-size: 36px;
  color: ${theme.text.gamma[100]};
  line-height: 1.3;
  margin-bottom: 20px;
  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
`;

// 메타 줄은 gamma[500](3.64:1)이 AA 미달이라 gamma[400](6.39:1)로 올렸다.
const MetaDates = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
`;

const MetaDate = styled.time`
  color: ${theme.text.gamma[400]};
  font-size: 14px;
  font-family: "Pretendard-Regular";
`;

const MetaDivider = styled.span`
  color: ${theme.text.gamma[400]};
  font-size: 14px;
`;

const MetaAuthor = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
`;

const AuthorName = styled.span`
  white-space: nowrap;
  font-family: "Pretendard-SemiBold";
  font-size: 14px;
  color: ${theme.text.gamma[200]};
`;

const AuthorBio = styled.span`
  word-break: keep-all;
  font-family: "Pretendard-Regular";
  font-size: 13px;
  color: ${theme.text.gamma[400]};
`;

const Content = styled.div`
  margin-top: 40px;
`;

// 소제목에 브랜드색을 쓰지 않는다(흰 배경 2.72:1). 제목 36px → 소제목 24px → 본문 18px 한 단계씩.
const SubHeading = styled.h2`
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.title2};
  line-height: ${theme.font.lineHeight.snug};
  color: ${theme.text.gamma[100]};
  margin: ${theme.space[10]} 0 ${theme.space[4]};

  @media (max-width: 480px) {
    font-size: ${theme.font.size.title3};
    margin: ${theme.space[8]} 0 ${theme.space[3]};
  }
`;

// 핵심 요약 카드. 라벨은 span, 본문은 p 하나 — 글의 첫 <p>가 요약이어야 한다.
const Lead = styled.section`
  background: ${theme.color.primarySurface};
  border-left: 4px solid ${theme.color.primaryBorder};
  border-radius: ${theme.radius.md};
  padding: ${theme.space[5]};
  margin-bottom: ${theme.space[8]};

  @media (max-width: 480px) {
    padding: ${theme.space[4]};
  }
`;

const LeadLabel = styled.span`
  display: block;
  font-family: ${theme.font.family.bold};
  font-size: ${theme.font.size.small};
  color: ${theme.color.primaryText};
  margin-bottom: ${theme.space[2]};
`;

const LeadText = styled.p`
  font-family: ${theme.font.family.medium};
  font-size: ${theme.font.size.bodyLg};
  line-height: ${theme.font.lineHeight.relaxed};
  color: ${theme.text.gamma[200]};
  margin: 0;
`;

const FaqSection = styled.section``;

const FaqItem = styled.div`
  background: ${theme.text.gamma[950]};
  padding: ${theme.space[5]};
  border-radius: ${theme.radius.md};

  & + & {
    margin-top: ${theme.space[5]};
  }

  h3 {
    font-family: ${theme.font.family.bold};
    font-size: ${theme.font.size.bodyLg};
    line-height: ${theme.font.lineHeight.snug};
    color: ${theme.text.gamma[100]};
    margin: 0 0 ${theme.space[2]};
  }

  p {
    font-family: ${theme.font.family.regular};
    font-size: ${theme.font.size.bodyLg};
    line-height: ${theme.font.lineHeight.relaxed};
    color: ${theme.text.gamma[200]};
    margin: 0;
  }

  @media (max-width: 480px) {
    padding: ${theme.space[4]};
  }
`;

// emotion은 알려진 HTML 속성만 DOM으로 넘긴다. `fetchpriority`는 그 목록(is-prop-valid 1.3)에 없어
// 잘리므로 그것만 추가로 허용한다. 나머지는 기본 필터 그대로라 as·theme 같은 prop은 DOM에 새지 않는다.
const ArticleImage = styled("img", {
  shouldForwardProp: (prop) => prop === "fetchpriority" || isPropValid(prop),
})`
  /* width/height 속성과 같은 비율. 이미지가 오기 전에 자리를 잡아 레이아웃 이동(CLS)을 막는다. */
  width: 100%;
  height: auto;
  aspect-ratio: 800 / 420;
  border-radius: 16px;
  margin: 32px 0;
  object-fit: cover;
  display: block;
  border: 1px solid ${theme.text.gamma[900]};
`;

const Paragraph = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 18px;
  line-height: 1.8;
  color: ${theme.text.gamma[200]};
  margin-bottom: 24px;
  white-space: pre-line;
`;

const Footer = styled.div`
  margin-top: 60px;
  padding-top: 40px;
  border-top: 1px solid ${theme.text.gamma[900]};
  text-align: center;
  p {
    color: ${theme.text.gamma[500]};
    margin-bottom: 24px;
  }
`;

const HomeButton = styled.button`
  display: inline-block;
  text-decoration: none;
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-family: "Pretendard-Bold";
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  &:hover {
    transform: translateY(-2px);
  }
`;
