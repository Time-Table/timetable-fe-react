import styled from "@emotion/styled";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import theme from "../../theme";
import Seo from "../../Seo";
import { blogPosts } from "../../data/blogPosts";
import { IoArrowBack } from "react-icons/io5";
import AdSense from "../../component/AdSense";

export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = blogPosts.find((p) => p.id === parseInt(id));

  if (!post) return <div>Post not found</div>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author,
      description: post.authorBio,
    },
    publisher: {
      "@type": "Organization",
      name: "타임테이블2",
      url: "https://www.timetable2.com",
    },
    url: `https://www.timetable2.com/blog/${post.id}`,
    mainEntityOfPage: `https://www.timetable2.com/blog/${post.id}`,
  };

  return (
    <>
      <Seo
        title={`${post.title} - 타임테이블2`}
        description={post.summary}
        url={`https://www.timetable2.com/blog/${post.id}`}
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
            {post.content.split("\n\n").map((paragraph, index) => (
              <Paragraph key={index}>{paragraph}</Paragraph>
            ))}
          </Content>
          <AdSense isReady={true} />
          <Footer>
            <p>이 정보가 도움이 되셨나요? 효율적인 일정 조율이 필요할 땐 타임테이블2를 이용해보세요.</p>
            <HomeButton onClick={() => navigate("/create")}>무료 시간표 만들기</HomeButton>
          </Footer>
        </Article>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.div`
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
  color: ${theme.text.gamma[700]};
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
