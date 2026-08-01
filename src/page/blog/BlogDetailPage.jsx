import styled from "@emotion/styled";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import theme from "../../theme";
import Seo, { SITE_URL } from "../../Seo";
import { blogPosts } from "../../data/blogPosts";
import { IoArrowBack } from "react-icons/io5";
import AdSense from "../../component/AdSense";
import NotFound from "../NotFound";

export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 예전 주소는 /blog/1 처럼 숫자였다. 색인돼 있으므로 계속 받아주되 slug 주소로 넘긴다.
  const isLegacyId = /^\d+$/.test(id);
  const post = isLegacyId
    ? blogPosts.find((p) => p.id === parseInt(id, 10))
    : blogPosts.find((p) => p.slug === id);

  if (!post) return <NotFound />;
  if (isLegacyId) return <Navigate to={`/blog/${post.slug}`} replace />;

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "ko-KR",
    image: post.images?.[0]?.url,
    author: {
      "@type": "Person",
      name: post.author,
      description: post.authorBio,
    },
    publisher: {
      "@type": "Organization",
      name: "타임테이블",
      url: `${SITE_URL}/`,
    },
    url: postUrl,
    mainEntityOfPage: postUrl,
  };

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
      <PageWrapper>
        <BackButton onClick={() => navigate("/blog")}>
          <IoArrowBack size={24} /> 목록으로 돌아가기
        </BackButton>
        <Article>
          <Header>
            <Category>{post.category}</Category>
            <Title>{post.title}</Title>
            <Meta>
              <MetaDate dateTime={post.date}>{post.date}</MetaDate>
              <MetaDivider>·</MetaDivider>
              <MetaAuthor>
                <AuthorName>{post.author}</AuthorName>
                <AuthorBio>{post.authorBio}</AuthorBio>
              </MetaAuthor>
            </Meta>
          </Header>
          <Content>
            {(() => {
              const paragraphs = post.content.split("\n\n");
              const images = post.images || [];
              const result = [];
              if (images[0]) {
                result.push(<ArticleImage key="img-0" src={images[0].url} alt={images[0].alt} loading="lazy" />);
              }
              const remaining = images.slice(1);
              const insertPoints = remaining.map((_, i) =>
                Math.floor(paragraphs.length * ((i + 1) / (remaining.length + 1)))
              );
              paragraphs.forEach((paragraph, index) => {
                result.push(<Paragraph key={index}>{paragraph}</Paragraph>);
                const imgIdx = insertPoints.indexOf(index + 1);
                if (imgIdx !== -1) {
                  result.push(
                    <ArticleImage key={`img-${imgIdx + 1}`} src={remaining[imgIdx].url} alt={remaining[imgIdx].alt} loading="lazy" />
                  );
                }
              });
              return result;
            })()}
          </Content>
          <AdSense isReady={true} />
          <Footer>
            <p>
              이 정보가 도움이 되셨나요? 여러 명의 <Link to="/">약속 조율</Link>이 필요하다면
              타임테이블에서 링크 하나로 끝낼 수 있습니다.{" "}
              <Link to="/guide">이용 가이드</Link>도 함께 보세요.
            </p>
            {/* 버튼이 아니라 링크여야 크롤러가 따라간다. */}
            <HomeButton as={Link} to="/">
              무료로 약속 조율 시작하기
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

const MetaDate = styled.time`
  color: ${theme.text.gamma[500]};
  font-size: 14px;
  font-family: "Pretendard-Regular";
`;

const MetaDivider = styled.span`
  color: ${theme.text.gamma[500]};
  font-size: 14px;
`;

const MetaAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AuthorName = styled.span`
  font-family: "Pretendard-SemiBold";
  font-size: 14px;
  color: ${theme.text.gamma[200]};
`;

const AuthorBio = styled.span`
  font-family: "Pretendard-Regular";
  font-size: 13px;
  color: ${theme.text.gamma[500]};
`;

const Content = styled.div`
  margin-top: 40px;
`;

const ArticleImage = styled.img`
  width: 100%;
  border-radius: 16px;
  margin: 32px 0;
  object-fit: cover;
  max-height: 420px;
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
