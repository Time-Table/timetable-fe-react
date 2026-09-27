#!/usr/bin/env python3
"""
Pretendard 웹 글꼴을 글자 묶음별 WOFF2로 나눈다.

왜: 원본 woff는 굵기마다 약 1.1MB(한글 11,172자 전부)다. 랜딩 한 번에 4~5개 굵기를 받아
    느린 모바일에서 5.5MB를 받느라 글꼴이 30초 넘게 바뀌지 않았다.
    브라우저는 unicode-range가 겹치는 @font-face 중 나중에 선언된 것부터, 그 글자가 필요할 때만 받는다.
    그래서 자주 쓰는 글자 묶음을 작게 따로 떼면 대부분의 화면은 그 묶음만 받는다.

묶음(한 굵기당, CSS에는 아래 순서의 역순으로 우선한다):
  core   사이트 문구(src·public)에 나오는 글자 + 라틴·일반 문장부호·CJK 문장부호·호환 자모
  common KS X 1001 완성형 2,350자 중 core에 없는 글자      (범위: 한글 음절 전체)
  rare1~4 나머지 한글 음절을 코드 순서로 넷으로 나눈 것   (범위: 각 구간)
  other  그 밖에 글꼴에 있는 모든 글자(가나·한자 등)      (범위 없음 = 마지막 대체)

글자 모양은 바꾸지 않는다. 원본의 윤곽선·자간·OpenType 기능을 그대로 둔 채 글자만 골라 담는다.
다만 서로 다른 묶음에 든 두 글자 사이의 커닝은 적용되지 않는다(웹 글꼴 분할의 일반적 한계).

실행(저장소 루트 아닌 timetable-fe-react에서):
  pip install fonttools brotli
  python3 scripts/subset-fonts.py
사이트 문구가 크게 바뀌어 core 밖 글자가 늘면 다시 돌린다. 안 돌려도 글자는 common·rare에서 나온다.
"""
import glob
import os

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "src", "assets", "font")
OUT_DIR = os.path.join(SRC_DIR, "web")
WEIGHTS = ["Black", "ExtraBold", "Bold", "SemiBold", "Medium", "Regular", "Light", "ExtraLight", "Thin"]

HANGUL_FIRST, HANGUL_LAST = 0xAC00, 0xD7A3
RARE_PARTS = 4
# 라틴·일반 문장부호·CJK 문장부호·호환 자모. 입력 첫 글자(자모)와 흔한 부호에 쓰인다.
# 화살표·도형 같은 기호는 사이트 문구에 실제로 나오는 것만 corpus로 들어간다.
CORE_BLOCKS = [(0x0000, 0x00FF), (0x2000, 0x206F), (0x3000, 0x303F), (0x3131, 0x318F)]


def corpus_chars():
    found = set()
    files = glob.glob(os.path.join(ROOT, "src", "**", "*.js"), recursive=True)
    files += glob.glob(os.path.join(ROOT, "src", "**", "*.jsx"), recursive=True)
    files += glob.glob(os.path.join(ROOT, "public", "*.txt"))
    files += glob.glob(os.path.join(ROOT, "public", "*.html"))
    for path in files:
        with open(path, encoding="utf-8", errors="ignore") as f:
            found.update(ord(ch) for ch in f.read())
    return found


def ksx1001_syllables():
    return {c for c in range(HANGUL_FIRST, HANGUL_LAST + 1) if len(chr(c).encode("euc_kr", errors="ignore")) == 2}


def to_ranges(codepoints):
    cps = sorted(codepoints)
    runs, start, prev = [], None, None
    for c in cps:
        if start is None:
            start = prev = c
        elif c == prev + 1:
            prev = c
        else:
            runs.append((start, prev))
            start = prev = c
    if start is not None:
        runs.append((start, prev))
    return ", ".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in runs)


def plan(cmap_cps):
    """묶음 이름 → (담을 코드포인트, CSS unicode-range 또는 None)."""
    cmap_cps = set(cmap_cps)
    hangul = {c for c in cmap_cps if HANGUL_FIRST <= c <= HANGUL_LAST}
    core = {c for c in cmap_cps if any(a <= c <= b for a, b in CORE_BLOCKS)} | (corpus_chars() & cmap_cps)
    common = (ksx1001_syllables() & hangul) - core
    rest = hangul - core - common
    parts = []
    step = -(-(HANGUL_LAST - HANGUL_FIRST + 1) // RARE_PARTS)
    for i in range(RARE_PARTS):
        lo = HANGUL_FIRST + i * step
        hi = min(HANGUL_LAST, lo + step - 1)
        parts.append((f"rare{i + 1}", {c for c in rest if lo <= c <= hi}, f"U+{lo:X}-{hi:X}"))
    other = cmap_cps - core - common - rest
    # CSS에 적는 순서. 앞에 둔 것일수록 나중에 찾는다(겹치는 범위는 뒤에 선언한 면이 먼저다).
    return (
        [("other", other, None)]
        + parts
        + [("common", common, f"U+{HANGUL_FIRST:X}-{HANGUL_LAST:X}"), ("core", core, to_ranges(core))]
    )


def make_subset(src, codepoints, out_path):
    # 글꼴 전체 외곽 상자(head bbox)를 다시 계산하지 않는다. 바뀌면 글자 가장자리 흐림이 미세하게 달라진다.
    font = TTFont(src, recalcBBoxes=False)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.name_legacy = True
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.glyph_names = True
    options.legacy_kern = True
    options.hinting = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(out_path)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for old in glob.glob(os.path.join(OUT_DIR, "*.woff2")):
        os.remove(old)
    base = TTFont(os.path.join(SRC_DIR, "Pretendard-Regular.woff"))
    slices = plan(base.getBestCmap().keys())
    css = [
        "/* scripts/subset-fonts.py가 만든 파일이다. 손으로 고치지 않는다. */",
        "/* 묶음 순서가 곧 우선순위다: 뒤에 선언한 묶음(core)부터 찾고, 없는 글자만 앞 묶음을 받는다. */",
    ]
    for weight in WEIGHTS:
        src = os.path.join(SRC_DIR, f"Pretendard-{weight}.woff")
        cmap = set(TTFont(src).getBestCmap().keys())
        for name, cps, urange in slices:
            cps = cps & cmap
            if not cps:
                continue
            file_name = f"Pretendard-{weight}.{name}.woff2"
            make_subset(src, cps, os.path.join(OUT_DIR, file_name))
            rule = [
                "@font-face {",
                f'  font-family: "Pretendard-{weight}";',
                f'  src: url("./{file_name}") format("woff2");',
                "  font-display: swap;",
            ]
            if urange:
                rule.append(f"  unicode-range: {urange};")
            rule.append("}")
            css.append("\n".join(rule))
        print("done", weight)
    with open(os.path.join(OUT_DIR, "pretendard.css"), "w", encoding="utf-8") as f:
        f.write("\n\n".join(css) + "\n")
    for name, cps, _ in slices:
        print(f"{name:7s} {len(cps):5d} codepoints")


if __name__ == "__main__":
    main()
