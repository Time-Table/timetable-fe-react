/**
 * 첫 저장 폭죽: 코랄 링(2026-10-01 사람 확정, 시안 5개 중 5).
 * "내 시간 고치기" 버튼 자리에서 코랄 고리 두 겹이 번지고 작은 점이 흩어진다(약 0.8초).
 * 외부 라이브러리 없이 캔버스 하나로 그리고, 다 끝나면 캔버스를 치운다.
 * 동작 줄이기 설정이면 터뜨리지 않는다. 캔버스는 누르기를 막지 않고, 창·안내 문구보다 앞에 둔다(사람 지시).
 */
import theme from "../../../theme";

// 사이트 헤더(1000) 위, 창(1040)·안내 문구(1050) 앞, sweetalert2 알림(1060) 뒤.
export const CONFETTI_Z = 1055;

const DOTS = [theme.color.primary, "#ff9b9b", "#ffd166"];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const reduced = () => {
  try {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (error) {
    return false;
  }
};

let canvas = null;
let ctx = null;
let parts = [];
let raf = 0;
let W = 0;
let H = 0;

const resize = () => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

const stop = () => {
  cancelAnimationFrame(raf);
  raf = 0;
  parts = [];
  if (canvas) canvas.remove();
  canvas = null;
  ctx = null;
  window.removeEventListener("resize", resize);
};

// 고리 두 겹(뒤 고리는 8프레임 늦게)과 사방으로 흩어지는 점 22개
const make = (x, y) => [
  { x, y, type: "ring", r0: 18, r1: 120, width: 3, life: 0, max: 42, color: theme.color.primary },
  { x, y, type: "ring", r0: 12, r1: 90, width: 2, life: -8, max: 38, color: "#ffc2c2" },
  ...Array.from({ length: 22 }, () => {
    const a = rand(0, Math.PI * 2);
    const s = rand(2.4, 4.6);
    return { x, y, type: "dot", vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 0.95, size: rand(2, 3.2), color: pick(DOTS), life: 0, max: rand(38, 52) };
  }),
];

const step = (p) => {
  p.life += 1;
  if (p.life <= 0 || p.type === "ring") return;
  p.vx *= p.drag;
  p.vy *= p.drag;
  p.x += p.vx;
  p.y += p.vy;
};

const draw = (p) => {
  if (p.life <= 0) return;
  if (p.type === "ring") {
    const t = p.life / p.max;
    const e = 1 - (1 - t) * (1 - t);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.width * (1 - t) + 0.5;
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * e, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  ctx.globalAlpha = Math.max(0, Math.min(1, (1 - p.life / p.max) * 1.4));
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();
};

const tick = () => {
  if (!ctx) {
    stop();
    return;
  }
  ctx.clearRect(0, 0, W, H);
  parts = parts.filter((p) => p.life < p.max);
  parts.forEach((p) => {
    step(p);
    draw(p);
  });
  ctx.globalAlpha = 1;
  if (parts.length) raf = requestAnimationFrame(tick);
  else stop();
};

/** origin(버튼 자리) 가운데에서 터뜨린다. 없으면 화면 아래 가운데. 동작 줄이기이거나 그릴 수 없으면 false. */
export const fireConfetti = ({ origin } = {}) => {
  try {
    if (reduced()) return false;
    const x = origin ? origin.left + origin.width / 2 : window.innerWidth / 2;
    const y = origin ? origin.top + origin.height / 2 : window.innerHeight - 80;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      canvas.dataset.confetti = "";
      Object.assign(canvas.style, { position: "fixed", inset: "0", zIndex: String(CONFETTI_Z), pointerEvents: "none" });
      document.body.append(canvas);
      resize();
      window.addEventListener("resize", resize);
    }
    if (!ctx) {
      stop();
      return false;
    }
    parts.push(...make(x, y));
    if (!raf) raf = requestAnimationFrame(tick);
    return true;
  } catch (error) {
    // 폭죽은 꾸밈이다. 그리기 실패가 저장 흐름을 막지 않는다.
    stop();
    return false;
  }
};
