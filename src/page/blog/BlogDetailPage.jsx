import styled from "@emotion/styled";
import { useParams, useNavigate } from "react-router-dom";
import theme from "../../theme";
import Seo from "../../Seo";
import { blogPosts } from "../../data/blogPosts";
import { IoArrowBack } from "react-icons/io5";

export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = blogPosts.find((p) => p.id === parseInt(id));

  if (!post) return <div>Post not found</div>;

  return (
    <>
      <Seo title={`${post.title} - 타임테이블2`} description={post.summary} />
      <PageWrapper>
        <BackButton onClick={() => navigate("/blog")}>
          <IoArrowBack size={24} /> 목록으로 돌아가기
        </BackButton>
        <Article>
          <Header>
            <Category>{post.category}</Category>
            <Title>{post.title}</Title>
            <Date>{post.date}</Date>
          </Header>
          <Content>
            {post.content.split("\n\n").map((paragraph, index) => (
              <Paragraph key={index}>{paragraph}</Paragraph>
            ))}
          </Content>
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
  margin-bottom: 16px;
  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const Date = styled.time`
  color: ${theme.text.gamma[500]};
  font-size: 15px;
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
