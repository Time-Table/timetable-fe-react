import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import theme from "../../theme";
import Seo from "../../Seo";
import { blogPosts } from "../../data/blogPosts";

export default function BlogListPage() {
  const navigate = useNavigate();

  // 최신글이 위로 오도록 날짜 내림차순 정렬
  const sortedPosts = [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <Seo
        title="일정 관리 칼럼 - 타임테이블2"
        description="효율적인 일정 조율과 시간 관리를 위한 전문가들의 칼럼을 확인해보세요."
      />
      <PageWrapper>
        <Header>
          <Title>Time Table 칼럼</Title>
          <SubTitle>더 나은 협업과 효율적인 삶을 위한 가이드</SubTitle>
        </Header>
        <PostGrid>
          {sortedPosts.map((post) => (
            <PostCard key={post.id} onClick={() => navigate(`/blog/${post.id}`)}>
              <Category>{post.category}</Category>
              <PostTitle>{post.title}</PostTitle>
              <Summary>{post.summary}</Summary>
              <PostMeta>
                <PostDate>{post.date}</PostDate>
                <PostAuthor>{post.author}</PostAuthor>
              </PostMeta>
            </PostCard>
          ))}
        </PostGrid>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 60px 20px;
  background-color: ${theme.text.gamma[950]};
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const Title = styled.h1`
  font-family: "Pretendard-Black";
  font-size: 42px;
  color: ${theme.text.gamma[100]};
  margin-bottom: 16px;
`;

const SubTitle = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 18px;
  color: ${theme.text.gamma[500]};
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
`;

const PostCard = styled.div`
  background: white;
  padding: 30px;
  border-radius: 20px;
  border: 1px solid ${theme.text.gamma[900]};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-5px);
    border-color: ${theme.color.primary};
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  }
`;

const Category = styled.span`
  font-family: "Pretendard-Bold";
  font-size: 14px;
  color: ${theme.color.primary};
  margin-bottom: 12px;
`;

const PostTitle = styled.h2`
  font-family: "Pretendard-Bold";
  font-size: 22px;
  color: ${theme.text.gamma[100]};
  margin-bottom: 16px;
  line-height: 1.4;
`;

const Summary = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 15px;
  color: ${theme.text.gamma[500]};
  line-height: 1.6;
  margin-bottom: 20px;
  flex-grow: 1;
`;

const PostMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const PostDate = styled.span`
  font-family: "Pretendard-Regular";
  font-size: 13px;
  color: ${theme.text.gamma[500]};
`;

const PostAuthor = styled.span`
  font-family: "Pretendard-Medium";
  font-size: 13px;
  color: ${theme.color.primary};
`;
