// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// 표 화면 A/B 2회차 상태(GET /api/experiments/table-ab)는 테스트에서 기본 꺼짐이다.
// 켜서 보는 테스트는 jest.mocked(getTableAbState).mockResolvedValue({ ok: true, running: true, state: "running" })로 바꾼다.
jest.mock("./api/experiment", () => ({
  getTableAbState: jest.fn(() => Promise.resolve({ ok: true, running: false, state: "off" })),
}));
