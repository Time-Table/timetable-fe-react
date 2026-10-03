/**
 * 사이트 머리말 폭을 지금 화면에 맞춘다.
 * 새 표 화면(B)은 PC에서도 휴대폰 폭(480px) 한 줄이라, 그 화면이 떠 있는 동안 머리말을 같은 폭·휴대폰 크기로 그린다
 * (2026-10-02 사람 지시 "새 화면의 pc뷰는 모바일 최적화자나. 그거에 맞게 해더랑 띠도 일치한 경험"). 바닥글은 그대로다.
 *
 *   const off = setShellWidth(480); // 화면이 사라질 때 off()
 */
let current = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

export const setShellWidth = (width) => {
  const entry = { width };
  current = entry;
  notify();
  return () => {
    if (current !== entry) return;
    current = null;
    notify();
  };
};

/** 지금 좁힌 폭(px). 좁히지 않았으면 null. */
export const getShellWidth = () => current?.width ?? null;

export const subscribeShellWidth = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
