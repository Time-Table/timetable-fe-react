/**
 * public/llms.txt 와 public/llms-full.txt 를 src/data/blogPosts.js 에서 생성한다.
 *
 * 왜 필요한가: 이 사이트는 CSR이라 JS를 실행하지 않는 AI 크롤러(GPTBot·ClaudeBot·PerplexityBot 등)는
 * 블로그 본문을 볼 수 없다. llms.txt 는 사이트 요약과 정본 URL 목록, llms-full.txt 는 글 전문을
 * 마크다운으로 제공하는 정적 우회로다. (llms.txt 규격: https://llmstxt.org)
 *
 * 효과 근거는 약하다(2026-09 조사: 주요 AI 크롤러가 이 파일을 거의 요청하지 않음). 비용이 0에
 * 가까워 두는 것이지, 이것으로 AI 노출이 보장되지 않는다. 자세한 근거는 루트 specs/seo-strategy.md §9.
 *
 * 실행: npm run build 전에 prebuild 로 자동 실행된다. 실패해도 빌드를 막지 않는다.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SITE_URL = "https://timetable2.com";
const ROOT = path.join(__dirname, "..");

const loadPosts = () => {
  // blogPosts.js 는 ESM(export const)라 CJS require 가 안 된다. import 가 없는 순수 데이터 파일이므로
  // export 만 떼어 내고 평가한다.
  const source = fs.readFileSync(path.join(ROOT, "src/data/blogPosts.js"), "utf8");
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(source.replace(/^export const blogPosts/m, "module.exports.blogPosts"), sandbox);
  return sandbox.module.exports.blogPosts;
};

const toMarkdown = (post) => {
  const body = post.content
    .split("\n\n")
    .map((paragraph) => (paragraph.startsWith("■ ") ? `## ${paragraph.slice(2).trim()}` : paragraph.trim()))
    .join("\n\n");
  const faq = (post.faq || [])
    .map(({ q, a }) => `### ${q}\n\n${a}`)
    .join("\n\n");
  return [
    `# ${post.title}`,
    "",
    `- URL: ${SITE_URL}/blog/${post.slug}`,
    `- 발행: ${post.date}${post.updated ? ` · 수정: ${post.updated}` : ""}`,
    `- 저자: ${post.author}`,
    `- 분류: ${post.category}`,
    "",
    `> ${post.summary}`,
    "",
    body,
    faq ? `\n## 자주 묻는 질문\n\n${faq}` : "",
  ].join("\n");
};

const build = () => {
  const posts = [...loadPosts()].sort((a, b) => new Date(b.date) - new Date(a.date));

  const index = `# 타임테이블 (Timetable)

> 로그인 없이 링크 하나로 여러 사람의 가능한 시간을 모아 가장 많이 겹치는 시간(골든타임)을 찾는 무료 약속 조율 서비스. 한국어, 웹 기반, 설치 불필요.

주최자가 테이블을 만들어 링크를 공유하면, 참여자는 회원가입 없이 이름과 비밀번호를 입력하고 가능한 시간을 드래그로 표시한 뒤 저장한다. 색이 진할수록 많은 사람이 가능한 시간이며, 순위 화면이 최적 시간을 1위부터 보여준다.

## 핵심 페이지

- [약속 시간 정하기 (서비스 시작)](${SITE_URL}/): 테이블을 만들고 링크를 공유하는 메인 화면
- [약속 조율 완전 가이드](${SITE_URL}/appointment-scheduling-guide): 3명 이상 약속 조율이 어려운 이유와 카카오톡 투표·엑셀·When2meet·전용 도구 비교
- [이용 가이드](${SITE_URL}/guide): 테이블 생성부터 골든타임 확인까지 5단계
- [서비스 소개](${SITE_URL}/about)
- [블로그 목록](${SITE_URL}/blog)

## 블로그 글 (최신순)

${posts.map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.summary}`).join("\n")}

## Optional

- [이용약관](${SITE_URL}/terms)
- [개인정보처리방침](${SITE_URL}/privacy)
- [문의](${SITE_URL}/contact)
- [전체 글 전문 (마크다운)](${SITE_URL}/llms-full.txt)
`;

  const full = `# 타임테이블 블로그 전문\n\n> ${posts.length}편. 각 글의 정본 URL은 글머리에 있다. 생성일 ${new Date().toISOString().slice(0, 10)}.\n\n---\n\n${posts
    .map(toMarkdown)
    .join("\n\n---\n\n")}\n`;

  fs.writeFileSync(path.join(ROOT, "public/llms.txt"), index);
  fs.writeFileSync(path.join(ROOT, "public/llms-full.txt"), full);
  console.log(`llms.txt: ${posts.length}편 색인, llms-full.txt: ${(full.length / 1024).toFixed(0)}KB`);
};

try {
  build();
} catch (error) {
  // 이 파일이 없어도 서비스는 돌아간다. 빌드를 막지 않는다.
  console.warn("llms.txt 생성 실패(빌드는 계속):", error.message);
}
