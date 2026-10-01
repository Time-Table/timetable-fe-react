/**
 * 사이트 헤더 "?" 단추를 지금 화면의 도움말로 바꿔 쓴다.
 * 새 표 화면(B)은 "?"로 자기 사용법 창을 연다(확정 시안과 같다). 등록한 화면이 없으면 헤더가 사이트 정보를 띄운다.
 *
 *   const off = setPageHelp({ label: "사용법 보기", open }); // 화면이 사라질 때 off()
 */
let current = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

export const setPageHelp = (help) => {
  current = help;
  notify();
  return () => {
    if (current !== help) return;
    current = null;
    notify();
  };
};

export const getPageHelp = () => current;

export const subscribePageHelp = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
