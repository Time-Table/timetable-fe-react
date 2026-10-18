import fs from "fs";
import path from "path";

// 공유 미리보기 숫자는 사람이 public/index.html 을 직접 고쳐 바꾼다. 두 태그가 어긋나거나 없는 파일을 가리키지 않게 막는다.
const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "public", "index.html"), "utf8");
const contentOf = (pattern) => html.match(pattern)?.[1];

describe("public/index.html 공유 미리보기 이미지", () => {
  const ogImage = contentOf(/<meta id="og-image" property="og:image" content="([^"]+)"/);
  const twitterImage = contentOf(/<meta name="twitter:image" content="([^"]+)"/);

  test("og:image 와 twitter:image 가 같은 이미지를 가리킨다", () => {
    expect(ogImage).toMatch(/^https:\/\/timetable2\.com\/og-image-\d+\.png$/);
    expect(twitterImage).toBe(ogImage);
  });

  test("가리키는 이미지가 public/ 에 있다", () => {
    expect(fs.existsSync(path.join(ROOT, "public", new URL(ogImage).pathname))).toBe(true);
  });
});
