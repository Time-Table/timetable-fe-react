import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import theme from "../theme";
import Seo, { SITE_URL } from "../Seo";

/**
 * 필라 페이지. "약속 조율"이라는 핵심 검색어를 정면으로 받는 대표 문서다.
 * 블로그 글(위성)들이 이 페이지를 가리키고, 이 페이지가 /start 로 사용자를 보낸다.
 *
 * 홈(`/`)과 검색어가 겹치지 않게 역할을 나눈다.
 *   - `/`      : 브랜드 + 도구 진입 (거래 의도)
 *   - 이 페이지 : "약속 조율이 뭔지, 어떻게 하는지" (정보 탐색 의도)
 */

const FAQ = [
  {
    q: "타임테이블은 무료인가요?",
    a: "네. 테이블 생성, 참여자 수, 사용 기간에 제한이 없습니다. 결제 수단을 등록할 필요도 없습니다.",
  },
  {
    q: "참여하려면 회원가입을 해야 하나요?",
    a: "아니요. 링크를 받은 사람은 이름과 간단한 비밀번호만 입력하면 바로 시간을 표시할 수 있습니다. 이메일이나 전화번호를 수집하지 않습니다.",
  },
  {
    q: "몇 명까지 조율할 수 있나요?",
    a: "인원 제한이 없습니다. 2명이든 50명이든 같은 방식으로 동작하며, 인원이 늘수록 겹치는 시간을 눈으로 찾기 어려워지므로 오히려 도구의 효용이 커집니다.",
  },
  {
    q: "약속 시간을 정한 뒤 일정이 바뀌면 어떻게 하나요?",
    a: "참여자가 자신의 이름과 비밀번호로 다시 들어와 시간을 수정할 수 있습니다. 수정한 내용은 전체 시간표에 즉시 반영됩니다.",
  },
  {
    q: "만든 테이블은 얼마나 유지되나요?",
    a: "마지막 접속일로부터 일정 기간 보관됩니다. 확정된 약속은 별도로 캘린더에 기록해 두시길 권합니다.",
  },
];

const METHODS = [
  {
    name: "카카오톡 투표",
    good: "이미 단톡방에 모두 있어 추가 설치가 필요 없다",
    bad: "누가 언제 안 되는지가 그대로 노출돼 눈치를 보게 되고, 선택지를 미리 정해야 해서 시간 단위 조율이 어렵다",
  },
  {
    name: "엑셀 · 구글 시트",
    good: "칸을 원하는 대로 만들 수 있고 기록이 남는다",
    bad: "링크를 열고 자기 줄을 찾아 색칠하는 과정이 번거로워 응답률이 낮다. 실수로 남의 칸을 지우기도 한다",
  },
  {
    name: "When2meet",
    good: "드래그로 시간을 칠하는 방식이 직관적이다",
    bad: "영문 인터페이스라 안내가 한 번 더 필요하고, 모바일에서 칸이 작아 오조작이 잦다",
  },
  {
    name: "타임테이블",
    good: "한국어 · 모바일 우선. 로그인 없이 드래그로 입력하고, 가장 많이 겹치는 시간을 자동으로 계산해 준다",
    bad: "확정된 일정을 관리하는 캘린더 기능은 없다. 시간을 정하는 단계까지를 담당한다",
  },
];

const RELATED = [
  { to: "/blog/group-project-schedule-coordination", label: "조별 과제 시간 조율 전략" },
  { to: "/blog/remote-meeting-time-scheduling", label: "원격 회의 시간 정하는 법" },
  { to: "/blog/large-event-schedule-checklist", label: "대규모 행사 일정 조율 체크리스트" },
  { to: "/blog/meeting-agenda-and-time-limits", label: "회의 아젠다와 시간 제한 기술" },
];

export default function GuideSchedulingPage() {
  const pageUrl = `${SITE_URL}/appointment-scheduling-guide`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "약속 조율 완전 가이드",
    description:
      "3명 이상 모일 때 약속 시간을 정하는 방법을 비교하고, 가장 빠른 방식을 정리했습니다.",
    inLanguage: "ko-KR",
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    publisher: { "@type": "Organization", name: "타임테이블", url: `${SITE_URL}/` },
  };

  return (
    <>
      <Seo
        title="약속 조율 완전 가이드 — 방법 비교와 가장 빠른 방식"
        description="3명 이상 약속 조율은 왜 어려운지, 카카오톡 투표·엑셀·When2meet·전용 도구는 무엇이 다른지 비교하고, 링크 하나로 끝내는 방법을 정리했습니다."
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <PageWrapper>
        <Article>
          <PageTitle>약속 조율 완전 가이드</PageTitle>
          <Lead>
            사람이 셋만 넘어가도 &ldquo;언제 시간 돼?&rdquo;는 쉽게 끝나지 않습니다. 이 글은 약속
            조율이 왜 어려운지, 흔히 쓰는 방법들이 각각 어디서 막히는지, 그리고 가장 적은 품으로
            끝내는 방법을 정리한 문서입니다.
          </Lead>

          <Section>
            <h2>약속 조율이란</h2>
            <p>
              약속 조율은 여러 사람의 가능한 시간을 모아 <strong>모두가 겹치는 시간</strong>을
              찾아내는 과정입니다. 일정 조율, 시간 조율, 스케줄 조율이라고도 부릅니다. 핵심은
              &lsquo;내가 되는 시간&rsquo;이 아니라 &lsquo;우리가 되는 시간&rsquo;을 찾는 데
              있습니다.
            </p>
            <p>
              둘이라면 메신저로 몇 마디면 끝납니다. 문제는 인원이 늘 때 생깁니다. 3명이면 확인할
              조합이 3개지만, 6명이면 15개, 10명이면 45개로 늘어납니다. 사람 머리로 교집합을 찾는
              방식이 무너지는 지점이 대략 이 근처입니다.
            </p>
          </Section>

          <Section>
            <h2>왜 이렇게 오래 걸릴까</h2>
            <h3>정보가 한 사람에게만 있다</h3>
            <p>
              각자는 자기 일정만 압니다. 단톡방에서 &ldquo;언제 되세요?&rdquo;라고 물으면 먼저
              답한 사람의 시간에 나머지가 끌려가고, 뒤늦게 안 되는 사람이 나오면 처음부터 다시
              시작합니다.
            </p>
            <h3>거절이 심리적 비용이 된다</h3>
            <p>
              &ldquo;저는 그날 안 돼요&rdquo;를 여러 번 말하기는 부담스럽습니다. 그래서 무리해서
              맞추거나, 아예 답을 미룹니다. 응답이 늦어지는 진짜 이유가 게으름이 아니라 이
              부담인 경우가 많습니다.
            </p>
            <h3>취합하는 사람이 병목이 된다</h3>
            <p>
              주최자가 답변을 하나씩 읽고 표에 옮기는 동안 다른 사람의 일정이 또 바뀝니다. 인원이
              많을수록 취합이 끝나기 전에 조건이 달라집니다.
            </p>
          </Section>

          <Section>
            <h2>방법별 비교</h2>
            <p>
              흔히 쓰는 네 가지를 정리하면 이렇습니다. 상황에 따라 정답은 다릅니다.
            </p>
            <TableScroll>
              <ComparisonTable>
                <thead>
                  <tr>
                    <th scope="col">방법</th>
                    <th scope="col">좋은 점</th>
                    <th scope="col">막히는 점</th>
                  </tr>
                </thead>
                <tbody>
                  {METHODS.map(({ name, good, bad }) => (
                    <tr key={name}>
                      <th scope="row">{name}</th>
                      <td>{good}</td>
                      <td>{bad}</td>
                    </tr>
                  ))}
                </tbody>
              </ComparisonTable>
            </TableScroll>
            <p>
              정리하면 <strong>선택지가 적고 인원이 적으면 카카오톡 투표</strong>로 충분합니다.
              반대로 <strong>시간 단위로 조율해야 하거나 인원이 5명을 넘으면</strong> 드래그로
              입력하고 자동으로 집계되는 전용 도구가 확실히 빠릅니다.
            </p>
          </Section>

          <Section>
            <h2>링크 하나로 끝내는 방법</h2>
            <p>
              타임테이블은 위 문제들을 세 단계로 줄입니다. 회원가입도, 앱 설치도 없습니다.
            </p>
            <Steps>
              <li>
                <strong>후보 날짜와 시간대를 고릅니다.</strong> 모임 이름과 며칠 범위를 정하면 고유
                링크가 즉시 만들어집니다. 30초면 끝납니다.
              </li>
              <li>
                <strong>링크를 단톡방에 공유합니다.</strong> 받은 사람은 이름만 적고 자신이 가능한
                시간을 드래그로 칠합니다. 남이 안 되는 시간을 볼 필요가 없어 눈치 볼 일이 없습니다.
              </li>
              <li>
                <strong>겹치는 시간을 확인합니다.</strong> 색이 진할수록 많은 사람이 가능한
                시간입니다. 가장 많이 겹치는 구간은 &lsquo;골든타임&rsquo;으로 자동 계산되어 순위로
                표시됩니다.
              </li>
            </Steps>
            <CTABox>
              <p>값이 미리 채워져 있어 바로 확인해 볼 수 있습니다.</p>
              <CTALink to="/start">약속 조율 시작하기</CTALink>
            </CTABox>
          </Section>

          <Section>
            <h2>상황별 요령</h2>
            <p>
              같은 도구라도 모임 성격에 따라 요령이 다릅니다. 각 상황을 자세히 다룬 글을 함께
              보세요.
            </p>
            <ul>
              {RELATED.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
            <p>
              공통으로 통하는 원칙은 두 가지입니다. 첫째, <strong>응답 기한을 정해 알립니다.</strong>{" "}
              기한이 없으면 답이 계속 늦어집니다. 사흘 정도가 적당합니다. 둘째,{" "}
              <strong>후보 범위를 너무 넓게 잡지 않습니다.</strong> 한 달을 통째로 열면 오히려
              고르기 어려워집니다. 1~2주가 응답률이 가장 좋습니다.
            </p>
          </Section>

          <Section>
            <h2>자주 묻는 질문</h2>
            <FaqList>
              {FAQ.map(({ q, a }) => (
                <li key={q}>
                  <h3>{q}</h3>
                  <p>{a}</p>
                </li>
              ))}
            </FaqList>
          </Section>

          <Closing>
            <p>
              약속을 잡는 데 드는 시간은 모임 자체의 즐거움과 아무 상관이 없습니다. 그 과정을 짧게
              줄이는 것이 타임테이블이 하는 일의 전부입니다.
            </p>
            <CTALink to="/start">지금 만들어 보기</CTALink>
          </Closing>
        </Article>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.main`
  background-color: ${theme.text.gamma[950]};
  padding: 60px 20px 100px;
`;

const Article = styled.article`
  max-width: 760px;
  margin: 0 auto;
  background: white;
  border: 1px solid ${theme.text.gamma[900]};
  border-radius: 24px;
  padding: 60px;

  @media (max-width: 480px) {
    padding: 32px 22px;
    border-radius: 18px;
  }
`;

const PageTitle = styled.h1`
  font-family: "Pretendard-Black";
  font-size: 38px;
  line-height: 1.3;
  color: ${theme.text.gamma[100]};
  margin-bottom: 20px;

  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const Lead = styled.p`
  font-family: "Pretendard-Regular";
  font-size: 18px;
  line-height: 1.8;
  color: ${theme.text.gamma[400]};
  margin-bottom: 8px;
`;

const Section = styled.section`
  margin-top: 48px;

  h2 {
    font-family: "Pretendard-Bold";
    font-size: 26px;
    color: ${theme.text.gamma[100]};
    border-left: 4px solid ${theme.color.primary};
    padding-left: 12px;
    margin-bottom: 18px;

    @media (max-width: 480px) {
      font-size: 21px;
    }
  }

  h3 {
    font-family: "Pretendard-SemiBold";
    font-size: 19px;
    color: ${theme.text.gamma[200]};
    margin-top: 26px;
    margin-bottom: 8px;
  }

  p {
    font-family: "Pretendard-Regular";
    font-size: 17px;
    line-height: 1.85;
    color: ${theme.text.gamma[300]};
    margin-bottom: 16px;
  }

  ul {
    padding-left: 20px;
    margin-bottom: 16px;
  }

  li {
    font-size: 17px;
    line-height: 1.9;
    color: ${theme.text.gamma[300]};
  }

  a {
    color: ${theme.color.primary};
    text-decoration: underline;
  }
`;

/* 표는 자기 컨테이너 안에서만 가로 스크롤한다. 페이지 본문은 스크롤되지 않는다. */
const TableScroll = styled.div`
  overflow-x: auto;
  margin-bottom: 18px;
`;

const ComparisonTable = styled.table`
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: 15px;
  line-height: 1.7;

  th,
  td {
    border: 1px solid ${theme.text.gamma[900]};
    padding: 12px 14px;
    text-align: left;
    vertical-align: top;
    color: ${theme.text.gamma[300]};
  }

  thead th {
    background: ${theme.text.gamma[950]};
    font-family: "Pretendard-SemiBold";
    color: ${theme.text.gamma[100]};
  }

  tbody th {
    font-family: "Pretendard-SemiBold";
    color: ${theme.text.gamma[100]};
    white-space: nowrap;
  }
`;

const Steps = styled.ol`
  padding-left: 20px;
  margin-bottom: 24px;

  li {
    font-size: 17px;
    line-height: 1.9;
    color: ${theme.text.gamma[300]};
    margin-bottom: 12px;
  }

  strong {
    color: ${theme.text.gamma[100]};
  }
`;

const FaqList = styled.ul`
  list-style: none;
  padding: 0;

  li {
    background: ${theme.text.gamma[950]};
    border-radius: 14px;
    padding: 20px 22px;
    margin-bottom: 12px;
  }

  h3 {
    margin-top: 0;
    font-size: 17px;
  }

  p {
    margin-bottom: 0;
    font-size: 16px;
  }
`;

const CTABox = styled.div`
  margin-top: 28px;
  padding: 26px;
  background: ${theme.color.primary}0d;
  border: 1px solid ${theme.color.primary}33;
  border-radius: 16px;
  text-align: center;

  p {
    margin-bottom: 16px;
    color: ${theme.text.gamma[300]};
  }
`;

const Closing = styled.section`
  margin-top: 56px;
  padding-top: 32px;
  border-top: 1px solid ${theme.text.gamma[900]};
  text-align: center;

  p {
    font-size: 17px;
    line-height: 1.85;
    color: ${theme.text.gamma[400]};
    margin-bottom: 20px;
  }
`;

const CTALink = styled(Link)`
  display: inline-block;
  background: linear-gradient(45deg, ${theme.color.primaryTint}, ${theme.color.primary});
  color: white;
  font-family: "Pretendard-Bold";
  font-size: 17px;
  padding: 15px 32px;
  border-radius: 12px;
  text-decoration: none;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid ${theme.color.primary};
    outline-offset: 3px;
  }
`;
