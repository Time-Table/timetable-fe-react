import fs from "fs";
import path from "path";
import { DEFAULT_IMAGE, applyOgImage, parseCount, pickOgImage } from "../scripts/og-image";
import { OG_IMAGE } from "./Seo";

const ROOT = path.join(__dirname, "..");
const validBody = (count) => ({
  success: true,
  data: { count, asOf: "2026-10-09", startDate: "2026-09-10", days: 30 },
});

describe("빌드 때 고르는 공유 미리보기 이미지(scripts/og-image.js)", () => {
  test("참여 등록 건수를 50 단위로 내리고 100~500 사이로 자른다", () => {
    expect(pickOgImage(100)).toBe("https://timetable2.com/og-image-100.png");
    expect(pickOgImage(149)).toBe("https://timetable2.com/og-image-100.png");
    expect(pickOgImage(150)).toBe("https://timetable2.com/og-image-150.png");
    expect(pickOgImage(289)).toBe("https://timetable2.com/og-image-250.png");
    expect(pickOgImage(300)).toBe("https://timetable2.com/og-image-300.png");
    expect(pickOgImage(500)).toBe("https://timetable2.com/og-image-500.png");
    expect(pickOgImage(9999)).toBe("https://timetable2.com/og-image-500.png");
  });

  test("100 미만이면 숫자 없는 옛 이미지를 쓴다", () => {
    expect(pickOgImage(0)).toBe("https://timetable2.com/og-image.png");
    expect(pickOgImage(99)).toBe("https://timetable2.com/og-image.png");
  });

  test("고를 수 있는 이미지는 모두 public/ 에 있다", () => {
    const picked = new Set();
    for (let count = 0; count <= 1000; count += 1) picked.add(pickOgImage(count));
    expect(picked.size).toBe(10);
    picked.forEach((url) => {
      expect(fs.existsSync(path.join(ROOT, "public", new URL(url).pathname))).toBe(true);
    });
  });

  test("집계 응답 모양이 다르면 못 받은 것으로 본다", () => {
    expect(parseCount(validBody(289))).toBe(289);
    expect(parseCount(validBody(0))).toBe(0);
    expect(parseCount(null)).toBeNull();
    expect(parseCount({ ...validBody(289), success: false })).toBeNull();
    expect(parseCount(validBody(28.9))).toBeNull();
    expect(parseCount(validBody(-1))).toBeNull();
    expect(parseCount(validBody("289"))).toBeNull();
    expect(parseCount({ success: true, data: { ...validBody(289).data, days: 7 } })).toBeNull();
    expect(parseCount({ success: true, data: { ...validBody(289).data, asOf: "어제" } })).toBeNull();
  });

  test("public/index.html 의 og:image·twitter:image 두 곳만 바꾼다", () => {
    const html = fs.readFileSync(path.join(ROOT, "public", "index.html"), "utf8");
    const image = "https://timetable2.com/og-image-250.png";
    const next = applyOgImage(html, image);
    expect(next).not.toBeNull();
    expect(next).not.toContain(DEFAULT_IMAGE);
    expect(next).toContain(`property="og:image" content="${image}"`);
    expect(next).toContain(`name="twitter:image" content="${image}"`);
  });

  test("기본 이미지 주소가 두 곳이 아니면 손대지 않는다", () => {
    expect(applyOgImage(`<meta property="og:image" content="${DEFAULT_IMAGE}" />`, "x")).toBeNull();
    expect(applyOgImage("<html></html>", "x")).toBeNull();
  });

  test("정적 og:image 태그가 없으면 Helmet 기본 이미지는 index.html 기본값과 같다", () => {
    expect(OG_IMAGE).toBe(DEFAULT_IMAGE);
  });
});
